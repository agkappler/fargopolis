"""Unit tests for infrastructure/lambdas/dnd/handler.py, mocking DynamoDB with moto.

Built on the shared fixtures/helpers in `../../conftest.py` and `../../lambda_test_utils.py` --
see `bounties/tests/test_handler.py` for the reference implementation this pattern is copied from.
Tests call `handler()` directly with hand-built API Gateway HTTP API v2 events; the Clerk
authorizer itself is not exercised (see openspec/changes/add-bounties-pytest-scaffolding/design.md
Non-Goals) -- `authenticated`/writer checks are tested through the authorizer-context contract
`require_clerk_writer` reads.

`GET /api/weapon/{id}`, `DELETE /api/deleteWeapon/{id}`, and `DELETE /api/deleteAbility/{id}` take
an optional `characterId` query parameter. When it's given, the handler resolves the owning
character with a single `GetItem` by key; the frontend always has `characterId` on hand for these
calls, so that's the hot path. When it's omitted, `_find_character_id_for_nested` falls back to
scanning the base table for a matching `weaponId`/`abilityId` -- `DndCharactersByNameIndex`
doesn't project `weapons`/`abilities`, so a GSI query for them always comes back empty (see #11).
"""

from __future__ import annotations

import json


def _create_character(dnd_handler, make_event, name="Aria Nightsong", **extra):
    body = {"name": name, **extra}
    event = make_event("POST", "/api/createCharacter", body=body, authenticated=True)
    resp = dnd_handler.handler(event, None)
    return json.loads(resp["body"])


# --- GET /api/characters (name-sorted summary list, no nested collections) -----------------------


def test_get_characters_empty(dnd_handler, make_event):
    resp = dnd_handler.handler(make_event("GET", "/api/characters"), None)
    assert resp["statusCode"] == 200
    assert json.loads(resp["body"]) == []


def test_get_characters_lists_summary_without_nested_collections(dnd_handler, make_event):
    _create_character(dnd_handler, make_event, name="Zorak")
    _create_character(dnd_handler, make_event, name="Aria Nightsong")

    resp = dnd_handler.handler(make_event("GET", "/api/characters"), None)
    items = json.loads(resp["body"])
    assert [c["name"] for c in items] == ["Aria Nightsong", "Zorak"]
    assert "weapons" not in items[0]
    assert "abilities" not in items[0]


# --- GET /api/character/{characterId} -------------------------------------------------------------


def test_get_character_not_found(dnd_handler, make_event):
    resp = dnd_handler.handler(make_event("GET", "/api/character/does-not-exist"), None)
    assert resp["statusCode"] == 404


def test_get_character_success_includes_nested_collections(dnd_handler, make_event):
    created = _create_character(dnd_handler, make_event, race="Elf", level=3)
    resp = dnd_handler.handler(make_event("GET", f"/api/character/{created['characterId']}"), None)
    assert resp["statusCode"] == 200
    body = json.loads(resp["body"])
    assert body["race"] == "Elf"
    assert body["level"] == 3
    assert body["weapons"] == []
    assert body["abilities"] == []


# --- POST /api/createCharacter ----------------------------------------------------------------------


def test_create_character_requires_auth(dnd_handler, make_event):
    event = make_event("POST", "/api/createCharacter", body={"name": "Aria"})
    resp = dnd_handler.handler(event, None)
    assert resp["statusCode"] == 401


def test_create_character_requires_name(dnd_handler, make_event):
    event = make_event("POST", "/api/createCharacter", body={"race": "Elf"}, authenticated=True)
    resp = dnd_handler.handler(event, None)
    assert resp["statusCode"] == 400


def test_create_character_success_persists_item(dnd_handler, dnd_table, make_event):
    created = _create_character(dnd_handler, make_event, className="Rogue", level=5)
    assert created["className"] == "Rogue"
    assert created["level"] == 5

    stored = dnd_table.get_item(Key={"characterId": created["characterId"]})["Item"]
    assert stored["entityType"] == "CHARACTER"
    assert stored["nameSortKey"] == f"aria nightsong#{created['characterId']}"


# --- POST /api/updateCharacter ----------------------------------------------------------------------


def test_update_character_requires_auth(dnd_handler, make_event):
    event = make_event("POST", "/api/updateCharacter", body={"characterId": "c1", "name": "New"})
    resp = dnd_handler.handler(event, None)
    assert resp["statusCode"] == 401


def test_update_character_requires_name(dnd_handler, make_event):
    created = _create_character(dnd_handler, make_event)
    event = make_event(
        "POST", "/api/updateCharacter", body={"characterId": created["characterId"]}, authenticated=True
    )
    resp = dnd_handler.handler(event, None)
    assert resp["statusCode"] == 400


def test_update_character_missing_is_404(dnd_handler, make_event):
    body = {"characterId": "does-not-exist", "name": "New"}
    event = make_event("POST", "/api/updateCharacter", body=body, authenticated=True)
    resp = dnd_handler.handler(event, None)
    assert resp["statusCode"] == 404


def test_update_character_success(dnd_handler, make_event):
    created = _create_character(dnd_handler, make_event)
    body = {"characterId": created["characterId"], "name": "Aria Nightsong", "level": 7}
    event = make_event("POST", "/api/updateCharacter", body=body, authenticated=True)
    resp = dnd_handler.handler(event, None)
    assert resp["statusCode"] == 200
    assert json.loads(resp["body"])["level"] == 7


# --- POST /api/updateAvatar (query-param route) -----------------------------------------------------


def test_update_avatar_requires_auth(dnd_handler, make_event):
    event = make_event("POST", "/api/updateAvatar", query={"characterId": "c1", "fileId": "f1"})
    resp = dnd_handler.handler(event, None)
    assert resp["statusCode"] == 401


def test_update_avatar_requires_file_id(dnd_handler, make_event):
    event = make_event("POST", "/api/updateAvatar", query={"characterId": "c1"}, authenticated=True)
    resp = dnd_handler.handler(event, None)
    assert resp["statusCode"] == 400


def test_update_avatar_missing_file_is_404(dnd_handler, make_event):
    created = _create_character(dnd_handler, make_event)
    event = make_event(
        "POST",
        "/api/updateAvatar",
        query={"characterId": created["characterId"], "fileId": "does-not-exist"},
        authenticated=True,
    )
    resp = dnd_handler.handler(event, None)
    assert resp["statusCode"] == 404


def test_update_avatar_success(dnd_handler, dnd_table, files_table, make_event):
    created = _create_character(dnd_handler, make_event)
    files_table.put_item(Item={"fileId": "f1", "uuId": "uuid-1", "filename": "aria.png"})

    event = make_event(
        "POST",
        "/api/updateAvatar",
        query={"characterId": created["characterId"], "fileId": "f1"},
        authenticated=True,
    )
    resp = dnd_handler.handler(event, None)
    assert resp["statusCode"] == 200
    assert json.loads(resp["body"])["fileId"] == "f1"

    stored = dnd_table.get_item(Key={"characterId": created["characterId"]})["Item"]
    assert stored["avatarFileId"] == "f1"


# --- POST /api/character/addResource + GET .../resourceIds (query-param route) ----------------------


def test_add_resource_requires_auth(dnd_handler, make_event):
    event = make_event("POST", "/api/character/addResource", query={"characterId": "c1", "fileId": "f1"})
    resp = dnd_handler.handler(event, None)
    assert resp["statusCode"] == 401


def test_add_resource_missing_file_is_404(dnd_handler, make_event):
    created = _create_character(dnd_handler, make_event)
    event = make_event(
        "POST",
        "/api/character/addResource",
        query={"characterId": created["characterId"], "fileId": "does-not-exist"},
        authenticated=True,
    )
    resp = dnd_handler.handler(event, None)
    assert resp["statusCode"] == 404


def test_add_resource_success_and_get_resource_ids(dnd_handler, files_table, make_event):
    created = _create_character(dnd_handler, make_event)
    files_table.put_item(Item={"fileId": "f1", "uuId": "uuid-1", "filename": "sheet.pdf"})

    add_event = make_event(
        "POST",
        "/api/character/addResource",
        query={"characterId": created["characterId"], "fileId": "f1"},
        authenticated=True,
    )
    add_resp = dnd_handler.handler(add_event, None)
    assert add_resp["statusCode"] == 200

    ids_resp = dnd_handler.handler(
        make_event("GET", f"/api/character/{created['characterId']}/resourceIds"), None
    )
    assert json.loads(ids_resp["body"]) == ["f1"]


# --- Abilities: GET /api/characterAbilities/{id}, POST /api/addAbility/{id}, PUT updateAbility ------


def test_get_abilities_not_found(dnd_handler, make_event):
    resp = dnd_handler.handler(make_event("GET", "/api/characterAbilities/does-not-exist"), None)
    assert resp["statusCode"] == 404


def test_add_ability_requires_auth(dnd_handler, make_event):
    event = make_event("POST", "/api/addAbility/c1", body={"name": "Rage"})
    resp = dnd_handler.handler(event, None)
    assert resp["statusCode"] == 401


def test_add_ability_success(dnd_handler, make_event):
    created = _create_character(dnd_handler, make_event)
    event = make_event(
        "POST",
        f"/api/addAbility/{created['characterId']}",
        body={"name": "Rage", "source": "class", "usage": "bonus_action"},
        authenticated=True,
    )
    resp = dnd_handler.handler(event, None)
    assert resp["statusCode"] == 200
    ability = json.loads(resp["body"])
    assert ability["name"] == "Rage"
    assert ability["source"] == "CLASS"
    assert ability["usage"] == "BONUS_ACTION"


def test_update_ability_requires_auth(dnd_handler, make_event):
    event = make_event("PUT", "/api/updateAbility/a1", body={"characterId": "c1", "name": "New"})
    resp = dnd_handler.handler(event, None)
    assert resp["statusCode"] == 401


def _add_ability(dnd_handler, make_event, character_id, name="Rage"):
    resp = dnd_handler.handler(
        make_event("POST", f"/api/addAbility/{character_id}", body={"name": name}, authenticated=True),
        None,
    )
    return json.loads(resp["body"])["abilityId"]


def _add_weapon(dnd_handler, make_event, character_id, name="Longsword"):
    resp = dnd_handler.handler(
        make_event(
            "POST", "/api/addWeapon", body={"characterId": character_id, "name": name}, authenticated=True
        ),
        None,
    )
    return json.loads(resp["body"])["weaponId"]


def test_update_ability_success_with_character_id(dnd_handler, make_event):
    created = _create_character(dnd_handler, make_event)
    added = dnd_handler.handler(
        make_event(
            "POST", f"/api/addAbility/{created['characterId']}", body={"name": "Rage"}, authenticated=True
        ),
        None,
    )
    ability_id = json.loads(added["body"])["abilityId"]

    event = make_event(
        "PUT",
        f"/api/updateAbility/{ability_id}",
        body={"characterId": created["characterId"], "name": "Reckless Attack"},
        authenticated=True,
    )
    resp = dnd_handler.handler(event, None)
    assert resp["statusCode"] == 200
    assert json.loads(resp["body"])["name"] == "Reckless Attack"


def test_update_ability_without_character_id_uses_lookup(dnd_handler, make_event):
    created = _create_character(dnd_handler, make_event)
    ability_id = _add_ability(dnd_handler, make_event, created["characterId"])

    event = make_event(
        "PUT", f"/api/updateAbility/{ability_id}", body={"name": "Reckless Attack"}, authenticated=True
    )
    resp = dnd_handler.handler(event, None)
    assert resp["statusCode"] == 200
    assert json.loads(resp["body"])["name"] == "Reckless Attack"


def test_delete_ability_requires_auth(dnd_handler, make_event):
    resp = dnd_handler.handler(make_event("DELETE", "/api/deleteAbility/a1"), None)
    assert resp["statusCode"] == 401


def test_delete_ability_not_found(dnd_handler, make_event):
    _create_character(dnd_handler, make_event)
    event = make_event("DELETE", "/api/deleteAbility/does-not-exist", authenticated=True)
    resp = dnd_handler.handler(event, None)
    assert resp["statusCode"] == 404


def test_delete_ability_not_found_with_character_id(dnd_handler, make_event):
    created = _create_character(dnd_handler, make_event)
    event = make_event(
        "DELETE",
        "/api/deleteAbility/does-not-exist",
        query={"characterId": created["characterId"]},
        authenticated=True,
    )
    resp = dnd_handler.handler(event, None)
    assert resp["statusCode"] == 404


def test_delete_ability_success_with_character_id(dnd_handler, make_event):
    """The `characterId` query param resolves the owner by key, without scanning the table."""
    created = _create_character(dnd_handler, make_event)
    character_id = created["characterId"]
    ability_id = _add_ability(dnd_handler, make_event, character_id)

    event = make_event(
        "DELETE", f"/api/deleteAbility/{ability_id}", query={"characterId": character_id}, authenticated=True
    )
    resp = dnd_handler.handler(event, None)
    assert resp["statusCode"] == 200
    assert json.loads(resp["body"]) == {"message": "Deleted"}

    list_resp = dnd_handler.handler(make_event("GET", f"/api/characterAbilities/{character_id}"), None)
    assert json.loads(list_resp["body"]) == []


def test_delete_ability_without_character_id_uses_lookup(dnd_handler, make_event):
    created = _create_character(dnd_handler, make_event)
    character_id = created["characterId"]
    ability_id = _add_ability(dnd_handler, make_event, character_id)

    event = make_event("DELETE", f"/api/deleteAbility/{ability_id}", authenticated=True)
    resp = dnd_handler.handler(event, None)
    assert resp["statusCode"] == 200
    assert json.loads(resp["body"]) == {"message": "Deleted"}


# --- Weapons: GET /api/characterWeapons/{id}, GET /api/weapon/{id}, POST addWeapon, PUT/DELETE ------


def test_get_weapons_not_found(dnd_handler, make_event):
    resp = dnd_handler.handler(make_event("GET", "/api/characterWeapons/does-not-exist"), None)
    assert resp["statusCode"] == 404


def test_add_weapon_requires_auth(dnd_handler, make_event):
    event = make_event("POST", "/api/addWeapon", body={"characterId": "c1", "name": "Longsword"})
    resp = dnd_handler.handler(event, None)
    assert resp["statusCode"] == 401


def test_add_weapon_requires_character_id(dnd_handler, make_event):
    event = make_event("POST", "/api/addWeapon", body={"name": "Longsword"}, authenticated=True)
    resp = dnd_handler.handler(event, None)
    assert resp["statusCode"] == 400


def test_add_weapon_success(dnd_handler, make_event):
    created = _create_character(dnd_handler, make_event)
    event = make_event(
        "POST",
        "/api/addWeapon",
        body={"characterId": created["characterId"], "name": "Longsword", "damage": "1d8"},
        authenticated=True,
    )
    resp = dnd_handler.handler(event, None)
    assert resp["statusCode"] == 200
    assert json.loads(resp["body"])["name"] == "Longsword"


def test_get_weapon_not_found(dnd_handler, make_event):
    _create_character(dnd_handler, make_event)
    resp = dnd_handler.handler(make_event("GET", "/api/weapon/does-not-exist"), None)
    assert resp["statusCode"] == 404


def test_get_weapon_not_found_with_character_id(dnd_handler, make_event):
    created = _create_character(dnd_handler, make_event)
    event = make_event("GET", "/api/weapon/does-not-exist", query={"characterId": created["characterId"]})
    resp = dnd_handler.handler(event, None)
    assert resp["statusCode"] == 404


def test_get_weapon_success_with_character_id(dnd_handler, make_event):
    """The `characterId` query param resolves the owner by key, without scanning the table."""
    created = _create_character(dnd_handler, make_event)
    character_id = created["characterId"]
    weapon_id = _add_weapon(dnd_handler, make_event, character_id)

    event = make_event("GET", f"/api/weapon/{weapon_id}", query={"characterId": character_id})
    resp = dnd_handler.handler(event, None)
    assert resp["statusCode"] == 200
    body = json.loads(resp["body"])
    assert body["weaponId"] == weapon_id
    assert body["name"] == "Longsword"
    assert body["characterId"] == character_id


def test_get_weapon_without_character_id_uses_lookup(dnd_handler, make_event):
    created = _create_character(dnd_handler, make_event)
    weapon_id = _add_weapon(dnd_handler, make_event, created["characterId"])

    resp = dnd_handler.handler(make_event("GET", f"/api/weapon/{weapon_id}"), None)
    assert resp["statusCode"] == 200
    body = json.loads(resp["body"])
    assert body["weaponId"] == weapon_id
    assert body["name"] == "Longsword"
    assert body["characterId"] == created["characterId"]


def test_update_weapon_success_with_character_id(dnd_handler, make_event):
    created = _create_character(dnd_handler, make_event)
    added = dnd_handler.handler(
        make_event(
            "POST",
            "/api/addWeapon",
            body={"characterId": created["characterId"], "name": "Longsword"},
            authenticated=True,
        ),
        None,
    )
    weapon_id = json.loads(added["body"])["weaponId"]

    event = make_event(
        "PUT",
        f"/api/updateWeapon/{weapon_id}",
        body={"characterId": created["characterId"], "name": "Longsword +1", "damage": "1d8+1"},
        authenticated=True,
    )
    resp = dnd_handler.handler(event, None)
    assert resp["statusCode"] == 200
    assert json.loads(resp["body"])["name"] == "Longsword +1"


def test_update_weapon_without_character_id_uses_lookup(dnd_handler, make_event):
    created = _create_character(dnd_handler, make_event)
    weapon_id = _add_weapon(dnd_handler, make_event, created["characterId"])

    event = make_event(
        "PUT", f"/api/updateWeapon/{weapon_id}", body={"name": "Longsword +1"}, authenticated=True
    )
    resp = dnd_handler.handler(event, None)
    assert resp["statusCode"] == 200
    assert json.loads(resp["body"])["name"] == "Longsword +1"


def test_delete_weapon_requires_auth(dnd_handler, make_event):
    resp = dnd_handler.handler(make_event("DELETE", "/api/deleteWeapon/w1"), None)
    assert resp["statusCode"] == 401


def test_delete_weapon_not_found(dnd_handler, make_event):
    _create_character(dnd_handler, make_event)
    event = make_event("DELETE", "/api/deleteWeapon/does-not-exist", authenticated=True)
    resp = dnd_handler.handler(event, None)
    assert resp["statusCode"] == 404


def test_delete_weapon_not_found_with_character_id(dnd_handler, make_event):
    created = _create_character(dnd_handler, make_event)
    event = make_event(
        "DELETE",
        "/api/deleteWeapon/does-not-exist",
        query={"characterId": created["characterId"]},
        authenticated=True,
    )
    resp = dnd_handler.handler(event, None)
    assert resp["statusCode"] == 404


def test_delete_weapon_success_with_character_id(dnd_handler, make_event):
    """The `characterId` query param resolves the owner by key, without scanning the table."""
    created = _create_character(dnd_handler, make_event)
    character_id = created["characterId"]
    weapon_id = _add_weapon(dnd_handler, make_event, character_id)

    event = make_event(
        "DELETE", f"/api/deleteWeapon/{weapon_id}", query={"characterId": character_id}, authenticated=True
    )
    resp = dnd_handler.handler(event, None)
    assert resp["statusCode"] == 200
    assert json.loads(resp["body"]) == {"message": "Deleted"}

    list_resp = dnd_handler.handler(make_event("GET", f"/api/characterWeapons/{character_id}"), None)
    assert json.loads(list_resp["body"]) == []


def test_delete_weapon_without_character_id_uses_lookup(dnd_handler, make_event):
    created = _create_character(dnd_handler, make_event)
    character_id = created["characterId"]
    weapon_id = _add_weapon(dnd_handler, make_event, character_id)

    resp = dnd_handler.handler(make_event("DELETE", f"/api/deleteWeapon/{weapon_id}", authenticated=True), None)
    assert resp["statusCode"] == 200
    assert json.loads(resp["body"]) == {"message": "Deleted"}

    list_resp = dnd_handler.handler(make_event("GET", f"/api/characterWeapons/{character_id}"), None)
    assert json.loads(list_resp["body"]) == []


def test_delete_weapon_only_affects_owning_character(dnd_handler, make_event):
    char_a = _create_character(dnd_handler, make_event, name="Aria")["characterId"]
    char_b = _create_character(dnd_handler, make_event, name="Brom")["characterId"]
    weapon_a = _add_weapon(dnd_handler, make_event, char_a, name="Rapier")
    weapon_b = _add_weapon(dnd_handler, make_event, char_b, name="Warhammer")

    event = make_event(
        "DELETE", f"/api/deleteWeapon/{weapon_b}", query={"characterId": char_b}, authenticated=True
    )
    resp = dnd_handler.handler(event, None)
    assert resp["statusCode"] == 200

    a_weapons = json.loads(dnd_handler.handler(make_event("GET", f"/api/characterWeapons/{char_a}"), None)["body"])
    assert [w["weaponId"] for w in a_weapons] == [weapon_a]
    assert a_weapons[0]["name"] == "Rapier"

    b_weapons = json.loads(dnd_handler.handler(make_event("GET", f"/api/characterWeapons/{char_b}"), None)["body"])
    assert b_weapons == []


# --- Known spells: GET .../knownSpells, POST .../addKnownSpell, DELETE .../deleteKnownSpell ---------


def test_get_known_spells_empty(dnd_handler, make_event):
    created = _create_character(dnd_handler, make_event)
    resp = dnd_handler.handler(
        make_event("GET", f"/api/character/{created['characterId']}/knownSpells"), None
    )
    assert resp["statusCode"] == 200
    assert json.loads(resp["body"]) == {}


def test_add_known_spell_requires_spell_key(dnd_handler, make_event):
    created = _create_character(dnd_handler, make_event)
    event = make_event(
        "POST",
        f"/api/character/{created['characterId']}/addKnownSpell",
        body={"spellName": "Fireball"},
        authenticated=True,
    )
    resp = dnd_handler.handler(event, None)
    assert resp["statusCode"] == 400


def test_add_known_spell_success_and_replaces_existing_by_key(dnd_handler, make_event):
    created = _create_character(dnd_handler, make_event)
    character_id = created["characterId"]

    dnd_handler.handler(
        make_event(
            "POST",
            f"/api/character/{character_id}/addKnownSpell",
            body={"spellKey": "fireball", "spellName": "Fireball", "spellLevel": 3},
            authenticated=True,
        ),
        None,
    )
    dnd_handler.handler(
        make_event(
            "POST",
            f"/api/character/{character_id}/addKnownSpell",
            body={"spellKey": "fireball", "spellName": "Fireball (upcast)", "spellLevel": 5},
            authenticated=True,
        ),
        None,
    )

    resp = dnd_handler.handler(make_event("GET", f"/api/character/{character_id}/knownSpells"), None)
    spells = json.loads(resp["body"])
    assert list(spells.keys()) == ["fireball"]
    assert spells["fireball"]["spellLevel"] == 5


def test_delete_known_spell_requires_spell_key(dnd_handler, make_event):
    created = _create_character(dnd_handler, make_event)
    event = make_event(
        "DELETE", f"/api/character/{created['characterId']}/deleteKnownSpell", authenticated=True
    )
    resp = dnd_handler.handler(event, None)
    assert resp["statusCode"] == 400


def test_delete_known_spell_success(dnd_handler, make_event):
    created = _create_character(dnd_handler, make_event)
    character_id = created["characterId"]
    dnd_handler.handler(
        make_event(
            "POST",
            f"/api/character/{character_id}/addKnownSpell",
            body={"spellKey": "fireball", "spellName": "Fireball"},
            authenticated=True,
        ),
        None,
    )

    event = make_event(
        "DELETE",
        f"/api/character/{character_id}/deleteKnownSpell",
        query={"spellKey": "fireball"},
        authenticated=True,
    )
    resp = dnd_handler.handler(event, None)
    assert resp["statusCode"] == 200

    spells_resp = dnd_handler.handler(make_event("GET", f"/api/character/{character_id}/knownSpells"), None)
    assert json.loads(spells_resp["body"]) == {}


# --- Routing edge cases ----------------------------------------------------------------------------


def test_unknown_route_is_404(dnd_handler, make_event):
    resp = dnd_handler.handler(make_event("GET", "/api/nope"), None)
    assert resp["statusCode"] == 404


def test_options_returns_200_empty_body(dnd_handler, make_event):
    resp = dnd_handler.handler(make_event("OPTIONS", "/api/characters"), None)
    assert resp["statusCode"] == 200
    assert resp["body"] == ""


# --- Stat block + proficiencies (abilityScores, hitPoints, AC, initiative, speed, proficiencies) ---


FULL_STATS = {
    "abilityScores": {"str": 15, "dex": 14, "con": 13, "int": 12, "wis": 8, "cha": 18},
    "hitPoints": {"current": 9, "max": 12, "temp": 3},
    "armorClass": 16,
    "initiativeBonus": 2,
    "speed": 30,
    "savingThrowProficiencies": ["dex", "cha"],
    "skillProficiencies": ["stealth", "persuasion"],
}

DEFAULT_STATS = {
    "abilityScores": {"str": 10, "dex": 10, "con": 10, "int": 10, "wis": 10, "cha": 10},
    "hitPoints": {"current": 0, "max": 0, "temp": 0},
    "armorClass": 0,
    "initiativeBonus": 0,
    "speed": 0,
    "savingThrowProficiencies": [],
    "skillProficiencies": [],
}


def _get_character_body(dnd_handler, make_event, character_id):
    resp = dnd_handler.handler(make_event("GET", f"/api/character/{character_id}"), None)
    assert resp["statusCode"] == 200
    return json.loads(resp["body"])


def _put_legacy_character(dnd_table, character_id="legacy-1"):
    """A raw item shaped like one written before the stat-block fields existed."""
    dnd_table.put_item(
        Item={
            "characterId": character_id,
            "name": "Old Timer",
            "race": "Dwarf",
            "subrace": "Hill",
            "className": "Cleric",
            "subclassName": "Life",
            "level": 4,
            "entityType": "CHARACTER",
            "nameSortKey": f"old timer#{character_id}",
            "version": 0,
        }
    )
    return character_id


def test_create_character_with_stat_block_round_trips_through_get(dnd_handler, make_event):
    created = _create_character(dnd_handler, make_event, **FULL_STATS)
    for key, value in FULL_STATS.items():
        assert created[key] == value

    body = _get_character_body(dnd_handler, make_event, created["characterId"])
    for key, value in FULL_STATS.items():
        assert body[key] == value


def test_create_character_without_stat_block_uses_defaults(dnd_handler, make_event):
    created = _create_character(dnd_handler, make_event)
    body = _get_character_body(dnd_handler, make_event, created["characterId"])
    for key, value in DEFAULT_STATS.items():
        assert body[key] == value


def test_create_character_partial_ability_scores_default_missing_keys(dnd_handler, make_event):
    created = _create_character(dnd_handler, make_event, abilityScores={"str": 17})
    body = _get_character_body(dnd_handler, make_event, created["characterId"])
    assert body["abilityScores"] == {"str": 17, "dex": 10, "con": 10, "int": 10, "wis": 10, "cha": 10}


def test_update_character_stat_block_persists_and_is_reflected_on_get(dnd_handler, dnd_table, make_event):
    created = _create_character(dnd_handler, make_event)
    character_id = created["characterId"]

    body = {"characterId": character_id, "name": "Aria Nightsong", **FULL_STATS}
    resp = dnd_handler.handler(make_event("POST", "/api/updateCharacter", body=body, authenticated=True), None)
    assert resp["statusCode"] == 200
    updated = json.loads(resp["body"])
    for key, value in FULL_STATS.items():
        assert updated[key] == value

    fetched = _get_character_body(dnd_handler, make_event, character_id)
    for key, value in FULL_STATS.items():
        assert fetched[key] == value

    stored = dnd_table.get_item(Key={"characterId": character_id})["Item"]
    assert int(stored["armorClass"]) == 16


def test_update_character_partial_stats_preserve_unprovided_fields(dnd_handler, dnd_table, make_event):
    """Editing one stat must not reset the others to defaults. The frontend only sends the
    stat fields a user actually filled in (CharacterForm.tsx's buildUpdatePayload), so a
    field the update body omits means "not provided" and must keep its stored value."""
    created = _create_character(dnd_handler, make_event, **FULL_STATS)
    character_id = created["characterId"]

    resp = dnd_handler.handler(
        make_event(
            "POST",
            "/api/updateCharacter",
            body={"characterId": character_id, "name": "Aria Nightsong", "abilityScores": {"str": 20}},
            authenticated=True,
        ),
        None,
    )
    assert resp["statusCode"] == 200
    updated = json.loads(resp["body"])

    expected_scores = {**FULL_STATS["abilityScores"], "str": 20}
    assert updated["abilityScores"] == expected_scores
    assert updated["hitPoints"] == FULL_STATS["hitPoints"]
    assert updated["armorClass"] == FULL_STATS["armorClass"]
    assert updated["initiativeBonus"] == FULL_STATS["initiativeBonus"]
    assert updated["speed"] == FULL_STATS["speed"]
    assert updated["savingThrowProficiencies"] == FULL_STATS["savingThrowProficiencies"]
    assert updated["skillProficiencies"] == FULL_STATS["skillProficiencies"]

    fetched = _get_character_body(dnd_handler, make_event, character_id)
    assert fetched["abilityScores"] == expected_scores
    assert fetched["hitPoints"] == FULL_STATS["hitPoints"]


def test_get_preexisting_character_without_stat_block_returns_defaults(dnd_handler, dnd_table, make_event):
    character_id = _put_legacy_character(dnd_table)

    body = _get_character_body(dnd_handler, make_event, character_id)
    for key, value in DEFAULT_STATS.items():
        assert body[key] == value
    assert body["level"] == 4
    assert body["race"] == "Dwarf"
    assert body["subrace"] == "Hill"
    assert body["weapons"] == []
    assert body["abilities"] == []


def test_update_preexisting_character_without_stat_block_accepts_and_defaults(
    dnd_handler, dnd_table, make_event
):
    character_id = _put_legacy_character(dnd_table)

    resp = dnd_handler.handler(
        make_event(
            "POST",
            "/api/updateCharacter",
            body={"characterId": character_id, "name": "Old Timer"},
            authenticated=True,
        ),
        None,
    )
    assert resp["statusCode"] == 200
    updated = json.loads(resp["body"])
    for key, value in DEFAULT_STATS.items():
        assert updated[key] == value
    stored = dnd_table.get_item(Key={"characterId": character_id})["Item"]
    assert "abilityScores" in stored

    resp = dnd_handler.handler(
        make_event(
            "POST",
            "/api/updateCharacter",
            body={
                "characterId": character_id,
                "name": "Old Timer",
                "armorClass": 14,
                "abilityScores": {"dex": 16},
            },
            authenticated=True,
        ),
        None,
    )
    assert resp["statusCode"] == 200

    fetched = _get_character_body(dnd_handler, make_event, character_id)
    assert fetched["armorClass"] == 14
    assert fetched["abilityScores"] == {"str": 10, "dex": 16, "con": 10, "int": 10, "wis": 10, "cha": 10}


def test_get_characters_list_omits_stat_block_fields(dnd_handler, make_event):
    _create_character(dnd_handler, make_event, **FULL_STATS)

    resp = dnd_handler.handler(make_event("GET", "/api/characters"), None)
    assert resp["statusCode"] == 200
    items = json.loads(resp["body"])
    assert items[0]["name"] == "Aria Nightsong"
    for key in FULL_STATS:
        assert key not in items[0]

"""Unit tests for infrastructure/lambdas/dnd/handler.py, mocking DynamoDB with moto.

Built on the shared fixtures/helpers in `../../conftest.py` and `../../lambda_test_utils.py` --
see `bounties/tests/test_handler.py` for the reference implementation this pattern is copied from.
Tests call `handler()` directly with hand-built API Gateway HTTP API v2 events; the Clerk
authorizer itself is not exercised (see openspec/changes/add-bounties-pytest-scaffolding/design.md
Non-Goals) -- `authenticated`/writer checks are tested through the authorizer-context contract
`require_clerk_writer` reads.

## A real bug this suite found and documents rather than works around

`_find_character_id_for_ability` / `_find_character_id_for_weapon` locate the owning character by
querying `DndCharactersByNameIndex` with `ProjectionExpression="characterId, abilities"` (or
`weapons`) -- but that GSI's real `Projection` (see conftest.py's `DND_BY_NAME_INDEX_SPEC`, copied
from `infrastructure/lib/constructs/dnd-construct.ts`) does NOT include `abilities` or `weapons`.
A DynamoDB GSI can only return attributes it actually projects; requesting one it doesn't project
silently comes back empty, not an error (confirmed directly against moto, which enforces this the
same way real DynamoDB does). So these two lookup functions can never find a match, regardless of
what's actually stored -- and `GET /api/weapon/{id}`, `DELETE /api/deleteWeapon/{id}`, and
`DELETE /api/deleteAbility/{id}` have no other way to resolve the owning character (no `body`
fallback, unlike `_update_ability`/`_update_weapon`). In production, all three routes always 404
today. The tests below (`test_*_currently_fails_due_to_gsi_projection_bug`) capture this as
observed behavior, not intended behavior -- they should be revisited/deleted the moment this is
fixed (e.g. by scanning the base table like `recipes/handler.py`'s
`_find_recipe_id_for_ingredient` does, or by adding `abilities`/`weapons` to the GSI projection).
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


def test_update_ability_success_with_character_id(dnd_handler, make_event):
    """Only the `characterId`-in-body path works -- see the module docstring for why the
    GSI-based `_find_character_id_for_ability` fallback can't."""
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


def test_delete_ability_currently_fails_due_to_gsi_projection_bug(dnd_handler, make_event):
    """See the module docstring: `DELETE /api/deleteAbility/{id}` has no `characterId` fallback
    and always 404s today, even for an ability that exists."""
    created = _create_character(dnd_handler, make_event)
    added = dnd_handler.handler(
        make_event(
            "POST", f"/api/addAbility/{created['characterId']}", body={"name": "Rage"}, authenticated=True
        ),
        None,
    )
    ability_id = json.loads(added["body"])["abilityId"]

    event = make_event("DELETE", f"/api/deleteAbility/{ability_id}", authenticated=True)
    resp = dnd_handler.handler(event, None)
    assert resp["statusCode"] == 404


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


def test_get_weapon_currently_fails_due_to_gsi_projection_bug(dnd_handler, make_event):
    """See the module docstring: `GET /api/weapon/{id}` has no `characterId` fallback and always
    404s today, even for a weapon that exists."""
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

    resp = dnd_handler.handler(make_event("GET", f"/api/weapon/{weapon_id}"), None)
    assert resp["statusCode"] == 404


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


def test_delete_weapon_currently_fails_due_to_gsi_projection_bug(dnd_handler, make_event):
    """See the module docstring: `DELETE /api/deleteWeapon/{id}` has no `characterId` fallback
    and always 404s today, even for a weapon that exists."""
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

    resp = dnd_handler.handler(make_event("DELETE", f"/api/deleteWeapon/{weapon_id}", authenticated=True), None)
    assert resp["statusCode"] == 404


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

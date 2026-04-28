"""
DnD character HTTP API backed by the FargopolisDndCharacters DynamoDB table.

Character-centric design:
- one item per character profile
- nested collections: resourceFileIds, knownSpells, weapons, abilities
"""

from __future__ import annotations

import json
from typing import Any

from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError
from shared.lambda_utils import generate_ulid, json_response, parse_body, require_clerk_writer, table_from_env

DND_TABLE_ENV = "DND_TABLE_NAME"
FILES_TABLE_ENV = "FILES_TABLE_NAME"
DND_BY_NAME_INDEX = "DndCharactersByNameIndex"
ENTITY_CHARACTER = "CHARACTER"

# Must match `fargopolis-web/src/constants/Abilities.ts` (AbilitySource / UsageType).
_VALID_ABILITY_SOURCES = frozenset({"CLASS", "RACE", "FEAT", "OTHER", "BACKGROUND"})
_VALID_USAGE_TYPES = frozenset({"ACTION", "BONUS_ACTION", "REACTION", "FREE", "PASSIVE"})


def _normalize_ability_source(raw: Any) -> str:
    """Persist and return SPA enum strings only (invalid or non-string -> OTHER)."""
    if not isinstance(raw, str) or not raw.strip():
        return "OTHER"
    s = raw.strip().upper()
    return s if s in _VALID_ABILITY_SOURCES else "OTHER"


def _normalize_usage_type(raw: Any) -> str:
    """Persist and return SPA enum strings only (invalid or non-string -> ACTION)."""
    if not isinstance(raw, str) or not raw.strip():
        return "ACTION"
    s = raw.strip().upper()
    return s if s in _VALID_USAGE_TYPES else "ACTION"


def _name_sort_key(name: str, character_id: str) -> str:
    return f"{name.strip().lower()}#{character_id}"


def _as_int(value: Any, default: int = 0) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def _to_api_weapon(item: dict[str, Any]) -> dict[str, Any]:
    return {
        "weaponId": str(item.get("weaponId", "")),
        "characterId": str(item.get("characterId", "")),
        "name": item.get("name", ""),
        "damage": item.get("damage", ""),
        "range": item.get("range", ""),
        "damageType": item.get("damageType", ""),
        "description": item.get("description", ""),
    }


def _to_api_ability(item: dict[str, Any]) -> dict[str, Any]:
    return {
        "abilityId": str(item.get("abilityId", "")),
        "characterId": str(item.get("characterId", "")),
        "name": item.get("name", ""),
        "description": item.get("description", ""),
        "source": _normalize_ability_source(item.get("source")),
        "sourceDescription": item.get("sourceDescription", ""),
        "recovery": item.get("recovery", ""),
        "usage": _normalize_usage_type(item.get("usage")),
    }


def _to_api_known_spell(item: dict[str, Any]) -> dict[str, Any]:
    return {
        "characterId": str(item.get("characterId", "")),
        "spellKey": item.get("spellKey", ""),
        "spellName": item.get("spellName", ""),
        "spellLevel": _as_int(item.get("spellLevel"), 0),
    }


def _to_api_character(item: dict[str, Any], *, include_nested: bool = True) -> dict[str, Any]:
    out = {
        "characterId": str(item.get("characterId", "")),
        "name": item.get("name", ""),
        "race": item.get("race", ""),
        "subrace": item.get("subrace", ""),
        "className": item.get("className", ""),
        "subclassName": item.get("subclassName", ""),
        "level": _as_int(item.get("level"), 1),
        "avatarId": item.get("avatarFileId"),
    }
    if include_nested:
        out["resourceFileIds"] = [str(fid) for fid in (item.get("resourceFileIds") or [])]
        out["weapons"] = [_to_api_weapon(w) for w in (item.get("weapons") or [])]
        out["abilities"] = [_to_api_ability(a) for a in (item.get("abilities") or [])]
        out["knownSpells"] = [_to_api_known_spell(s) for s in (item.get("knownSpells") or [])]
    return out


def _get_character_item(character_id: str) -> tuple[dict[str, Any] | None, dict[str, Any] | None]:
    table = table_from_env(DND_TABLE_ENV)
    response = table.get_item(Key={"characterId": character_id})
    item = response.get("Item")
    if not item:
        return None, json_response(404, {"message": f"Character not found: {character_id}"})
    return item, None


def _get_characters() -> dict[str, Any]:
    table = table_from_env(DND_TABLE_ENV)
    response = table.query(
        IndexName=DND_BY_NAME_INDEX,
        KeyConditionExpression=Key("entityType").eq(ENTITY_CHARACTER),
    )
    items = response.get("Items", [])
    return json_response(200, [_to_api_character(item, include_nested=False) for item in items])


def _get_character(character_id: str) -> dict[str, Any]:
    item, err = _get_character_item(character_id)
    if err:
        return err
    return json_response(200, _to_api_character(item or {}, include_nested=True))


def _create_character(body: dict[str, Any]) -> dict[str, Any]:
    name = (body.get("name") or "").strip()
    if not name:
        raise ValueError("name is required")

    character_id = generate_ulid()
    item = {
        "characterId": character_id,
        "name": name,
        "race": body.get("race") or "",
        "subrace": body.get("subrace") or "",
        "className": body.get("className") or "",
        "subclassName": body.get("subclassName") or "",
        "level": _as_int(body.get("level"), 1),
        "avatarFileId": body.get("avatarId"),
        "resourceFileIds": [],
        "knownSpells": [],
        "weapons": [],
        "abilities": [],
        "entityType": ENTITY_CHARACTER,
        "nameSortKey": _name_sort_key(name, character_id),
        "version": 0,
    }
    table = table_from_env(DND_TABLE_ENV)
    table.put_item(Item=item, ConditionExpression="attribute_not_exists(characterId)")
    return json_response(200, _to_api_character(item))


def _update_character(body: dict[str, Any]) -> dict[str, Any]:
    character_id = str(body.get("characterId") or "").strip()
    if not character_id:
        raise ValueError("characterId is required")
    name = (body.get("name") or "").strip()
    if not name:
        raise ValueError("name is required")

    table = table_from_env(DND_TABLE_ENV)
    table.update_item(
        Key={"characterId": character_id},
        UpdateExpression=(
            "SET #name = :name, race = :race, subrace = :subrace, className = :className, "
            "subclassName = :subclassName, #level = :level, nameSortKey = :nameSortKey "
            "ADD version :one"
        ),
        ExpressionAttributeNames={"#name": "name", "#level": "level"},
        ExpressionAttributeValues={
            ":name": name,
            ":race": body.get("race") or "",
            ":subrace": body.get("subrace") or "",
            ":className": body.get("className") or "",
            ":subclassName": body.get("subclassName") or "",
            ":level": _as_int(body.get("level"), 1),
            ":nameSortKey": _name_sort_key(name, character_id),
            ":one": 1,
        },
        ConditionExpression="attribute_exists(characterId)",
    )
    return _get_character(character_id)


def _update_avatar(event: dict[str, Any]) -> dict[str, Any]:
    query = event.get("queryStringParameters") or {}
    character_id = str(query.get("characterId") or "").strip()
    file_id = str(query.get("fileId") or "").strip()
    if not character_id:
        raise ValueError("characterId is required")
    if not file_id:
        raise ValueError("fileId is required")

    files_table = table_from_env(FILES_TABLE_ENV)
    file_response = files_table.get_item(Key={"fileId": file_id})
    file_item = file_response.get("Item")
    if not file_item:
        return json_response(404, {"message": f"File not found: {file_id}"})

    table = table_from_env(DND_TABLE_ENV)
    table.update_item(
        Key={"characterId": character_id},
        UpdateExpression="SET avatarFileId = :fid ADD version :one",
        ExpressionAttributeValues={":fid": file_id, ":one": 1},
        ConditionExpression="attribute_exists(characterId)",
    )
    return json_response(200, {"url": "", "fileId": file_id, "uuId": file_item.get("uuId"), "filename": file_item.get("filename")})


def _get_resource_ids(character_id: str) -> dict[str, Any]:
    item, err = _get_character_item(character_id)
    if err:
        return err
    resource_file_ids = [str(fid) for fid in (item or {}).get("resourceFileIds") or []]
    return json_response(200, resource_file_ids)


def _add_resource(event: dict[str, Any]) -> dict[str, Any]:
    query = event.get("queryStringParameters") or {}
    character_id = str(query.get("characterId") or "").strip()
    file_id = str(query.get("fileId") or "").strip()
    if not character_id:
        raise ValueError("characterId is required")
    if not file_id:
        raise ValueError("fileId is required")

    files_table = table_from_env(FILES_TABLE_ENV)
    file_response = files_table.get_item(Key={"fileId": file_id})
    file_item = file_response.get("Item")
    if not file_item:
        return json_response(404, {"message": f"File not found: {file_id}"})

    item, err = _get_character_item(character_id)
    if err:
        return err
    if not item:
        return json_response(404, {"message": f"Character not found: {character_id}"})
    resource_file_ids = [str(fid) for fid in (item.get("resourceFileIds") or [])]
    if file_id not in resource_file_ids:
        resource_file_ids.append(file_id)

    table = table_from_env(DND_TABLE_ENV)
    table.update_item(
        Key={"characterId": character_id},
        UpdateExpression="SET resourceFileIds = :resourceFileIds ADD version :one",
        ExpressionAttributeValues={":resourceFileIds": resource_file_ids, ":one": 1},
        ConditionExpression="attribute_exists(characterId)",
    )
    return json_response(200, {"url": "", "fileId": file_id, "uuId": file_item.get("uuId"), "filename": file_item.get("filename")})


def _get_abilities(character_id: str) -> dict[str, Any]:
    item, err = _get_character_item(character_id)
    if err:
        return err
    return json_response(200, [_to_api_ability(a) for a in ((item or {}).get("abilities") or [])])


def _add_ability(character_id: str, body: dict[str, Any]) -> dict[str, Any]:
    item, err = _get_character_item(character_id)
    if err:
        return err
    abilities = list((item or {}).get("abilities") or [])
    ability = {
        "abilityId": str(body.get("abilityId") or generate_ulid()),
        "characterId": character_id,
        "name": body.get("name") or "",
        "description": body.get("description") or "",
        "source": _normalize_ability_source(body.get("source")),
        "sourceDescription": body.get("sourceDescription") or "",
        "recovery": body.get("recovery") or "",
        "usage": _normalize_usage_type(body.get("usage")),
    }
    abilities.append(ability)
    table = table_from_env(DND_TABLE_ENV)
    table.update_item(
        Key={"characterId": character_id},
        UpdateExpression="SET abilities = :abilities ADD version :one",
        ExpressionAttributeValues={":abilities": abilities, ":one": 1},
        ConditionExpression="attribute_exists(characterId)",
    )
    return json_response(200, _to_api_ability(ability))


def _find_character_id_for_ability(ability_id: str) -> str | None:
    table = table_from_env(DND_TABLE_ENV)
    response = table.query(
        IndexName=DND_BY_NAME_INDEX,
        KeyConditionExpression=Key("entityType").eq(ENTITY_CHARACTER),
        ProjectionExpression="characterId, abilities",
    )
    for item in response.get("Items", []):
        for ability in item.get("abilities") or []:
            if str(ability.get("abilityId", "")) == ability_id:
                return str(item.get("characterId", ""))
    return None


def _update_ability(ability_id: str, body: dict[str, Any]) -> dict[str, Any]:
    character_id = str(body.get("characterId") or _find_character_id_for_ability(ability_id) or "").strip()
    if not character_id:
        return json_response(404, {"message": f"Ability not found: {ability_id}"})
    item, err = _get_character_item(character_id)
    if err:
        return err
    abilities = list((item or {}).get("abilities") or [])
    updated = None
    for idx, ability in enumerate(abilities):
        if str(ability.get("abilityId", "")) == ability_id:
            merged = dict(ability)
            merged["name"] = body.get("name") or merged.get("name") or ""
            merged["description"] = body.get("description") or merged.get("description") or ""
            merged["source"] = _normalize_ability_source(
                body.get("source") if body.get("source") is not None else merged.get("source")
            )
            merged["sourceDescription"] = body.get("sourceDescription") or merged.get("sourceDescription") or ""
            merged["recovery"] = body.get("recovery") or merged.get("recovery") or ""
            merged["usage"] = _normalize_usage_type(
                body.get("usage") if body.get("usage") is not None else merged.get("usage")
            )
            abilities[idx] = merged
            updated = merged
            break
    if not updated:
        return json_response(404, {"message": f"Ability not found: {ability_id}"})

    table = table_from_env(DND_TABLE_ENV)
    table.update_item(
        Key={"characterId": character_id},
        UpdateExpression="SET abilities = :abilities ADD version :one",
        ExpressionAttributeValues={":abilities": abilities, ":one": 1},
        ConditionExpression="attribute_exists(characterId)",
    )
    return json_response(200, _to_api_ability(updated))


def _delete_ability(ability_id: str) -> dict[str, Any]:
    character_id = _find_character_id_for_ability(ability_id) or ""
    if not character_id:
        return json_response(404, {"message": f"Ability not found: {ability_id}"})
    item, err = _get_character_item(character_id)
    if err:
        return err
    abilities = [a for a in ((item or {}).get("abilities") or []) if str(a.get("abilityId", "")) != ability_id]
    table = table_from_env(DND_TABLE_ENV)
    table.update_item(
        Key={"characterId": character_id},
        UpdateExpression="SET abilities = :abilities ADD version :one",
        ExpressionAttributeValues={":abilities": abilities, ":one": 1},
        ConditionExpression="attribute_exists(characterId)",
    )
    return json_response(200, {"message": "Deleted"})


def _get_weapons(character_id: str) -> dict[str, Any]:
    item, err = _get_character_item(character_id)
    if err:
        return err
    return json_response(200, [_to_api_weapon(w) for w in ((item or {}).get("weapons") or [])])


def _add_weapon(body: dict[str, Any]) -> dict[str, Any]:
    character_id = str(body.get("characterId") or "").strip()
    if not character_id:
        raise ValueError("characterId is required")
    item, err = _get_character_item(character_id)
    if err:
        return err
    weapons = list((item or {}).get("weapons") or [])
    weapon = {
        "weaponId": str(body.get("weaponId") or generate_ulid()),
        "characterId": character_id,
        "name": body.get("name") or "",
        "damage": body.get("damage") or "",
        "range": body.get("range") or "",
        "damageType": body.get("damageType") or "",
        "description": body.get("description") or "",
    }
    weapons.append(weapon)
    table = table_from_env(DND_TABLE_ENV)
    table.update_item(
        Key={"characterId": character_id},
        UpdateExpression="SET weapons = :weapons ADD version :one",
        ExpressionAttributeValues={":weapons": weapons, ":one": 1},
        ConditionExpression="attribute_exists(characterId)",
    )
    return json_response(200, _to_api_weapon(weapon))


def _find_character_id_for_weapon(weapon_id: str) -> str | None:
    table = table_from_env(DND_TABLE_ENV)
    response = table.query(
        IndexName=DND_BY_NAME_INDEX,
        KeyConditionExpression=Key("entityType").eq(ENTITY_CHARACTER),
        ProjectionExpression="characterId, weapons",
    )
    for item in response.get("Items", []):
        for weapon in item.get("weapons") or []:
            if str(weapon.get("weaponId", "")) == weapon_id:
                return str(item.get("characterId", ""))
    return None


def _get_weapon(weapon_id: str) -> dict[str, Any]:
    character_id = _find_character_id_for_weapon(weapon_id) or ""
    if not character_id:
        return json_response(404, {"message": f"Weapon not found: {weapon_id}"})
    item, err = _get_character_item(character_id)
    if err:
        return err
    for weapon in ((item or {}).get("weapons") or []):
        if str(weapon.get("weaponId", "")) == weapon_id:
            return json_response(200, _to_api_weapon(weapon))
    return json_response(404, {"message": f"Weapon not found: {weapon_id}"})


def _update_weapon(weapon_id: str, body: dict[str, Any]) -> dict[str, Any]:
    character_id = str(body.get("characterId") or _find_character_id_for_weapon(weapon_id) or "").strip()
    if not character_id:
        return json_response(404, {"message": f"Weapon not found: {weapon_id}"})
    item, err = _get_character_item(character_id)
    if err:
        return err
    weapons = list((item or {}).get("weapons") or [])
    updated = None
    for idx, weapon in enumerate(weapons):
        if str(weapon.get("weaponId", "")) == weapon_id:
            merged = dict(weapon)
            merged["name"] = body.get("name") or merged.get("name") or ""
            merged["damage"] = body.get("damage") or merged.get("damage") or ""
            merged["range"] = body.get("range") or merged.get("range") or ""
            merged["damageType"] = body.get("damageType") or merged.get("damageType") or ""
            merged["description"] = body.get("description") or merged.get("description") or ""
            weapons[idx] = merged
            updated = merged
            break
    if not updated:
        return json_response(404, {"message": f"Weapon not found: {weapon_id}"})

    table = table_from_env(DND_TABLE_ENV)
    table.update_item(
        Key={"characterId": character_id},
        UpdateExpression="SET weapons = :weapons ADD version :one",
        ExpressionAttributeValues={":weapons": weapons, ":one": 1},
        ConditionExpression="attribute_exists(characterId)",
    )
    return json_response(200, _to_api_weapon(updated))


def _delete_weapon(weapon_id: str) -> dict[str, Any]:
    character_id = _find_character_id_for_weapon(weapon_id) or ""
    if not character_id:
        return json_response(404, {"message": f"Weapon not found: {weapon_id}"})
    item, err = _get_character_item(character_id)
    if err:
        return err
    weapons = [w for w in ((item or {}).get("weapons") or []) if str(w.get("weaponId", "")) != weapon_id]
    table = table_from_env(DND_TABLE_ENV)
    table.update_item(
        Key={"characterId": character_id},
        UpdateExpression="SET weapons = :weapons ADD version :one",
        ExpressionAttributeValues={":weapons": weapons, ":one": 1},
        ConditionExpression="attribute_exists(characterId)",
    )
    return json_response(200, {"message": "Deleted"})


def _get_known_spells(character_id: str) -> dict[str, Any]:
    item, err = _get_character_item(character_id)
    if err:
        return err
    spells = [_to_api_known_spell(s) for s in ((item or {}).get("knownSpells") or [])]
    out = {spell["spellKey"]: spell for spell in spells}
    return json_response(200, out)


def _add_known_spell(character_id: str, body: dict[str, Any]) -> dict[str, Any]:
    item, err = _get_character_item(character_id)
    if err:
        return err
    known_spells = list((item or {}).get("knownSpells") or [])
    spell_key = str(body.get("spellKey") or "").strip()
    if not spell_key:
        raise ValueError("spellKey is required")
    spell = {
        "characterId": character_id,
        "spellKey": spell_key,
        "spellName": body.get("spellName") or "",
        "spellLevel": _as_int(body.get("spellLevel"), 0),
    }
    replaced = False
    for idx, existing in enumerate(known_spells):
        if str(existing.get("spellKey", "")) == spell_key:
            known_spells[idx] = spell
            replaced = True
            break
    if not replaced:
        known_spells.append(spell)

    table = table_from_env(DND_TABLE_ENV)
    table.update_item(
        Key={"characterId": character_id},
        UpdateExpression="SET knownSpells = :knownSpells ADD version :one",
        ExpressionAttributeValues={":knownSpells": known_spells, ":one": 1},
        ConditionExpression="attribute_exists(characterId)",
    )
    return json_response(200, _to_api_known_spell(spell))


def _delete_known_spell(character_id: str, spell_key: str) -> dict[str, Any]:
    item, err = _get_character_item(character_id)
    if err:
        return err
    known_spells = [s for s in ((item or {}).get("knownSpells") or []) if str(s.get("spellKey", "")) != spell_key]
    table = table_from_env(DND_TABLE_ENV)
    table.update_item(
        Key={"characterId": character_id},
        UpdateExpression="SET knownSpells = :knownSpells ADD version :one",
        ExpressionAttributeValues={":knownSpells": known_spells, ":one": 1},
        ConditionExpression="attribute_exists(characterId)",
    )
    return json_response(200, {"message": "Deleted"})


def handler(event: dict[str, Any], context: Any) -> dict[str, Any]:
    try:
        req = event.get("requestContext") or {}
        http = req.get("http") or {}
        method = http.get("method", "GET").upper()
        raw_path = event.get("rawPath") or ""
        route_key = f"{method} {raw_path}"

        if method == "OPTIONS":
            return {"statusCode": 200, "body": ""}

        if route_key == "GET /api/characters":
            return _get_characters()
        if method == "GET" and raw_path.startswith("/api/character/") and raw_path.endswith("/resourceIds"):
            character_id = raw_path[len("/api/character/") : -len("/resourceIds")].strip("/")
            return _get_resource_ids(character_id)
        if method == "GET" and raw_path.startswith("/api/character/") and raw_path.endswith("/knownSpells"):
            character_id = raw_path[len("/api/character/") : -len("/knownSpells")].strip("/")
            return _get_known_spells(character_id)
        if method == "GET" and raw_path.startswith("/api/character/"):
            return _get_character(raw_path[len("/api/character/") :].strip())

        if method == "GET" and raw_path.startswith("/api/characterAbilities/"):
            return _get_abilities(raw_path[len("/api/characterAbilities/") :].strip())
        if method == "GET" and raw_path.startswith("/api/characterWeapons/"):
            return _get_weapons(raw_path[len("/api/characterWeapons/") :].strip())
        if method == "GET" and raw_path.startswith("/api/weapon/"):
            return _get_weapon(raw_path[len("/api/weapon/") :].strip())

        if route_key == "POST /api/createCharacter":
            err = require_clerk_writer(event)
            if err:
                return err
            return _create_character(parse_body(event))
        if route_key == "POST /api/updateCharacter":
            err = require_clerk_writer(event)
            if err:
                return err
            return _update_character(parse_body(event))
        if route_key == "POST /api/updateAvatar":
            err = require_clerk_writer(event)
            if err:
                return err
            return _update_avatar(event)
        if route_key == "POST /api/character/addResource":
            err = require_clerk_writer(event)
            if err:
                return err
            return _add_resource(event)
        if method == "POST" and raw_path.startswith("/api/addAbility/"):
            err = require_clerk_writer(event)
            if err:
                return err
            return _add_ability(raw_path[len("/api/addAbility/") :].strip(), parse_body(event))
        if route_key == "POST /api/addWeapon":
            err = require_clerk_writer(event)
            if err:
                return err
            return _add_weapon(parse_body(event))
        if method == "PUT" and raw_path.startswith("/api/updateWeapon/"):
            err = require_clerk_writer(event)
            if err:
                return err
            return _update_weapon(raw_path[len("/api/updateWeapon/") :].strip(), parse_body(event))
        if method == "DELETE" and raw_path.startswith("/api/deleteWeapon/"):
            err = require_clerk_writer(event)
            if err:
                return err
            return _delete_weapon(raw_path[len("/api/deleteWeapon/") :].strip())
        if method == "PUT" and raw_path.startswith("/api/updateAbility/"):
            err = require_clerk_writer(event)
            if err:
                return err
            return _update_ability(raw_path[len("/api/updateAbility/") :].strip(), parse_body(event))
        if method == "DELETE" and raw_path.startswith("/api/deleteAbility/"):
            err = require_clerk_writer(event)
            if err:
                return err
            return _delete_ability(raw_path[len("/api/deleteAbility/") :].strip())
        if method == "POST" and raw_path.startswith("/api/character/") and raw_path.endswith("/addKnownSpell"):
            err = require_clerk_writer(event)
            if err:
                return err
            character_id = raw_path[len("/api/character/") : -len("/addKnownSpell")].strip("/")
            return _add_known_spell(character_id, parse_body(event))
        if method == "DELETE" and raw_path.startswith("/api/character/") and raw_path.endswith("/deleteKnownSpell"):
            err = require_clerk_writer(event)
            if err:
                return err
            character_id = raw_path[len("/api/character/") : -len("/deleteKnownSpell")].strip("/")
            query = event.get("queryStringParameters") or {}
            spell_key = str(query.get("spellKey") or "").strip()
            if not spell_key:
                raise ValueError("spellKey is required")
            return _delete_known_spell(character_id, spell_key)

        return json_response(404, {"message": "Not found", "routeKey": route_key})
    except json.JSONDecodeError:
        return json_response(400, {"message": "Invalid JSON body"})
    except ValueError as e:
        return json_response(400, {"message": str(e)})
    except ClientError as e:
        code = e.response.get("Error", {}).get("Code", "")
        if code == "ConditionalCheckFailedException":
            return json_response(404, {"message": "DnD character not found"})
        return json_response(500, {"message": code or str(e)})
    except Exception as e:
        return json_response(500, {"message": str(e)})

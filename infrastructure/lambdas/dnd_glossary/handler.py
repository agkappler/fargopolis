"""
DnD glossary HTTP API: custom races (nested traits) and subclasses (nested features).

Backed by DynamoDB tables from DndGlossaryConstruct. Mirrors Java DndRaceController and
DndSubclassController behavior (including authenticated-only empty list for custom races).
"""

from __future__ import annotations

import json
from decimal import Decimal
from typing import Any

from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError
from shared.lambda_utils import (
    authorizer_lambda_context,
    generate_ulid,
    json_response,
    parse_body,
    require_clerk_writer,
    table_from_env,
)

RACES_TABLE_ENV = "DND_GLOSSARY_RACES_TABLE_NAME"
SUBCLASSES_TABLE_ENV = "DND_GLOSSARY_SUBCLASSES_TABLE_NAME"

ENTITY_RACE = "RACE"
RACES_BY_NAME_INDEX = "DndGlossaryRacesByNameIndex"
SUBCLASSES_BY_CLASS_INDEX = "DndGlossarySubclassesByClassIndex"


def _is_clerk_authenticated(event: dict[str, Any]) -> bool:
    ctx = authorizer_lambda_context(event)
    return ctx.get("authenticated") == "true" and bool(ctx.get("sub"))


def _parse_json_body(event: dict[str, Any]) -> Any:
    raw = event.get("body") or "null"
    if event.get("isBase64Encoded"):
        import base64

        raw = base64.b64decode(raw).decode("utf-8")
    if not raw.strip():
        return None
    return json.loads(raw)


def _name_sort_key(name: str, entity_id: str) -> str:
    return f"{name.strip().lower()}#{entity_id}"


def _slug_index(name: str) -> str:
    return name.strip().lower()


def _subclass_index(name: str) -> str:
    return name.strip().lower().replace(" ", "_")


def _as_int(value: Any, default: int = 0) -> int:
    if isinstance(value, Decimal):
        return int(value)
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def _as_bool(value: Any, default: bool = False) -> bool:
    if isinstance(value, bool):
        return value
    if value in (None, ""):
        return default
    if isinstance(value, (int, float, Decimal)):
        return bool(int(value))
    if isinstance(value, str):
        return value.lower() in ("true", "1", "yes")
    return default


def _to_api_trait(t: dict[str, Any]) -> dict[str, Any]:
    return {
        "raceTraitId": str(t.get("raceTraitId", "")),
        "name": t.get("name", ""),
        "description": t.get("description", ""),
    }


def _to_api_race_summary(item: dict[str, Any]) -> dict[str, Any]:
    return {
        "raceId": str(item.get("raceId", "")),
        "name": item.get("name", ""),
        "index": item.get("index", ""),
        "description": item.get("description", ""),
    }


def _to_api_subclass(item: dict[str, Any]) -> dict[str, Any]:
    return {
        "subclassId": str(item.get("subclassId", "")),
        "name": item.get("name", ""),
        "index": item.get("index", ""),
        "classIndex": item.get("classIndex", ""),
        "isCustomClass": _as_bool(item.get("isCustomClass"), False),
        "isCustom": _as_bool(item.get("isCustom"), True),
    }


def _to_api_feature(f: dict[str, Any]) -> dict[str, Any]:
    return {
        "subclassFeatureId": str(f.get("subclassFeatureId", "")),
        "subclassId": str(f.get("subclassId", "")),
        "name": f.get("name", ""),
        "description": f.get("description", ""),
        "level": _as_int(f.get("level"), 0),
    }


def _get_races_table():
    return table_from_env(RACES_TABLE_ENV)


def _get_subclasses_table():
    return table_from_env(SUBCLASSES_TABLE_ENV)


def _get_races_list(event: dict[str, Any]) -> dict[str, Any]:
    if not _is_clerk_authenticated(event):
        return json_response(200, [])
    table = _get_races_table()
    response = table.query(
        IndexName=RACES_BY_NAME_INDEX,
        KeyConditionExpression=Key("entityType").eq(ENTITY_RACE),
    )
    items = response.get("Items", [])
    return json_response(200, [_to_api_race_summary(i) for i in items])


def _get_race(race_id: str, event: dict[str, Any]) -> dict[str, Any]:
    if not _is_clerk_authenticated(event):
        return {"statusCode": 200, "headers": {"Content-Type": "application/json"}, "body": "null"}
    table = _get_races_table()
    res = table.get_item(Key={"raceId": race_id})
    item = res.get("Item")
    if not item:
        return json_response(404, {"message": f"Race not found: {race_id}"})
    return json_response(200, _to_api_race_summary(item))


def _get_traits(race_id: str) -> dict[str, Any]:
    table = _get_races_table()
    res = table.get_item(Key={"raceId": race_id})
    item = res.get("Item")
    if not item:
        return json_response(404, {"message": f"Race not found: {race_id}"})
    traits = [_to_api_trait(t) for t in (item.get("traits") or [])]
    return json_response(200, traits)


def _create_race(body: dict[str, Any]) -> dict[str, Any]:
    name = (body.get("name") or "").strip()
    if not name:
        raise ValueError("name is required")
    description = str(body.get("description") or "")
    race_id = generate_ulid()
    index = _slug_index(name)
    item = {
        "raceId": race_id,
        "name": name,
        "description": description,
        "index": index,
        "traits": [],
        "entityType": ENTITY_RACE,
        "nameSortKey": _name_sort_key(name, race_id),
        "version": 0,
    }
    table = _get_races_table()
    table.put_item(Item=item, ConditionExpression="attribute_not_exists(raceId)")
    return json_response(200, _to_api_race_summary(item))


def _normalize_traits_payload(raw: Any, race_id: str) -> list[dict[str, Any]]:
    if not isinstance(raw, list):
        raise ValueError("Request body must be a JSON array of traits")
    out: list[dict[str, Any]] = []
    for entry in raw:
        if not isinstance(entry, dict):
            continue
        tid = str(entry.get("raceTraitId") or "").strip()
        if not tid:
            tid = generate_ulid()
        out.append(
            {
                "raceTraitId": tid,
                "name": str(entry.get("name") or "").strip(),
                "description": str(entry.get("description") or "").strip(),
            }
        )
    return out


def _update_traits(race_id: str, event: dict[str, Any]) -> dict[str, Any]:
    traits = _normalize_traits_payload(_parse_json_body(event), race_id)
    table = _get_races_table()
    table.update_item(
        Key={"raceId": race_id},
        UpdateExpression="SET traits = :traits ADD version :one",
        ExpressionAttributeValues={":traits": traits, ":one": 1},
        ConditionExpression="attribute_exists(raceId)",
    )
    return json_response(200, [_to_api_trait(t) for t in traits])


def _get_subclass(subclass_id: str) -> dict[str, Any]:
    table = _get_subclasses_table()
    res = table.get_item(Key={"subclassId": subclass_id})
    item = res.get("Item")
    if not item:
        return json_response(404, {"message": f"Subclass not found: {subclass_id}"})
    return json_response(200, _to_api_subclass(item))


def _get_subclasses_by_class(class_index: str) -> dict[str, Any]:
    table = _get_subclasses_table()
    response = table.query(
        IndexName=SUBCLASSES_BY_CLASS_INDEX,
        KeyConditionExpression=Key("classIndex").eq(class_index),
    )
    items = response.get("Items", [])
    return json_response(200, [_to_api_subclass(i) for i in items])


def _get_features(subclass_id: str) -> dict[str, Any]:
    table = _get_subclasses_table()
    res = table.get_item(Key={"subclassId": subclass_id})
    item = res.get("Item")
    if not item:
        return json_response(404, {"message": f"Subclass not found: {subclass_id}"})
    feats = [_to_api_feature(f) for f in (item.get("features") or [])]
    return json_response(200, feats)


def _normalize_features_payload(raw: Any, subclass_id: str) -> list[dict[str, Any]]:
    if not isinstance(raw, list):
        raise ValueError("Request body must be a JSON array of features")
    out: list[dict[str, Any]] = []
    for entry in raw:
        if not isinstance(entry, dict):
            continue
        fid = str(entry.get("subclassFeatureId") or "").strip()
        if not fid:
            fid = generate_ulid()
        out.append(
            {
                "subclassFeatureId": fid,
                "subclassId": subclass_id,
                "name": str(entry.get("name") or "").strip(),
                "description": str(entry.get("description") or "").strip(),
                "level": _as_int(entry.get("level"), 0),
            }
        )
    return out


def _update_features(subclass_id: str, event: dict[str, Any]) -> dict[str, Any]:
    features = _normalize_features_payload(_parse_json_body(event), subclass_id)
    table = _get_subclasses_table()
    table.update_item(
        Key={"subclassId": subclass_id},
        UpdateExpression="SET features = :features ADD version :one",
        ExpressionAttributeValues={":features": features, ":one": 1},
        ConditionExpression="attribute_exists(subclassId)",
    )
    return json_response(200, [_to_api_feature(f) for f in features])


def _create_subclass(body: dict[str, Any]) -> dict[str, Any]:
    name = (body.get("name") or "").strip()
    if not name:
        raise ValueError("name is required")
    class_index = str(body.get("classIndex") or "").strip()
    if not class_index:
        raise ValueError("classIndex is required")
    subclass_id = generate_ulid()
    is_custom_class = _as_bool(body.get("isCustomClass"), False)
    index = (body.get("index") or "").strip() or _subclass_index(name)
    item = {
        "subclassId": subclass_id,
        "name": name,
        "classIndex": class_index,
        "index": index,
        "isCustomClass": is_custom_class,
        "isCustom": True,
        "features": [],
        "nameSortKey": _name_sort_key(name, subclass_id),
        "version": 0,
    }
    table = _get_subclasses_table()
    table.put_item(Item=item, ConditionExpression="attribute_not_exists(subclassId)")
    return json_response(200, _to_api_subclass(item))


def _update_subclass(subclass_id: str, body: dict[str, Any]) -> dict[str, Any]:
    name = (body.get("name") or "").strip()
    if not name:
        raise ValueError("name is required")
    class_index = str(body.get("classIndex") or "").strip()
    if not class_index:
        raise ValueError("classIndex is required")
    is_custom_class = _as_bool(body.get("isCustomClass"), False)
    index = (body.get("index") or "").strip() or _subclass_index(name)
    table = _get_subclasses_table()
    table.update_item(
        Key={"subclassId": subclass_id},
        UpdateExpression=(
            "SET #n = :name, classIndex = :classIndex, #idx = :index, "
            "isCustomClass = :isCustomClass, nameSortKey = :nameSortKey ADD version :one"
        ),
        ExpressionAttributeNames={"#n": "name", "#idx": "index"},
        ExpressionAttributeValues={
            ":name": name,
            ":classIndex": class_index,
            ":index": index,
            ":isCustomClass": is_custom_class,
            ":nameSortKey": _name_sort_key(name, subclass_id),
            ":one": 1,
        },
        ConditionExpression="attribute_exists(subclassId)",
    )
    res = table.get_item(Key={"subclassId": subclass_id})
    item = res.get("Item") or {}
    return json_response(200, _to_api_subclass(item))


def _delete_subclass(subclass_id: str) -> dict[str, Any]:
    table = _get_subclasses_table()
    table.delete_item(Key={"subclassId": subclass_id}, ConditionExpression="attribute_exists(subclassId)")
    return json_response(200, {})


def handler(event: dict[str, Any], context: Any) -> dict[str, Any]:
    try:
        req = event.get("requestContext") or {}
        http = req.get("http") or {}
        method = (http.get("method") or "GET").upper()
        raw_path = event.get("rawPath") or ""
        route_key = f"{method} {raw_path}"
        params = event.get("pathParameters") or {}

        if method == "OPTIONS":
            return {"statusCode": 200, "body": ""}

        if route_key == "GET /api/races":
            return _get_races_list(event)

        if method == "GET" and raw_path.startswith("/api/races/") and raw_path.endswith("/traits"):
            race_id = (params.get("raceId") or "").strip()
            if not race_id:
                raise ValueError("raceId is required")
            return _get_traits(race_id)

        if method == "POST" and raw_path.startswith("/api/races/") and raw_path.endswith("/updateTraits"):
            err = require_clerk_writer(event)
            if err:
                return err
            race_id = (params.get("raceId") or "").strip()
            if not race_id:
                raise ValueError("raceId is required")
            return _update_traits(race_id, event)

        if method == "GET" and raw_path.startswith("/api/races/"):
            race_id = (params.get("raceId") or raw_path.removeprefix("/api/races/").strip("/")).strip()
            if race_id and race_id != "traits":
                return _get_race(race_id, event)

        if route_key == "POST /api/createRace":
            err = require_clerk_writer(event)
            if err:
                return err
            return _create_race(parse_body(event))

        if method == "GET" and raw_path.startswith("/api/subclasses/class/"):
            rest = raw_path.removeprefix("/api/subclasses/class/").strip("/")
            class_index = (params.get("classIndex") or (rest.split("/")[0] if rest else "")).strip()
            if not class_index:
                raise ValueError("classIndex is required")
            return _get_subclasses_by_class(class_index)

        if method == "GET" and raw_path.startswith("/api/subclasses/") and raw_path.endswith("/features"):
            subclass_id = (params.get("subclassId") or "").strip()
            if not subclass_id:
                raise ValueError("subclassId is required")
            return _get_features(subclass_id)

        if method == "POST" and raw_path.startswith("/api/subclasses/") and raw_path.endswith("/updateFeatures"):
            err = require_clerk_writer(event)
            if err:
                return err
            subclass_id = (params.get("subclassId") or "").strip()
            if not subclass_id:
                raise ValueError("subclassId is required")
            return _update_features(subclass_id, event)

        if route_key == "POST /api/subclasses/createSubclass":
            err = require_clerk_writer(event)
            if err:
                return err
            return _create_subclass(parse_body(event))

        if route_key == "POST /api/createSubclass":
            err = require_clerk_writer(event)
            if err:
                return err
            return _create_subclass(parse_body(event))

        if method == "PUT" and raw_path.startswith("/api/subclasses/updateSubclass/"):
            err = require_clerk_writer(event)
            if err:
                return err
            sid = (params.get("subclassId") or raw_path.removeprefix("/api/subclasses/updateSubclass/").strip("/")).split(
                "/"
            )[0].strip()
            if not sid:
                raise ValueError("subclassId is required")
            return _update_subclass(sid, parse_body(event))

        if route_key == "POST /api/updateSubclass":
            err = require_clerk_writer(event)
            if err:
                return err
            body = parse_body(event)
            sid = str(body.get("subclassId") or "").strip()
            if not sid:
                raise ValueError("subclassId is required")
            return _update_subclass(sid, body)

        if method == "DELETE" and raw_path.startswith("/api/subclasses/deleteSubclass/"):
            err = require_clerk_writer(event)
            if err:
                return err
            sid = (params.get("subclassId") or raw_path.removeprefix("/api/subclasses/deleteSubclass/").strip("/")).split(
                "/"
            )[0].strip()
            if not sid:
                raise ValueError("subclassId is required")
            return _delete_subclass(sid)

        if method == "GET" and raw_path.startswith("/api/subclasses/"):
            subclass_id = (params.get("subclassId") or "").strip()
            if not subclass_id:
                tail = raw_path.removeprefix("/api/subclasses/").strip("/").split("/")[0]
                subclass_id = tail.strip()
            if subclass_id and subclass_id != "class":
                return _get_subclass(subclass_id)

        return json_response(404, {"message": "Not found", "routeKey": route_key})
    except json.JSONDecodeError:
        return json_response(400, {"message": "Invalid JSON body"})
    except ValueError as e:
        return json_response(400, {"message": str(e)})
    except ClientError as e:
        code = e.response.get("Error", {}).get("Code", "")
        if code in ("ConditionalCheckFailedException", "TransactionCanceledException"):
            return json_response(404, {"message": "Resource not found"})
        return json_response(500, {"message": code or str(e)})
    except Exception as e:
        return json_response(500, {"message": str(e)})

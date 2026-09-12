"""
Camping HTTP API backed by the FargopolisCampsites DynamoDB table.

One item per campsite (place-centric), with a nested `visits` list recording
each stay. Later changes add photo references.

Routes:
- GET    /api/campsites
- GET    /api/campsite/{campsiteId}
- POST   /api/createCampsite
- POST   /api/updateCampsite
- DELETE /api/campsite/{campsiteId}
- POST   /api/addVisitToCampsite/{campsiteId}
- POST   /api/updateVisit
- POST   /api/deleteVisit
"""

from __future__ import annotations

import json
from datetime import date
from decimal import Decimal, InvalidOperation
from typing import Any

from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError
from shared.lambda_utils import (
    generate_ulid,
    json_response,
    parse_body,
    require_clerk_writer,
    table_from_env,
)

CAMPSITES_TABLE_ENV = "CAMPSITES_TABLE_NAME"
CAMPSITES_BY_NAME_INDEX = "CampsitesByNameIndex"
ENTITY_CAMPSITE = "CAMPSITE"
CAMPSITE_ROUTE_PREFIX = "/api/campsite/"
ADD_VISIT_ROUTE_PREFIX = "/api/addVisitToCampsite/"

_RATING_FIELDS = ("views", "privacy", "space")


def _make_name_sort_key(name: str, campsite_id: str) -> str:
    return f"{name.strip().lower()}#{campsite_id}"


def _to_decimal(value: Any) -> Decimal:
    try:
        return Decimal(str(value))
    except (InvalidOperation, ValueError, TypeError) as exc:
        raise ValueError("Coordinates must be numbers") from exc


def _coord(value: Any, *, lo: float, hi: float, label: str) -> Decimal:
    if value is None or value == "":
        raise ValueError(f"{label} is required")
    dec = _to_decimal(value)
    if dec < Decimal(str(lo)) or dec > Decimal(str(hi)):
        raise ValueError(f"{label} must be between {lo} and {hi}")
    return dec


def _opt_rating(value: Any, label: str) -> int | None:
    if value is None or value == "":
        return None
    try:
        rating = int(value)
    except (ValueError, TypeError) as exc:
        raise ValueError(f"{label} must be a whole number from 1 to 5") from exc
    if rating < 1 or rating > 5:
        raise ValueError(f"{label} must be between 1 and 5")
    return rating


def _opt_int(value: Any, label: str) -> int | None:
    if value is None or value == "":
        return None
    try:
        parsed = int(value)
    except (ValueError, TypeError) as exc:
        raise ValueError(f"{label} must be a whole number") from exc
    if parsed < 0:
        raise ValueError(f"{label} must not be negative")
    return parsed


def _opt_str(value: Any) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def _iso_date(value: Any, label: str) -> str:
    text = str(value or "").strip()
    if not text:
        raise ValueError(f"{label} is required")
    try:
        date.fromisoformat(text)
    except ValueError as exc:
        raise ValueError(f"{label} must be a valid date (YYYY-MM-DD)") from exc
    return text


def _opt_iso_date(value: Any, label: str) -> str | None:
    if value is None or value == "":
        return None
    return _iso_date(value, label)


def _opt_bool(value: Any) -> bool | None:
    if value is None or value == "":
        return None
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        lowered = value.strip().lower()
        if lowered in ("true", "yes", "1"):
            return True
        if lowered in ("false", "no", "0"):
            return False
    raise ValueError("firepit must be true, false, or omitted")


def _campsite_fields_from_body(body: dict[str, Any]) -> dict[str, Any]:
    name = (body.get("name") or "").strip()
    if not name:
        raise ValueError("name is required")

    fields: dict[str, Any] = {
        "name": name,
        "lat": _coord(body.get("lat"), lo=-90, hi=90, label="lat"),
        "lng": _coord(body.get("lng"), lo=-180, hi=180, label="lng"),
        "region": _opt_str(body.get("region")),
        "park": _opt_str(body.get("park")),
        "travelTimeMinutes": _opt_int(body.get("travelTimeMinutes"), "travelTimeMinutes"),
        "dyrtUrl": _opt_str(body.get("dyrtUrl")),
        "firepit": _opt_bool(body.get("firepit")),
        "notes": _opt_str(body.get("notes")),
    }
    for rating_field in _RATING_FIELDS:
        fields[rating_field] = _opt_rating(body.get(rating_field), rating_field)
    return fields


def _visit_from_body(body: dict[str, Any], *, visit_id: str | None = None) -> dict[str, Any]:
    start_date = _iso_date(body.get("startDate"), "startDate")
    end_date = _opt_iso_date(body.get("endDate"), "endDate")
    if end_date is not None and end_date < start_date:
        raise ValueError("endDate must be on or after startDate")

    people_raw = body.get("people") or []
    if not isinstance(people_raw, list):
        raise ValueError("people must be a list of names")
    people = [str(p).strip() for p in people_raw if str(p).strip()]

    return {
        "visitId": visit_id or str(body.get("visitId") or "").strip() or generate_ulid(),
        "startDate": start_date,
        "endDate": end_date,
        "people": people,
        "notes": _opt_str(body.get("notes")) or "",
        "weather": _opt_str(body.get("weather")),
        "rating": _opt_rating(body.get("rating"), "rating"),
    }


def _recompute_visit_summary(visits: list[dict[str, Any]]) -> tuple[int, str | None]:
    if not visits:
        return 0, None
    return len(visits), max(v["startDate"] for v in visits)


def _to_api_visit(item: dict[str, Any]) -> dict[str, Any]:
    return {
        "visitId": str(item.get("visitId", "")),
        "startDate": item.get("startDate"),
        "endDate": item.get("endDate"),
        "people": list(item.get("people") or []),
        "notes": item.get("notes", ""),
        "weather": item.get("weather"),
        "rating": item.get("rating"),
    }


def _to_api_campsite(item: dict[str, Any]) -> dict[str, Any]:
    return {
        "campsiteId": str(item["campsiteId"]),
        "name": item.get("name", ""),
        "lat": item.get("lat"),
        "lng": item.get("lng"),
        "region": item.get("region"),
        "park": item.get("park"),
        "travelTimeMinutes": item.get("travelTimeMinutes"),
        "dyrtUrl": item.get("dyrtUrl"),
        "firepit": item.get("firepit"),
        "views": item.get("views"),
        "privacy": item.get("privacy"),
        "space": item.get("space"),
        "notes": item.get("notes"),
        "coverPhotoId": item.get("coverPhotoId"),
        "visitCount": int(item.get("visitCount") or 0),
        "lastVisitDate": item.get("lastVisitDate"),
        "visits": [
            _to_api_visit(v)
            for v in sorted(item.get("visits") or [], key=lambda v: v.get("startDate") or "", reverse=True)
        ],
    }


def _to_api_campsite_list_entry(item: dict[str, Any]) -> dict[str, Any]:
    return {
        "campsiteId": str(item["campsiteId"]),
        "name": item.get("name", ""),
        "lat": item.get("lat"),
        "lng": item.get("lng"),
        "region": item.get("region"),
        "park": item.get("park"),
        "travelTimeMinutes": item.get("travelTimeMinutes"),
        "dyrtUrl": item.get("dyrtUrl"),
        "firepit": item.get("firepit"),
        "views": item.get("views"),
        "privacy": item.get("privacy"),
        "space": item.get("space"),
        "coverPhotoId": item.get("coverPhotoId"),
        "visitCount": int(item.get("visitCount") or 0),
        "lastVisitDate": item.get("lastVisitDate"),
    }


def _list_campsites() -> dict[str, Any]:
    table = table_from_env(CAMPSITES_TABLE_ENV)
    response = table.query(
        IndexName=CAMPSITES_BY_NAME_INDEX,
        KeyConditionExpression=Key("entityType").eq(ENTITY_CAMPSITE),
    )
    items = response.get("Items", [])
    return json_response(200, [_to_api_campsite_list_entry(i) for i in items])


def _get_campsite(campsite_id: str) -> dict[str, Any]:
    if not campsite_id:
        raise ValueError("campsiteId is required")
    table = table_from_env(CAMPSITES_TABLE_ENV)
    response = table.get_item(Key={"campsiteId": campsite_id})
    item = response.get("Item")
    if not item:
        return json_response(404, {"message": f"Campsite not found: {campsite_id}"})
    return json_response(200, _to_api_campsite(item))


def _get_campsite_item_or_404(campsite_id: str) -> tuple[dict[str, Any] | None, dict[str, Any] | None]:
    table = table_from_env(CAMPSITES_TABLE_ENV)
    response = table.get_item(Key={"campsiteId": campsite_id})
    item = response.get("Item")
    if not item:
        return None, json_response(404, {"message": f"Campsite not found: {campsite_id}"})
    return item, None


def _write_visits(campsite_id: str, visits: list[dict[str, Any]], old_version: Any) -> dict[str, Any] | None:
    """Persist a mutated visits list under the campsite's optimistic-concurrency version.

    Returns an error response (404 if the campsite vanished, 409 if the version
    is stale) or ``None`` on success.
    """
    visit_count, last_visit_date = _recompute_visit_summary(visits)
    expr_values: dict[str, Any] = {":visits": visits, ":vc": visit_count, ":one": 1, ":old": old_version}
    if last_visit_date is None:
        update_expr = "SET visits = :visits, visitCount = :vc REMOVE lastVisitDate ADD version :one"
    else:
        expr_values[":lvd"] = last_visit_date
        update_expr = "SET visits = :visits, visitCount = :vc, lastVisitDate = :lvd ADD version :one"

    table = table_from_env(CAMPSITES_TABLE_ENV)
    try:
        table.update_item(
            Key={"campsiteId": campsite_id},
            UpdateExpression=update_expr,
            ExpressionAttributeValues=expr_values,
            ConditionExpression="version = :old",
        )
    except ClientError as exc:
        if exc.response.get("Error", {}).get("Code") == "ConditionalCheckFailedException":
            _, missing_err = _get_campsite_item_or_404(campsite_id)
            if missing_err:
                return missing_err
            return json_response(409, {"message": "Campsite changed elsewhere; reload and try again."})
        raise
    return None


def _add_visit(campsite_id: str, body: dict[str, Any]) -> dict[str, Any]:
    campsite_id = campsite_id.strip()
    if not campsite_id:
        raise ValueError("campsiteId is required")
    item, err = _get_campsite_item_or_404(campsite_id)
    if err:
        return err
    visits = list(item.get("visits") or [])
    visits.append(_visit_from_body(body))
    write_err = _write_visits(campsite_id, visits, item.get("version"))
    if write_err:
        return write_err
    return _get_campsite(campsite_id)


def _update_visit(body: dict[str, Any]) -> dict[str, Any]:
    campsite_id = str(body.get("campsiteId") or "").strip()
    visit_id = str(body.get("visitId") or "").strip()
    if not campsite_id:
        raise ValueError("campsiteId is required")
    if not visit_id:
        raise ValueError("visitId is required")

    item, err = _get_campsite_item_or_404(campsite_id)
    if err:
        return err
    visits = list(item.get("visits") or [])
    index = next((i for i, v in enumerate(visits) if str(v.get("visitId")) == visit_id), None)
    if index is None:
        return json_response(404, {"message": f"Visit not found: {visit_id}"})
    visits[index] = _visit_from_body(body, visit_id=visit_id)

    write_err = _write_visits(campsite_id, visits, item.get("version"))
    if write_err:
        return write_err
    return _get_campsite(campsite_id)


def _delete_visit(body: dict[str, Any]) -> dict[str, Any]:
    campsite_id = str(body.get("campsiteId") or "").strip()
    visit_id = str(body.get("visitId") or "").strip()
    if not campsite_id:
        raise ValueError("campsiteId is required")
    if not visit_id:
        raise ValueError("visitId is required")

    item, err = _get_campsite_item_or_404(campsite_id)
    if err:
        return err
    original_visits = item.get("visits") or []
    visits = [v for v in original_visits if str(v.get("visitId")) != visit_id]
    if len(visits) == len(original_visits):
        return json_response(404, {"message": f"Visit not found: {visit_id}"})

    write_err = _write_visits(campsite_id, visits, item.get("version"))
    if write_err:
        return write_err
    return _get_campsite(campsite_id)


def _create_campsite(body: dict[str, Any]) -> dict[str, Any]:
    fields = _campsite_fields_from_body(body)
    campsite_id = generate_ulid()
    item = {
        "campsiteId": campsite_id,
        **fields,
        "entityType": ENTITY_CAMPSITE,
        "nameSortKey": _make_name_sort_key(fields["name"], campsite_id),
        "visits": [],
        "visitCount": 0,
        "version": 0,
    }
    table = table_from_env(CAMPSITES_TABLE_ENV)
    table.put_item(Item=item, ConditionExpression="attribute_not_exists(campsiteId)")
    return json_response(200, _to_api_campsite(item))


def _update_campsite(body: dict[str, Any]) -> dict[str, Any]:
    campsite_id = str(body.get("campsiteId") or "").strip()
    if not campsite_id:
        raise ValueError("campsiteId is required")

    fields = _campsite_fields_from_body(body)
    fields["nameSortKey"] = _make_name_sort_key(fields["name"], campsite_id)

    expr_names: dict[str, str] = {}
    expr_values: dict[str, Any] = {}
    assignments: list[str] = []
    for index, (attr, value) in enumerate(fields.items()):
        name_placeholder = f"#f{index}"
        value_placeholder = f":f{index}"
        expr_names[name_placeholder] = attr
        expr_values[value_placeholder] = value
        assignments.append(f"{name_placeholder} = {value_placeholder}")

    table = table_from_env(CAMPSITES_TABLE_ENV)
    try:
        table.update_item(
            Key={"campsiteId": campsite_id},
            UpdateExpression="SET " + ", ".join(assignments),
            ExpressionAttributeNames=expr_names,
            ExpressionAttributeValues=expr_values,
            ConditionExpression="attribute_exists(campsiteId)",
        )
    except ClientError as exc:
        if exc.response.get("Error", {}).get("Code") == "ConditionalCheckFailedException":
            return json_response(404, {"message": f"Campsite not found: {campsite_id}"})
        raise
    return _get_campsite(campsite_id)


def _delete_campsite(campsite_id: str) -> dict[str, Any]:
    if not campsite_id:
        raise ValueError("campsiteId is required")
    table = table_from_env(CAMPSITES_TABLE_ENV)
    table.delete_item(Key={"campsiteId": campsite_id})
    return json_response(200, {"campsiteId": campsite_id, "deleted": True})


def handler(event: dict[str, Any], context: Any) -> dict[str, Any]:
    try:
        req = event.get("requestContext") or {}
        http = req.get("http") or {}
        method = http.get("method", "GET").upper()
        raw_path = event.get("rawPath") or ""
        route_key = f"{method} {raw_path}"

        if method == "OPTIONS":
            return {"statusCode": 200, "body": ""}

        if route_key == "GET /api/campsites":
            return _list_campsites()
        if method == "GET" and raw_path.startswith(CAMPSITE_ROUTE_PREFIX):
            return _get_campsite(raw_path[len(CAMPSITE_ROUTE_PREFIX):].strip())

        if route_key == "POST /api/createCampsite":
            err = require_clerk_writer(event)
            if err:
                return err
            return _create_campsite(parse_body(event))
        if route_key == "POST /api/updateCampsite":
            err = require_clerk_writer(event)
            if err:
                return err
            return _update_campsite(parse_body(event))
        if method == "DELETE" and raw_path.startswith(CAMPSITE_ROUTE_PREFIX):
            err = require_clerk_writer(event)
            if err:
                return err
            return _delete_campsite(raw_path[len(CAMPSITE_ROUTE_PREFIX):].strip())
        if method == "POST" and raw_path.startswith(ADD_VISIT_ROUTE_PREFIX):
            err = require_clerk_writer(event)
            if err:
                return err
            campsite_id = raw_path[len(ADD_VISIT_ROUTE_PREFIX):].strip()
            return _add_visit(campsite_id, parse_body(event))
        if route_key == "POST /api/updateVisit":
            err = require_clerk_writer(event)
            if err:
                return err
            return _update_visit(parse_body(event))
        if route_key == "POST /api/deleteVisit":
            err = require_clerk_writer(event)
            if err:
                return err
            return _delete_visit(parse_body(event))

        return json_response(404, {"message": "Not found", "routeKey": route_key})
    except json.JSONDecodeError:
        return json_response(400, {"message": "Invalid JSON body"})
    except ValueError as e:
        return json_response(400, {"message": str(e)})
    except ClientError as e:
        code = e.response.get("Error", {}).get("Code", "")
        if code == "ConditionalCheckFailedException":
            return json_response(404, {"message": "Campsite not found"})
        return json_response(500, {"message": code or str(e)})
    except Exception as e:  # noqa: BLE001 - surface a 500 with the message like the other handlers
        return json_response(500, {"message": str(e)})

"""
Bounties HTTP API — API Gateway HTTP API v2 (payload format 2.0) + DynamoDB.
Paths mirror Java BaseApiController: /api/...

GET /api/bounties and /api/bountyCategories are public (Clerk authorizer allows unauthenticated
access). POST mutations require a signed-in Clerk user (valid JWT from the authorizer).
"""

from __future__ import annotations

import json
from typing import Any

from botocore.exceptions import ClientError
from shared.lambda_utils import (
    generate_ulid,
    json_response,
    parse_body,
    require_clerk_writer,
    scan_all_items,
    table_from_env,
)

VALID_BOUNTY_STATUSES = frozenset({"ACTIVE", "COMPLETE", "OVERDUE"})


def _status_to_api(raw: Any) -> str:
    """Normalize stored status to an uppercase string for the API."""
    if raw is None:
        return "ACTIVE"
    if isinstance(raw, str):
        up = raw.strip().upper()
        if up in VALID_BOUNTY_STATUSES:
            return up
    return "ACTIVE"


def _normalize_status(raw: Any) -> str:
    """Validate input for create/update; stores uppercase string in DynamoDB."""
    if raw is None:
        return "ACTIVE"
    if not isinstance(raw, str):
        raise ValueError("status must be a string: ACTIVE, COMPLETE, or OVERDUE")
    up = raw.strip().upper()
    if up in VALID_BOUNTY_STATUSES:
        return up
    raise ValueError("status must be ACTIVE, COMPLETE, or OVERDUE")


def _bounty_to_api(item: dict[str, Any]) -> dict[str, Any]:
    out: dict[str, Any] = {
        "bountyId": str(item["bountyId"]),
        "title": item.get("title"),
        "description": item.get("description"),
        "status": _status_to_api(item.get("status")),
        "categoryId": str(item["categoryId"]),
    }
    if item.get("expirationDate") is not None:
        out["expirationDate"] = item["expirationDate"]
    return out


def _category_to_api(item: dict[str, Any]) -> dict[str, Any]:
    return {
        "categoryId": str(item["categoryId"]),
        "name": item.get("name"),
    }


def _get_bounties() -> list[dict[str, Any]]:
    table = table_from_env("BOUNTIES_TABLE_NAME")
    items = scan_all_items(table)
    items.sort(key=lambda x: str(x.get("bountyId", "")))
    return [_bounty_to_api(i) for i in items]


def _get_categories() -> list[dict[str, Any]]:
    table = table_from_env("BOUNTY_CATEGORIES_TABLE_NAME")
    items = scan_all_items(table)
    items.sort(key=lambda x: str(x.get("categoryId", "")))
    return [_category_to_api(i) for i in items]


def _create_bounty(body: dict[str, Any]) -> dict[str, Any]:
    if body.get("categoryId") is None:
        raise ValueError("categoryId is required")
    table = table_from_env("BOUNTIES_TABLE_NAME")
    new_id = generate_ulid()
    status = _normalize_status(body.get("status", "ACTIVE"))
    item = {
        "bountyId": new_id,
        "title": body.get("title") or "",
        "description": body.get("description") or "",
        "status": status,
        "categoryId": str(body["categoryId"]),
    }
    if body.get("expirationDate") is not None:
        item["expirationDate"] = body["expirationDate"]
    table.put_item(Item=item)
    return _bounty_to_api(item)


def _update_bounty(body: dict[str, Any]) -> dict[str, Any]:
    if body.get("bountyId") is None:
        raise ValueError("bountyId is required")
    if body.get("categoryId") is None:
        raise ValueError("categoryId is required")
    table = table_from_env("BOUNTIES_TABLE_NAME")
    bid = str(body["bountyId"])
    status = _normalize_status(body.get("status", "ACTIVE"))
    expr_names = {
        "#t": "title",
        "#d": "description",
        "#s": "status",
        "#c": "categoryId",
    }
    expr_vals = {
        ":t": body.get("title") or "",
        ":d": body.get("description") or "",
        ":s": status,
        ":c": str(body["categoryId"]),
    }
    update_expr = "SET #t = :t, #d = :d, #s = :s, #c = :c"
    if body.get("expirationDate") is not None:
        expr_names["#e"] = "expirationDate"
        expr_vals[":e"] = body["expirationDate"]
        update_expr += ", #e = :e"
    table.update_item(
        Key={"bountyId": bid},
        UpdateExpression=update_expr,
        ExpressionAttributeNames=expr_names,
        ExpressionAttributeValues=expr_vals,
        ConditionExpression="attribute_exists(bountyId)",
    )
    resp = table.get_item(Key={"bountyId": bid})
    got = resp.get("Item")
    if not got:
        raise RuntimeError("bounty missing after update")
    return _bounty_to_api(got)


def _create_category(body: dict[str, Any]) -> dict[str, Any]:
    table = table_from_env("BOUNTY_CATEGORIES_TABLE_NAME")
    new_id = generate_ulid()
    item = {"categoryId": new_id, "name": body.get("name") or ""}
    table.put_item(Item=item)
    return _category_to_api(item)


def handler(event: dict[str, Any], context: Any) -> dict[str, Any]:
    try:
        req = event.get("requestContext") or {}
        http = req.get("http") or {}
        method = http.get("method", "GET").upper()
        raw_path = event.get("rawPath") or ""

        if method == "OPTIONS":
            return {"statusCode": 200, "body": ""}

        route_key = f"{method} {raw_path}"

        if route_key == "GET /api/bounties":
            return json_response(200, _get_bounties())
        if route_key == "GET /api/bountyCategories":
            return json_response(200, _get_categories())

        if route_key == "POST /api/createBounty":
            err = require_clerk_writer(event)
            if err:
                return err
            body = parse_body(event)
            return json_response(200, _create_bounty(body))

        if route_key == "POST /api/updateBounty":
            err = require_clerk_writer(event)
            if err:
                return err
            body = parse_body(event)
            return json_response(200, _update_bounty(body))

        if route_key == "POST /api/createBountyCategory":
            err = require_clerk_writer(event)
            if err:
                return err
            body = parse_body(event)
            return json_response(200, _create_category(body))

        return json_response(
            404,
            {"message": "Not found", "routeKey": route_key},
        )
    except json.JSONDecodeError:
        return json_response(400, {"message": "Invalid JSON body"})
    except ValueError as e:
        return json_response(400, {"message": str(e)})
    except ClientError as e:
        code = e.response.get("Error", {}).get("Code", "")
        if code == "ConditionalCheckFailedException":
            return json_response(404, {"message": "Bounty not found"})
        return json_response(500, {"message": code or str(e)})
    except Exception as e:
        return json_response(500, {"message": str(e)})


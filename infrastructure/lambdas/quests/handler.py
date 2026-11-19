"""
Quests HTTP API — API Gateway HTTP API v2 (payload format 2.0) + DynamoDB.

Unlike `bounties`/`recipes`/`dnd` (which allow unauthenticated reads of public reference data),
every quest route -- GET included -- requires a signed-in writer: catalog items, the point
balance, point history, and rewards are all personal data. See
openspec/changes/add-quests-points-system/design.md's "Auth" decision.

Catalog (`QuestCatalog`), points (`QuestLedger` + `QuestBalance`), and rewards (`QuestRewards`)
each get their own dedicated functions below -- never a shared "generic entity" helper crossing
quest/reward lines. In particular, `_update_quest`/`_update_reward`/`_complete_quest`/
`_redeem_reward` each do their own `get_item` lookup and return their own direct, hardcoded 404
`json_response` from inside that quest-specific or reward-specific function. There is no
`ConditionExpression="attribute_exists(...)"` anywhere in this handler, and the bottom-level
`except ClientError` in `handler()` is only a generic last-resort 500 for genuinely unexpected AWS
errors (throttling, etc.) -- it never needs to distinguish "Quest not found" from "Reward not
found" because neither message is produced there.
"""

from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from typing import Any

from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError
from shared.lambda_utils import (
    generate_ulid,
    json_response,
    parse_body,
    require_clerk_writer,
    scan_all_items,
    table_from_env,
    to_dynamodb_item,
    transact_write_items,
)

QUEST_LEDGER_CHRONOLOGICAL_INDEX = "ChronologicalIndex"
ENTITY_QUEST_LEDGER = "QUEST_LEDGER"
BALANCE_ID = "BALANCE"


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _validate_positive_int(value: Any, field_name: str) -> int:
    """`pointValue`/`pointCost` must be a positive whole number. `bool` is a subclass of `int` in
    Python, so it must be explicitly excluded -- `True`/`False` are not valid point amounts."""
    if not isinstance(value, int) or isinstance(value, bool) or value <= 0:
        raise ValueError(f"{field_name} must be a positive integer")
    return value


# --- Catalog (quest-only) -------------------------------------------------------------------------


def _quest_to_api(item: dict[str, Any]) -> dict[str, Any]:
    return {
        "questId": str(item["questId"]),
        "name": item.get("name"),
        "description": item.get("description"),
        "pointValue": int(item["pointValue"]),
        "active": bool(item.get("active", True)),
    }


def _get_quests(include_inactive: bool = False) -> list[dict[str, Any]]:
    table = table_from_env("QUEST_CATALOG_TABLE_NAME")
    items = scan_all_items(table)
    if not include_inactive:
        items = [i for i in items if i.get("active", True)]
    items.sort(key=lambda x: str(x.get("questId", "")))
    return [_quest_to_api(i) for i in items]


def _create_quest(body: dict[str, Any]) -> dict[str, Any]:
    name = body.get("name")
    if not name:
        raise ValueError("name is required")
    point_value = _validate_positive_int(body.get("pointValue"), "pointValue")
    table = table_from_env("QUEST_CATALOG_TABLE_NAME")
    new_id = generate_ulid()
    now = _now_iso()
    # No `cadence`/`nextDueAt` fields are written here -- the quest-catalog spec's "not scheduled"
    # requirement for this phase; DynamoDB's schemaless items let a future change start writing
    # them without a migration.
    item = {
        "questId": new_id,
        "name": name,
        "description": body.get("description") or "",
        "pointValue": point_value,
        "active": True,
        "createdAt": now,
        "updatedAt": now,
    }
    table.put_item(Item=item)
    return _quest_to_api(item)


def _update_quest(body: dict[str, Any]) -> dict[str, Any]:
    """Does its own `get_item` lookup; returns its own direct 404 if the quest doesn't exist.
    Also doubles as the archive action: setting `active=False` in the same edit body archives the
    item (no separate archive endpoint) -- past completions referencing this `questId` are
    untouched because the ledger is append-only and never rewritten here."""
    quest_id = body.get("questId")
    if not quest_id:
        raise ValueError("questId is required")
    table = table_from_env("QUEST_CATALOG_TABLE_NAME")
    existing = table.get_item(Key={"questId": quest_id}).get("Item")
    if not existing:
        return json_response(404, {"message": "Quest not found"})

    name = body.get("name") if body.get("name") is not None else existing.get("name")
    if not name:
        raise ValueError("name is required")
    description = body.get("description") if body.get("description") is not None else existing.get(
        "description", ""
    )
    # DynamoDB always returns numbers as `Decimal`; cast the fallback to `int` before validating
    # so a partial update (one that omits `pointValue`) doesn't spuriously fail
    # `_validate_positive_int`'s `isinstance(value, int)` check against the *stored* value.
    existing_point_value = existing.get("pointValue")
    if existing_point_value is not None:
        existing_point_value = int(existing_point_value)
    point_value = _validate_positive_int(body.get("pointValue", existing_point_value), "pointValue")
    active = bool(body.get("active", existing.get("active", True)))

    table.update_item(
        Key={"questId": quest_id},
        UpdateExpression="SET #n = :n, #d = :d, #p = :p, #a = :a, #u = :u",
        ExpressionAttributeNames={
            "#n": "name",
            "#d": "description",
            "#p": "pointValue",
            "#a": "active",
            "#u": "updatedAt",
        },
        ExpressionAttributeValues={
            ":n": name,
            ":d": description,
            ":p": point_value,
            ":a": active,
            ":u": _now_iso(),
        },
    )
    updated = table.get_item(Key={"questId": quest_id}).get("Item")
    return json_response(200, _quest_to_api(updated))


# --- Points (quest-only) --------------------------------------------------------------------------


def _ledger_entry_to_api(item: dict[str, Any]) -> dict[str, Any]:
    out: dict[str, Any] = {
        "ledgerId": str(item["ledgerId"]),
        "type": item["type"],
        "pointsDelta": int(item["pointsDelta"]),
        "occurredAt": item["occurredAt"],
    }
    if item.get("questId") is not None:
        out["questId"] = str(item["questId"])
    if item.get("rewardId") is not None:
        out["rewardId"] = str(item["rewardId"])
    return out


def _complete_quest(body: dict[str, Any]) -> dict[str, Any]:
    """Its own `get_item` on `QuestCatalog`; its own 404 ("Quest not found") if missing, and its
    own `ValueError` ("Quest is archived") -> 400 if inactive -- the item exists, so an archived
    quest is a validation failure, not a not-found. Writes the `QuestLedger` COMPLETION item and
    increments `QuestBalance.total` in one `TransactWriteItems` call -- no `ConditionExpression`
    needed on this path since a completion only ever increases the balance."""
    quest_id = body.get("questId")
    if not quest_id:
        raise ValueError("questId is required")
    catalog_table = table_from_env("QUEST_CATALOG_TABLE_NAME")
    quest = catalog_table.get_item(Key={"questId": quest_id}).get("Item")
    if not quest:
        return json_response(404, {"message": "Quest not found"})
    if not quest.get("active", True):
        raise ValueError("Quest is archived")

    point_value = int(quest["pointValue"])
    ledger_item = {
        "ledgerId": generate_ulid(),
        "entityType": ENTITY_QUEST_LEDGER,
        "type": "COMPLETION",
        "pointsDelta": point_value,
        "occurredAt": _now_iso(),
        "questId": quest_id,
    }
    transact_write_items(
        [
            {
                "Put": {
                    "TableName": os.environ["QUEST_LEDGER_TABLE_NAME"],
                    "Item": to_dynamodb_item(ledger_item),
                }
            },
            {
                "Update": {
                    "TableName": os.environ["QUEST_BALANCE_TABLE_NAME"],
                    "Key": to_dynamodb_item({"balanceId": BALANCE_ID}),
                    "UpdateExpression": "ADD #t :delta",
                    "ExpressionAttributeNames": {"#t": "total"},
                    "ExpressionAttributeValues": to_dynamodb_item({":delta": point_value}),
                }
            },
        ]
    )
    return json_response(200, _ledger_entry_to_api(ledger_item))


def _get_balance() -> dict[str, Any]:
    table = table_from_env("QUEST_BALANCE_TABLE_NAME")
    item = table.get_item(Key={"balanceId": BALANCE_ID}).get("Item")
    total = item.get("total", 0) if item else 0
    return {"total": int(total)}


def _get_history() -> list[dict[str, Any]]:
    table = table_from_env("QUEST_LEDGER_TABLE_NAME")
    response = table.query(
        IndexName=QUEST_LEDGER_CHRONOLOGICAL_INDEX,
        KeyConditionExpression=Key("entityType").eq(ENTITY_QUEST_LEDGER),
    )
    items = response.get("Items", [])
    items.sort(key=lambda x: str(x.get("occurredAt", "")))
    return [_ledger_entry_to_api(i) for i in items]


# --- Rewards (reward-only) -------------------------------------------------------------------------


def _reward_to_api(item: dict[str, Any]) -> dict[str, Any]:
    return {
        "rewardId": str(item["rewardId"]),
        "name": item.get("name"),
        "description": item.get("description"),
        "pointCost": int(item["pointCost"]),
        "active": bool(item.get("active", True)),
    }


def _get_rewards(include_inactive: bool = False) -> list[dict[str, Any]]:
    table = table_from_env("QUEST_REWARDS_TABLE_NAME")
    items = scan_all_items(table)
    if not include_inactive:
        items = [i for i in items if i.get("active", True)]
    items.sort(key=lambda x: str(x.get("rewardId", "")))
    return [_reward_to_api(i) for i in items]


def _create_reward(body: dict[str, Any]) -> dict[str, Any]:
    name = body.get("name")
    if not name:
        raise ValueError("name is required")
    point_cost = _validate_positive_int(body.get("pointCost"), "pointCost")
    table = table_from_env("QUEST_REWARDS_TABLE_NAME")
    new_id = generate_ulid()
    item = {
        "rewardId": new_id,
        "name": name,
        "description": body.get("description") or "",
        "pointCost": point_cost,
        "active": True,
    }
    table.put_item(Item=item)
    return _reward_to_api(item)


def _update_reward(body: dict[str, Any]) -> dict[str, Any]:
    """Its own `get_item` lookup; its own 404 ("Reward not found") if missing -- structurally
    identical to but textually distinct from `_update_quest`'s, and intentionally not deduplicated
    into one shared "update entity or 404" helper. Also doubles as the archive action."""
    reward_id = body.get("rewardId")
    if not reward_id:
        raise ValueError("rewardId is required")
    table = table_from_env("QUEST_REWARDS_TABLE_NAME")
    existing = table.get_item(Key={"rewardId": reward_id}).get("Item")
    if not existing:
        return json_response(404, {"message": "Reward not found"})

    name = body.get("name") if body.get("name") is not None else existing.get("name")
    if not name:
        raise ValueError("name is required")
    description = body.get("description") if body.get("description") is not None else existing.get(
        "description", ""
    )
    # Same `Decimal`-fallback cast as `_update_quest` -- see its comment for why.
    existing_point_cost = existing.get("pointCost")
    if existing_point_cost is not None:
        existing_point_cost = int(existing_point_cost)
    point_cost = _validate_positive_int(body.get("pointCost", existing_point_cost), "pointCost")
    active = bool(body.get("active", existing.get("active", True)))

    table.update_item(
        Key={"rewardId": reward_id},
        UpdateExpression="SET #n = :n, #d = :d, #c = :c, #a = :a",
        ExpressionAttributeNames={"#n": "name", "#d": "description", "#c": "pointCost", "#a": "active"},
        ExpressionAttributeValues={":n": name, ":d": description, ":c": point_cost, ":a": active},
    )
    updated = table.get_item(Key={"rewardId": reward_id}).get("Item")
    return json_response(200, _reward_to_api(updated))


def _redeem_reward(body: dict[str, Any]) -> dict[str, Any]:
    """Its own `get_item` lookup; its own 404 ("Reward not found") if missing, and its own
    `ValueError` ("Reward is archived") -> 400 if inactive. Writes the `QuestLedger` REDEMPTION
    item and debits `QuestBalance.total` in one `TransactWriteItems` call, guarded by a
    `ConditionExpression` on the balance update so a redemption can never drive the balance
    negative.

    Error handling for the transaction is local to this function, not shared with any quest
    route: on `TransactionCanceledException`, it inspects `CancellationReasons` by *position* --
    index 0 is the ledger `Put` (no `ConditionExpression`, so it never itself cancels), index 1 is
    the balance `Update` (the only item with a condition). Only when reason[1]'s code is
    `ConditionalCheckFailed` is this mapped to "Insufficient balance"; anything else (or an
    unexpected shape) re-raises so it surfaces as a genuine 500 instead of being silently masked
    as a balance error. **Maintenance note:** if the two items in `TransactItems` below are ever
    reordered, this index must be updated too.
    """
    reward_id = body.get("rewardId")
    if not reward_id:
        raise ValueError("rewardId is required")
    rewards_table = table_from_env("QUEST_REWARDS_TABLE_NAME")
    reward = rewards_table.get_item(Key={"rewardId": reward_id}).get("Item")
    if not reward:
        return json_response(404, {"message": "Reward not found"})
    if not reward.get("active", True):
        raise ValueError("Reward is archived")

    point_cost = int(reward["pointCost"])
    ledger_item = {
        "ledgerId": generate_ulid(),
        "entityType": ENTITY_QUEST_LEDGER,
        "type": "REDEMPTION",
        "pointsDelta": -point_cost,
        "occurredAt": _now_iso(),
        "rewardId": reward_id,
    }
    try:
        transact_write_items(
            [
                {
                    "Put": {
                        "TableName": os.environ["QUEST_LEDGER_TABLE_NAME"],
                        "Item": to_dynamodb_item(ledger_item),
                    }
                },
                {
                    "Update": {
                        "TableName": os.environ["QUEST_BALANCE_TABLE_NAME"],
                        "Key": to_dynamodb_item({"balanceId": BALANCE_ID}),
                        "UpdateExpression": "ADD #t :delta",
                        "ConditionExpression": "#t >= :cost",
                        "ExpressionAttributeNames": {"#t": "total"},
                        "ExpressionAttributeValues": to_dynamodb_item(
                            {":delta": -point_cost, ":cost": point_cost}
                        ),
                    }
                },
            ]
        )
    except ClientError as e:
        if e.response.get("Error", {}).get("Code") == "TransactionCanceledException":
            reasons = e.response.get("CancellationReasons", [])
            if len(reasons) > 1 and reasons[1].get("Code") == "ConditionalCheckFailed":
                return json_response(400, {"message": "Insufficient balance"})
        raise
    return json_response(200, _ledger_entry_to_api(ledger_item))


def handler(event: dict[str, Any], context: Any) -> dict[str, Any]:
    try:
        req = event.get("requestContext") or {}
        http = req.get("http") or {}
        method = http.get("method", "GET").upper()
        raw_path = event.get("rawPath") or ""

        if method == "OPTIONS":
            return {"statusCode": 200, "body": ""}

        route_key = f"{method} {raw_path}"
        known_routes = {
            "GET /api/quests",
            "POST /api/createQuest",
            "POST /api/updateQuest",
            "POST /api/completeQuest",
            "GET /api/questBalance",
            "GET /api/questHistory",
            "GET /api/questRewards",
            "POST /api/createQuestReward",
            "POST /api/updateQuestReward",
            "POST /api/redeemQuestReward",
        }
        if route_key not in known_routes:
            return json_response(404, {"message": "Not found", "routeKey": route_key})

        # Every quest route requires a signed-in writer (private data) -- unlike bounties' public
        # GETs -- including reads, per design.md's "Auth" decision.
        err = require_clerk_writer(event)
        if err:
            return err

        if route_key == "GET /api/quests":
            query = event.get("queryStringParameters") or {}
            return json_response(200, _get_quests(include_inactive=query.get("includeInactive") == "true"))
        if route_key == "POST /api/createQuest":
            body = parse_body(event)
            return json_response(200, _create_quest(body))
        if route_key == "POST /api/updateQuest":
            body = parse_body(event)
            return _update_quest(body)
        if route_key == "POST /api/completeQuest":
            body = parse_body(event)
            return _complete_quest(body)
        if route_key == "GET /api/questBalance":
            return json_response(200, _get_balance())
        if route_key == "GET /api/questHistory":
            return json_response(200, _get_history())

        if route_key == "GET /api/questRewards":
            query = event.get("queryStringParameters") or {}
            return json_response(200, _get_rewards(include_inactive=query.get("includeInactive") == "true"))
        if route_key == "POST /api/createQuestReward":
            body = parse_body(event)
            return json_response(200, _create_reward(body))
        if route_key == "POST /api/updateQuestReward":
            body = parse_body(event)
            return _update_reward(body)

        body = parse_body(event)
        return _redeem_reward(body)
    except json.JSONDecodeError:
        return json_response(400, {"message": "Invalid JSON body"})
    except ValueError as e:
        return json_response(400, {"message": str(e)})
    except ClientError as e:
        code = e.response.get("Error", {}).get("Code", "")
        return json_response(500, {"message": code or str(e)})
    except Exception as e:
        return json_response(500, {"message": str(e)})

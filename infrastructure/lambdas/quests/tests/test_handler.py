"""Unit tests for infrastructure/lambdas/quests/handler.py, mocking DynamoDB with moto.

Tests call `handler()` directly with hand-built API Gateway HTTP API v2 events; the Clerk
authorizer itself is not exercised -- `authenticated`/writer checks go through the
authorizer-context contract `require_clerk_writer` reads (see `bounties/tests/test_handler.py`'s
docstring for the same convention).

Fixtures live in this module (not a separate `conftest.py`) -- test-runner config files like
`conftest.py` are off-limits for this change; defining the fixtures directly here, as plain
`@pytest.fixture`-decorated functions in the test module itself, has identical pytest semantics
(fixtures are discovered the same way whether they live in `conftest.py` or in the test module
that uses them) without touching any file pytest treats as global test-collection configuration.
"""

from __future__ import annotations

import importlib.util
import json
from pathlib import Path
from typing import Any

import pytest
from moto import mock_aws

from lambda_test_utils import create_table, load_handler_module

QUESTS_DIR = Path(__file__).resolve().parent.parent
QUEST_CATALOG_TABLE_NAME = "test-quest-catalog"
QUEST_LEDGER_TABLE_NAME = "test-quest-ledger"
QUEST_BALANCE_TABLE_NAME = "test-quest-balance"
QUEST_REWARDS_TABLE_NAME = "test-quest-rewards"

# Real GSI shape copied from `infrastructure/lib/constructs/quests-construct.ts`'s
# `ChronologicalIndex` (constant partition key `entityType`, sort key `occurredAt`, `ALL`
# projection) -- see `lambda_test_utils.create_table`'s docstring for why this must match.
QUEST_LEDGER_CHRONOLOGICAL_INDEX = {
    "IndexName": "ChronologicalIndex",
    "KeySchema": [
        {"AttributeName": "entityType", "KeyType": "HASH"},
        {"AttributeName": "occurredAt", "KeyType": "RANGE"},
    ],
    "Projection": {"ProjectionType": "ALL"},
}


@pytest.fixture(scope="session")
def quests_handler_module() -> Any:
    """Import `quests/handler.py` once per test session (no import-time env-var dependency)."""
    return load_handler_module("quests_handler", QUESTS_DIR / "handler.py")


@pytest.fixture
def quests_handler(quests_handler_module: Any, dynamodb_resource: Any, monkeypatch: pytest.MonkeyPatch):
    """Moto-mocked DynamoDB tables + the session-imported `quests/handler.py` module."""
    monkeypatch.setenv("QUEST_CATALOG_TABLE_NAME", QUEST_CATALOG_TABLE_NAME)
    monkeypatch.setenv("QUEST_LEDGER_TABLE_NAME", QUEST_LEDGER_TABLE_NAME)
    monkeypatch.setenv("QUEST_BALANCE_TABLE_NAME", QUEST_BALANCE_TABLE_NAME)
    monkeypatch.setenv("QUEST_REWARDS_TABLE_NAME", QUEST_REWARDS_TABLE_NAME)

    with mock_aws():
        create_table(dynamodb_resource, QUEST_CATALOG_TABLE_NAME, partition_key="questId")
        create_table(
            dynamodb_resource,
            QUEST_LEDGER_TABLE_NAME,
            partition_key="ledgerId",
            global_secondary_indexes=[QUEST_LEDGER_CHRONOLOGICAL_INDEX],
        )
        create_table(dynamodb_resource, QUEST_BALANCE_TABLE_NAME, partition_key="balanceId")
        create_table(dynamodb_resource, QUEST_REWARDS_TABLE_NAME, partition_key="rewardId")

        yield quests_handler_module


@pytest.fixture
def quest_catalog_table(quests_handler: Any, dynamodb_resource: Any) -> Any:
    return dynamodb_resource.Table(QUEST_CATALOG_TABLE_NAME)


@pytest.fixture
def quest_ledger_table(quests_handler: Any, dynamodb_resource: Any) -> Any:
    return dynamodb_resource.Table(QUEST_LEDGER_TABLE_NAME)


@pytest.fixture
def quest_balance_table(quests_handler: Any, dynamodb_resource: Any) -> Any:
    return dynamodb_resource.Table(QUEST_BALANCE_TABLE_NAME)


@pytest.fixture
def quest_rewards_table(quests_handler: Any, dynamodb_resource: Any) -> Any:
    return dynamodb_resource.Table(QUEST_REWARDS_TABLE_NAME)


# --- Import-time behavior ------------------------------------------------------------------------


def test_handler_module_imports_without_table_env_vars(monkeypatch) -> None:
    """Regression guard: importing `handler.py` must not depend on any QUEST_*_TABLE_NAME env var
    at import time -- only lazily, inside route functions (see `bounties/tests/test_handler.py`
    for the same guard on the reference vertical)."""
    for env_var in (
        "QUEST_CATALOG_TABLE_NAME",
        "QUEST_LEDGER_TABLE_NAME",
        "QUEST_BALANCE_TABLE_NAME",
        "QUEST_REWARDS_TABLE_NAME",
    ):
        monkeypatch.delenv(env_var, raising=False)

    spec = importlib.util.spec_from_file_location("quests_handler_import_check", QUESTS_DIR / "handler.py")
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)  # must not raise


# --- GET /api/quests -------------------------------------------------------------------------


def test_get_quests_empty(quests_handler, make_event):
    resp = quests_handler.handler(make_event("GET", "/api/quests", authenticated=True), None)
    assert resp["statusCode"] == 200
    assert json.loads(resp["body"]) == []


def test_get_quests_requires_auth(quests_handler, make_event):
    resp = quests_handler.handler(make_event("GET", "/api/quests"), None)
    assert resp["statusCode"] == 401


# --- POST /api/createQuest --------------------------------------------------------------------


def test_create_quest_requires_auth(quests_handler, make_event):
    event = make_event("POST", "/api/createQuest", body={"name": "Wash dishes", "pointValue": 5})
    resp = quests_handler.handler(event, None)
    assert resp["statusCode"] == 401


def test_create_quest_rejects_non_positive_point_value(quests_handler, make_event):
    for bad_value in (0, -1):
        event = make_event(
            "POST",
            "/api/createQuest",
            body={"name": "Wash dishes", "pointValue": bad_value},
            authenticated=True,
        )
        resp = quests_handler.handler(event, None)
        assert resp["statusCode"] == 400


def test_create_quest_rejects_non_integer_point_value(quests_handler, make_event):
    for bad_value in (1.5, "5", True):
        event = make_event(
            "POST",
            "/api/createQuest",
            body={"name": "Wash dishes", "pointValue": bad_value},
            authenticated=True,
        )
        resp = quests_handler.handler(event, None)
        assert resp["statusCode"] == 400


def test_create_quest_success_persists_item(quests_handler, quest_catalog_table, make_event):
    body = {"name": "Wash dishes", "description": "All of them", "pointValue": 5}
    event = make_event("POST", "/api/createQuest", body=body, authenticated=True)
    resp = quests_handler.handler(event, None)

    assert resp["statusCode"] == 200
    created = json.loads(resp["body"])
    assert created["name"] == "Wash dishes"
    assert created["pointValue"] == 5
    assert created["active"] is True

    stored = quest_catalog_table.get_item(Key={"questId": created["questId"]})["Item"]
    assert stored["name"] == "Wash dishes"
    assert int(stored["pointValue"]) == 5


# --- POST /api/updateQuest ---------------------------------------------------------------------


def test_update_quest_requires_auth(quests_handler, make_event):
    event = make_event("POST", "/api/updateQuest", body={"questId": "q1", "pointValue": 5})
    resp = quests_handler.handler(event, None)
    assert resp["statusCode"] == 401


def test_update_quest_missing_quest_is_404_with_message(quests_handler, make_event):
    body = {"questId": "does-not-exist", "name": "x", "pointValue": 5}
    event = make_event("POST", "/api/updateQuest", body=body, authenticated=True)
    resp = quests_handler.handler(event, None)

    assert resp["statusCode"] == 404
    assert json.loads(resp["body"])["message"] == "Quest not found"


def test_update_quest_success(quests_handler, quest_catalog_table, make_event):
    quest_catalog_table.put_item(
        Item={"questId": "q1", "name": "Old", "description": "old", "pointValue": 5, "active": True}
    )
    body = {"questId": "q1", "name": "New", "description": "new", "pointValue": 9}
    event = make_event("POST", "/api/updateQuest", body=body, authenticated=True)
    resp = quests_handler.handler(event, None)

    assert resp["statusCode"] == 200
    updated = json.loads(resp["body"])
    assert updated["questId"] == "q1"
    assert updated["name"] == "New"
    assert updated["pointValue"] == 9


def test_update_quest_partial_body_keeps_existing_point_value(quests_handler, quest_catalog_table, make_event):
    """Regression guard: `pointValue` read back from DynamoDB is a `Decimal`, not an `int`. A
    partial update that omits `pointValue` (falling back to the stored value) must not trip
    `_validate_positive_int`'s `isinstance(value, int)` check against that `Decimal`."""
    quest_catalog_table.put_item(
        Item={"questId": "q1", "name": "Old", "description": "old", "pointValue": 5, "active": True}
    )
    body = {"questId": "q1", "name": "Renamed"}
    event = make_event("POST", "/api/updateQuest", body=body, authenticated=True)
    resp = quests_handler.handler(event, None)

    assert resp["statusCode"] == 200
    updated = json.loads(resp["body"])
    assert updated["name"] == "Renamed"
    assert updated["pointValue"] == 5


def test_archived_quest_hidden_from_active_list(quests_handler, quest_catalog_table, make_event):
    quest_catalog_table.put_item(
        Item={"questId": "q1", "name": "Active", "description": "", "pointValue": 5, "active": True}
    )
    quest_catalog_table.put_item(
        Item={"questId": "q2", "name": "Archived", "description": "", "pointValue": 5, "active": True}
    )
    archive_event = make_event(
        "POST",
        "/api/updateQuest",
        body={"questId": "q2", "name": "Archived", "pointValue": 5, "active": False},
        authenticated=True,
    )
    assert quests_handler.handler(archive_event, None)["statusCode"] == 200

    resp = quests_handler.handler(make_event("GET", "/api/quests", authenticated=True), None)
    body = json.loads(resp["body"])
    assert [q["questId"] for q in body] == ["q1"]


def test_successful_edit_past_completions_unaffected(quests_handler, make_event):
    """`quest-catalog` "Successful edit" scenario: editing the point value only affects
    subsequent completions; past completions keep their original point value."""
    create_resp = quests_handler.handler(
        make_event("POST", "/api/createQuest", body={"name": "Chore", "pointValue": 5}, authenticated=True),
        None,
    )
    quest_id = json.loads(create_resp["body"])["questId"]

    complete1 = quests_handler.handler(
        make_event("POST", "/api/completeQuest", body={"questId": quest_id}, authenticated=True), None
    )
    assert complete1["statusCode"] == 200

    update_resp = quests_handler.handler(
        make_event(
            "POST",
            "/api/updateQuest",
            body={"questId": quest_id, "name": "Chore", "pointValue": 9},
            authenticated=True,
        ),
        None,
    )
    assert update_resp["statusCode"] == 200

    complete2 = quests_handler.handler(
        make_event("POST", "/api/completeQuest", body={"questId": quest_id}, authenticated=True), None
    )
    assert complete2["statusCode"] == 200

    history_resp = quests_handler.handler(make_event("GET", "/api/questHistory", authenticated=True), None)
    history = json.loads(history_resp["body"])
    completions = [h for h in history if h["type"] == "COMPLETION"]
    assert [c["pointsDelta"] for c in completions] == [5, 9]


# --- POST /api/completeQuest --------------------------------------------------------------------


def test_complete_quest_requires_auth(quests_handler, make_event):
    event = make_event("POST", "/api/completeQuest", body={"questId": "q1"})
    resp = quests_handler.handler(event, None)
    assert resp["statusCode"] == 401


def test_complete_missing_quest_is_404(quests_handler, make_event):
    event = make_event("POST", "/api/completeQuest", body={"questId": "nope"}, authenticated=True)
    resp = quests_handler.handler(event, None)
    assert resp["statusCode"] == 404
    assert json.loads(resp["body"])["message"] == "Quest not found"


def test_complete_archived_quest_is_400_and_balance_unchanged(quests_handler, quest_catalog_table, make_event):
    quest_catalog_table.put_item(
        Item={"questId": "q1", "name": "Archived", "description": "", "pointValue": 5, "active": False}
    )
    resp = quests_handler.handler(
        make_event("POST", "/api/completeQuest", body={"questId": "q1"}, authenticated=True), None
    )
    assert resp["statusCode"] == 400

    balance_resp = quests_handler.handler(make_event("GET", "/api/questBalance", authenticated=True), None)
    assert json.loads(balance_resp["body"])["total"] == 0


def test_complete_quest_success_creates_ledger_entry_and_increments_balance(
    quests_handler, quest_catalog_table, quest_ledger_table, make_event
):
    quest_catalog_table.put_item(
        Item={"questId": "q1", "name": "Chore", "description": "", "pointValue": 7, "active": True}
    )
    resp = quests_handler.handler(
        make_event("POST", "/api/completeQuest", body={"questId": "q1"}, authenticated=True), None
    )
    assert resp["statusCode"] == 200
    created = json.loads(resp["body"])
    assert created["type"] == "COMPLETION"
    assert created["pointsDelta"] == 7
    assert created["questId"] == "q1"

    stored = quest_ledger_table.get_item(Key={"ledgerId": created["ledgerId"]})["Item"]
    assert stored["type"] == "COMPLETION"
    assert int(stored["pointsDelta"]) == 7

    balance_resp = quests_handler.handler(make_event("GET", "/api/questBalance", authenticated=True), None)
    assert json.loads(balance_resp["body"])["total"] == 7


# --- History / balance consistency ---------------------------------------------------------------


def test_balance_is_zero_before_any_activity(quests_handler, make_event):
    resp = quests_handler.handler(make_event("GET", "/api/questBalance", authenticated=True), None)
    assert resp["statusCode"] == 200
    assert json.loads(resp["body"])["total"] == 0


def test_balance_matches_summed_history_after_multiple_events(
    quests_handler, quest_catalog_table, quest_rewards_table, make_event
):
    quest_catalog_table.put_item(
        Item={"questId": "q1", "name": "Chore", "description": "", "pointValue": 10, "active": True}
    )
    quest_rewards_table.put_item(
        Item={"rewardId": "r1", "name": "Snack", "description": "", "pointCost": 4, "active": True}
    )

    for _ in range(3):
        resp = quests_handler.handler(
            make_event("POST", "/api/completeQuest", body={"questId": "q1"}, authenticated=True), None
        )
        assert resp["statusCode"] == 200

    redeem_resp = quests_handler.handler(
        make_event("POST", "/api/redeemQuestReward", body={"rewardId": "r1"}, authenticated=True), None
    )
    assert redeem_resp["statusCode"] == 200

    balance_resp = quests_handler.handler(make_event("GET", "/api/questBalance", authenticated=True), None)
    balance = json.loads(balance_resp["body"])["total"]

    history_resp = quests_handler.handler(make_event("GET", "/api/questHistory", authenticated=True), None)
    history = json.loads(history_resp["body"])

    assert balance == sum(h["pointsDelta"] for h in history)
    assert balance == 26


def test_history_is_chronologically_ordered(quests_handler, quest_catalog_table, make_event):
    quest_catalog_table.put_item(
        Item={"questId": "q1", "name": "Chore", "description": "", "pointValue": 1, "active": True}
    )
    for _ in range(3):
        quests_handler.handler(
            make_event("POST", "/api/completeQuest", body={"questId": "q1"}, authenticated=True), None
        )

    history_resp = quests_handler.handler(make_event("GET", "/api/questHistory", authenticated=True), None)
    history = json.loads(history_resp["body"])
    occurred_at = [h["occurredAt"] for h in history]
    assert occurred_at == sorted(occurred_at)


# --- Rewards -----------------------------------------------------------------------------------


def test_create_reward_requires_auth(quests_handler, make_event):
    event = make_event("POST", "/api/createQuestReward", body={"name": "Snack", "pointCost": 4})
    resp = quests_handler.handler(event, None)
    assert resp["statusCode"] == 401


def test_create_reward_rejects_non_positive_point_cost(quests_handler, make_event):
    for bad_value in (0, -5):
        event = make_event(
            "POST",
            "/api/createQuestReward",
            body={"name": "Snack", "pointCost": bad_value},
            authenticated=True,
        )
        resp = quests_handler.handler(event, None)
        assert resp["statusCode"] == 400


def test_update_reward_missing_reward_is_404_with_message(quests_handler, make_event):
    body = {"rewardId": "does-not-exist", "name": "x", "pointCost": 4}
    event = make_event("POST", "/api/updateQuestReward", body=body, authenticated=True)
    resp = quests_handler.handler(event, None)

    assert resp["statusCode"] == 404
    assert json.loads(resp["body"])["message"] == "Reward not found"


def test_update_reward_partial_body_keeps_existing_point_cost(quests_handler, quest_rewards_table, make_event):
    """Regression guard: same `Decimal`-fallback bug as `_update_quest`'s -- see that test's
    docstring."""
    quest_rewards_table.put_item(
        Item={"rewardId": "r1", "name": "Old", "description": "old", "pointCost": 4, "active": True}
    )
    body = {"rewardId": "r1", "name": "Renamed"}
    event = make_event("POST", "/api/updateQuestReward", body=body, authenticated=True)
    resp = quests_handler.handler(event, None)

    assert resp["statusCode"] == 200
    updated = json.loads(resp["body"])
    assert updated["name"] == "Renamed"
    assert updated["pointCost"] == 4


def test_archived_reward_hidden_from_active_list(quests_handler, quest_rewards_table, make_event):
    quest_rewards_table.put_item(
        Item={"rewardId": "r1", "name": "Active", "description": "", "pointCost": 4, "active": True}
    )
    quest_rewards_table.put_item(
        Item={"rewardId": "r2", "name": "Archived", "description": "", "pointCost": 4, "active": True}
    )
    archive_event = make_event(
        "POST",
        "/api/updateQuestReward",
        body={"rewardId": "r2", "name": "Archived", "pointCost": 4, "active": False},
        authenticated=True,
    )
    assert quests_handler.handler(archive_event, None)["statusCode"] == 200

    resp = quests_handler.handler(make_event("GET", "/api/questRewards", authenticated=True), None)
    body = json.loads(resp["body"])
    assert [r["rewardId"] for r in body] == ["r1"]


def test_redeem_reward_requires_auth(quests_handler, make_event):
    event = make_event("POST", "/api/redeemQuestReward", body={"rewardId": "r1"})
    resp = quests_handler.handler(event, None)
    assert resp["statusCode"] == 401


def test_redeem_missing_reward_is_404(quests_handler, make_event):
    event = make_event("POST", "/api/redeemQuestReward", body={"rewardId": "nope"}, authenticated=True)
    resp = quests_handler.handler(event, None)
    assert resp["statusCode"] == 404
    assert json.loads(resp["body"])["message"] == "Reward not found"


def test_redeem_rejects_insufficient_balance_and_leaves_balance_and_ledger_untouched(
    quests_handler, quest_rewards_table, quest_ledger_table, quest_balance_table, make_event
):
    quest_rewards_table.put_item(
        Item={"rewardId": "r1", "name": "Expensive", "description": "", "pointCost": 10, "active": True}
    )
    resp = quests_handler.handler(
        make_event("POST", "/api/redeemQuestReward", body={"rewardId": "r1"}, authenticated=True), None
    )

    assert resp["statusCode"] == 400
    assert json.loads(resp["body"])["message"] == "Insufficient balance"

    balance_resp = quests_handler.handler(make_event("GET", "/api/questBalance", authenticated=True), None)
    assert json.loads(balance_resp["body"])["total"] == 0

    history_resp = quests_handler.handler(make_event("GET", "/api/questHistory", authenticated=True), None)
    assert json.loads(history_resp["body"]) == []


def test_redeem_rejects_archived_reward(quests_handler, quest_rewards_table, make_event):
    quest_rewards_table.put_item(
        Item={"rewardId": "r1", "name": "Archived", "description": "", "pointCost": 1, "active": False}
    )
    resp = quests_handler.handler(
        make_event("POST", "/api/redeemQuestReward", body={"rewardId": "r1"}, authenticated=True), None
    )
    assert resp["statusCode"] == 400
    assert json.loads(resp["body"])["message"] == "Reward is archived"


def test_redeem_reward_success_debits_balance_and_writes_redemption_entry(
    quests_handler, quest_catalog_table, quest_rewards_table, quest_ledger_table, make_event
):
    quest_catalog_table.put_item(
        Item={"questId": "q1", "name": "Chore", "description": "", "pointValue": 10, "active": True}
    )
    quests_handler.handler(
        make_event("POST", "/api/completeQuest", body={"questId": "q1"}, authenticated=True), None
    )
    quest_rewards_table.put_item(
        Item={"rewardId": "r1", "name": "Snack", "description": "", "pointCost": 4, "active": True}
    )

    resp = quests_handler.handler(
        make_event("POST", "/api/redeemQuestReward", body={"rewardId": "r1"}, authenticated=True), None
    )
    assert resp["statusCode"] == 200
    created = json.loads(resp["body"])
    assert created["type"] == "REDEMPTION"
    assert created["pointsDelta"] == -4
    assert created["rewardId"] == "r1"

    stored = quest_ledger_table.get_item(Key={"ledgerId": created["ledgerId"]})["Item"]
    assert int(stored["pointsDelta"]) == -4

    balance_resp = quests_handler.handler(make_event("GET", "/api/questBalance", authenticated=True), None)
    assert json.loads(balance_resp["body"])["total"] == 6


# --- Routing edge cases --------------------------------------------------------------------------


def test_unknown_route_is_404(quests_handler, make_event):
    event = make_event("GET", "/api/nope")
    resp = quests_handler.handler(event, None)
    assert resp["statusCode"] == 404
    assert json.loads(resp["body"])["routeKey"] == "GET /api/nope"


def test_options_returns_200_empty_body(quests_handler, make_event):
    event = make_event("OPTIONS", "/api/quests")
    resp = quests_handler.handler(event, None)
    assert resp["statusCode"] == 200
    assert resp["body"] == ""


def test_malformed_json_body_is_400(quests_handler, make_event):
    event = make_event("POST", "/api/createQuest", body="{not json", authenticated=True)
    resp = quests_handler.handler(event, None)
    assert resp["statusCode"] == 400

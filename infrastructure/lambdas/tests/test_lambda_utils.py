"""Regression guard: `shared.lambda_utils` must not touch AWS at import time.

The DynamoDB resource used to be created as a module-level global
(`dynamodb = boto3.resource("dynamodb")`), executed at import time regardless of env state. That
forced Lambda handler test fixtures to import inside an active `moto.mock_aws()` context and evict
cached modules between tests -- see openspec/changes/lazy-bind-dynamodb-resource/design.md for the
fix. These tests guard the invariant the fix (and every vertical's session-scoped
`<vertical>_handler_module` fixture built on top of it, see `../conftest.py` and
`../lambda_test_utils.py`) depends on: `boto3.resource("dynamodb")` is called lazily, on first use
inside `table_from_env`, never at import time.

This file lives at `infrastructure/lambdas/tests/`, not `infrastructure/lambdas/shared/tests/` --
it was moved here after that first location turned out to be actively deployed:
`infrastructure/lib/python-lambda-bundling.ts` bundles the whole `shared/` directory into the
shared Lambda layer via a recursive `cp -R shared`, so anything under `shared/` (test code
included) ships to production. See `../conftest.py`'s docstring for the full explanation.
"""

from __future__ import annotations

import sys
from unittest import mock

import pytest
from moto import mock_aws


def _evict_lambda_utils() -> None:
    for name in ("shared.lambda_utils", "shared"):
        sys.modules.pop(name, None)


def test_import_does_not_create_dynamodb_resource() -> None:
    _evict_lambda_utils()
    with mock.patch("boto3.resource") as mock_resource:
        import shared.lambda_utils  # noqa: F401 -- the import itself is what's under test

    mock_resource.assert_not_called()


def test_table_from_env_creates_resource_lazily_and_caches_it(monkeypatch: pytest.MonkeyPatch) -> None:
    _evict_lambda_utils()
    import shared.lambda_utils as lambda_utils

    monkeypatch.setenv("SOME_TABLE_NAME", "my-table")
    with mock.patch("boto3.resource") as mock_resource:
        lambda_utils.table_from_env("SOME_TABLE_NAME")
        lambda_utils.table_from_env("SOME_TABLE_NAME")

    mock_resource.assert_called_once_with("dynamodb")


def test_table_from_env_missing_env_var_raises_before_any_aws_call(monkeypatch: pytest.MonkeyPatch) -> None:
    _evict_lambda_utils()
    import shared.lambda_utils as lambda_utils

    monkeypatch.delenv("MISSING_TABLE_NAME", raising=False)
    with mock.patch("boto3.resource") as mock_resource:
        with pytest.raises(RuntimeError):
            lambda_utils.table_from_env("MISSING_TABLE_NAME")

    mock_resource.assert_not_called()


# --- to_dynamodb_item / transact_write_items (added for the `quests` vertical's atomic
# completion/redemption writes -- see openspec/changes/add-quests-points-system/design.md) -------


def test_to_dynamodb_item_round_trips_mixed_types() -> None:
    _evict_lambda_utils()
    import shared.lambda_utils as lambda_utils

    low_level = lambda_utils.to_dynamodb_item({"id": "abc", "count": 3, "active": True})

    assert low_level == {"id": {"S": "abc"}, "count": {"N": "3"}, "active": {"BOOL": True}}


def test_transact_write_items_performs_a_real_put_and_update(monkeypatch: pytest.MonkeyPatch) -> None:
    _evict_lambda_utils()
    import boto3

    import shared.lambda_utils as lambda_utils

    monkeypatch.setenv("AWS_ACCESS_KEY_ID", "testing")
    monkeypatch.setenv("AWS_SECRET_ACCESS_KEY", "testing")
    monkeypatch.setenv("AWS_DEFAULT_REGION", "us-east-1")

    with mock_aws():
        dynamodb = boto3.resource("dynamodb")
        dynamodb.create_table(
            TableName="ledger",
            KeySchema=[{"AttributeName": "ledgerId", "KeyType": "HASH"}],
            AttributeDefinitions=[{"AttributeName": "ledgerId", "AttributeType": "S"}],
            BillingMode="PAY_PER_REQUEST",
        )
        dynamodb.create_table(
            TableName="balance",
            KeySchema=[{"AttributeName": "balanceId", "KeyType": "HASH"}],
            AttributeDefinitions=[{"AttributeName": "balanceId", "AttributeType": "S"}],
            BillingMode="PAY_PER_REQUEST",
        )

        response = lambda_utils.transact_write_items(
            [
                {
                    "Put": {
                        "TableName": "ledger",
                        "Item": lambda_utils.to_dynamodb_item({"ledgerId": "l1", "pointsDelta": 5}),
                    }
                },
                {
                    "Update": {
                        "TableName": "balance",
                        "Key": lambda_utils.to_dynamodb_item({"balanceId": "BALANCE"}),
                        "UpdateExpression": "ADD #t :delta",
                        "ExpressionAttributeNames": {"#t": "total"},
                        "ExpressionAttributeValues": lambda_utils.to_dynamodb_item({":delta": 5}),
                    }
                },
            ]
        )

        assert "ResponseMetadata" in response

        ledger_item = dynamodb.Table("ledger").get_item(Key={"ledgerId": "l1"}).get("Item")
        assert ledger_item is not None
        assert int(ledger_item["pointsDelta"]) == 5

        balance_item = dynamodb.Table("balance").get_item(Key={"balanceId": "BALANCE"}).get("Item")
        assert balance_item is not None
        assert int(balance_item["total"]) == 5

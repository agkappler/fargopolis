"""Fixtures for bounties handler tests: moto-mocked DynamoDB + a fresh handler import per test.

See openspec/changes/add-bounties-pytest-scaffolding/design.md for the rationale behind the
importlib module-loading and per-test reimport pattern used here.
"""

from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path
from typing import Any, Callable

import boto3
import pytest
from moto import mock_aws

import os

os.environ.setdefault("AWS_ACCESS_KEY_ID", "testing")
os.environ.setdefault("AWS_SECRET_ACCESS_KEY", "testing")
os.environ.setdefault("AWS_SECURITY_TOKEN", "testing")
os.environ.setdefault("AWS_SESSION_TOKEN", "testing")
os.environ.setdefault("AWS_DEFAULT_REGION", "us-east-1")

BOUNTIES_DIR = Path(__file__).resolve().parent.parent
BOUNTIES_TABLE_NAME = "test-bounties"
BOUNTY_CATEGORIES_TABLE_NAME = "test-bounty-categories"


@pytest.fixture
def bounties_handler(monkeypatch: pytest.MonkeyPatch):
    """Moto-mocked DynamoDB tables + a freshly-imported `bounties/handler.py` module.

    `shared.lambda_utils` binds its DynamoDB resource at import time, so both the table env vars
    and the module import must happen *inside* the active `mock_aws()` context, and any previously
    cached `shared`/`bounties_handler` modules must be evicted first so this test's import binds
    to *this* mock account rather than a stale one from an earlier test.
    """
    monkeypatch.setenv("BOUNTIES_TABLE_NAME", BOUNTIES_TABLE_NAME)
    monkeypatch.setenv("BOUNTY_CATEGORIES_TABLE_NAME", BOUNTY_CATEGORIES_TABLE_NAME)

    for name in ("bounties_handler", "shared.lambda_utils", "shared"):
        sys.modules.pop(name, None)

    with mock_aws():
        dynamodb: Any = boto3.resource("dynamodb")
        dynamodb.create_table(
            TableName=BOUNTIES_TABLE_NAME,
            KeySchema=[{"AttributeName": "bountyId", "KeyType": "HASH"}],
            AttributeDefinitions=[{"AttributeName": "bountyId", "AttributeType": "S"}],
            BillingMode="PAY_PER_REQUEST",
        )
        dynamodb.create_table(
            TableName=BOUNTY_CATEGORIES_TABLE_NAME,
            KeySchema=[{"AttributeName": "categoryId", "KeyType": "HASH"}],
            AttributeDefinitions=[{"AttributeName": "categoryId", "AttributeType": "S"}],
            BillingMode="PAY_PER_REQUEST",
        )

        spec = importlib.util.spec_from_file_location("bounties_handler", BOUNTIES_DIR / "handler.py")
        assert spec and spec.loader
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)

        yield module

    for name in ("bounties_handler", "shared.lambda_utils", "shared"):
        sys.modules.pop(name, None)


@pytest.fixture
def bounties_table(bounties_handler: Any) -> Any:
    dynamodb: Any = boto3.resource("dynamodb")
    return dynamodb.Table(BOUNTIES_TABLE_NAME)


@pytest.fixture
def bounty_categories_table(bounties_handler: Any) -> Any:
    dynamodb: Any = boto3.resource("dynamodb")
    return dynamodb.Table(BOUNTY_CATEGORIES_TABLE_NAME)


@pytest.fixture
def make_event() -> Callable[..., dict[str, Any]]:
    """Build a minimal API Gateway HTTP API v2 (payload format 2.0) event.

    `body`, when given, is JSON-encoded unless already a `str` (pass a raw string to exercise
    malformed-JSON handling). `authenticated=True` mirrors the Clerk authorizer's lambda context
    contract read by `shared.lambda_utils.authorizer_lambda_context`.
    """

    def _make_event(
        method: str,
        path: str,
        body: Any = None,
        authenticated: bool = False,
        sub: str | None = None,
    ) -> dict[str, Any]:
        event: dict[str, Any] = {
            "requestContext": {"http": {"method": method}},
            "rawPath": path,
            "isBase64Encoded": False,
        }
        if body is not None:
            event["body"] = body if isinstance(body, str) else json.dumps(body)
        if authenticated:
            event["requestContext"]["authorizer"] = {
                "lambda": {"authenticated": "true", "sub": sub or "user_test123"}
            }
        return event

    return _make_event

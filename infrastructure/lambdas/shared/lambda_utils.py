"""HTTP + DynamoDB helpers for Lambdas (import as ``shared.lambda_utils``)."""

from __future__ import annotations

import json
import os
from decimal import Decimal
from functools import lru_cache
from typing import Any

import boto3
from boto3.dynamodb.types import TypeSerializer
from ulid import ULID


@lru_cache(maxsize=1)
def _dynamodb_resource() -> Any:
    return boto3.resource("dynamodb")


@lru_cache(maxsize=1)
def _dynamodb_client() -> Any:
    """A genuine low-level DynamoDB client, lazily created and cached like
    `_dynamodb_resource()` (same invariant: no AWS call at import time).

    This is intentionally NOT `_dynamodb_resource().meta.client`: boto3 registers a
    parameter-transform handler on a resource's client that auto-converts native Python
    values to/from DynamoDB's `AttributeValue` wire format on every call made through it --
    including raw low-level calls like `transact_write_items`. Since `to_dynamodb_item`
    already pre-serializes items with `TypeSerializer`, routing through the resource's
    client would double-serialize them (e.g. a `{"S": "x"}` value gets wrapped again into
    `{"M": {"S": {"S": "x"}}}`), which DynamoDB then rejects as a type mismatch. A plain
    `boto3.client("dynamodb")` has no such transform, so pre-serialized items pass through
    unchanged.
    """
    return boto3.client("dynamodb")


def table_from_env(name_env: str):
    table_name = os.environ.get(name_env)
    if not table_name:
        raise RuntimeError(f"Missing env {name_env}")
    return _dynamodb_resource().Table(table_name)


def json_response(status_code: int, body: Any) -> dict[str, Any]:
    return {
        "statusCode": status_code,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(body, default=_json_default),
    }


def _json_default(value: Any) -> Any:
    if isinstance(value, Decimal):
        return int(value) if value % 1 == 0 else float(value)
    raise TypeError(f"Object of type {type(value)} is not JSON serializable")


def authorizer_lambda_context(event: dict[str, Any]) -> dict[str, str]:
    request_context = event.get("requestContext") or {}
    authorizer = request_context.get("authorizer") or {}
    raw_context = authorizer.get("lambda") if isinstance(authorizer.get("lambda"), dict) else authorizer
    if not isinstance(raw_context, dict):
        return {}
    return {str(k): str(v) for k, v in raw_context.items() if v is not None}


def require_clerk_writer(event: dict[str, Any]) -> dict[str, Any] | None:
    """POST/PUT/DELETE routes, or a GET that must not be served anonymously: authorizer
    must have validated Clerk session JWT (any logged-in user)."""
    context = authorizer_lambda_context(event)
    if context.get("authenticated") != "true" or not context.get("sub"):
        return json_response(401, {"message": "Unauthorized"})
    return None


def parse_body(event: dict[str, Any]) -> dict[str, Any]:
    raw = event.get("body") or "{}"
    if event.get("isBase64Encoded"):
        import base64

        raw = base64.b64decode(raw).decode("utf-8")
    if not raw.strip():
        return {}
    return json.loads(raw)


def generate_ulid() -> str:
    """26-char ULID (lexicographically sortable by creation time). Uses `python-ulid`."""
    return str(ULID())


def to_dynamodb_item(item: dict[str, Any]) -> dict[str, Any]:
    """Convert a plain Python dict (the same shape used with `Table.put_item`) into the
    low-level `AttributeValue`-typed map that `transact_write_items`' `Put.Item` / `Update.Key`
    require. `boto3.dynamodb.types` ships with `boto3` already -- no new dependency.
    """
    serializer = TypeSerializer()
    return {key: serializer.serialize(value) for key, value in item.items()}


def transact_write_items(transact_items: list[dict[str, Any]]) -> dict[str, Any]:
    """Thin wrapper around `client.transact_write_items`, using the lazily-cached low-level
    `_dynamodb_client()` (no new import-time AWS call -- preserves the invariant
    `tests/test_lambda_utils.py` guards: a client, not `boto3.resource`, is still created lazily
    on first use). Returns the raw response (rather than swallowing it) so callers can inspect
    `ClientError.response["CancellationReasons"]` on failure without this helper hiding that
    shape. Must use the plain low-level client (see `_dynamodb_client()`'s docstring) -- not
    `_dynamodb_resource().meta.client` -- since `transact_items` is already pre-serialized via
    `to_dynamodb_item()`.
    """
    return _dynamodb_client().transact_write_items(TransactItems=transact_items)


def scan_all_items(table: Any, **scan_kwargs: Any) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    start_key = None
    while True:
        kwargs = dict(scan_kwargs)
        if start_key:
            kwargs["ExclusiveStartKey"] = start_key
        response = table.scan(**kwargs)
        items.extend(response.get("Items", []))
        start_key = response.get("LastEvaluatedKey")
        if not start_key:
            break
    return items

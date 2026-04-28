"""HTTP + DynamoDB helpers for Lambdas (import as ``shared.lambda_utils``)."""

from __future__ import annotations

import json
import os
from decimal import Decimal
from typing import Any

import boto3
from ulid import ULID

dynamodb: Any = boto3.resource("dynamodb")


def table_from_env(name_env: str):
    table_name = os.environ.get(name_env)
    if not table_name:
        raise RuntimeError(f"Missing env {name_env}")
    return dynamodb.Table(table_name)


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
    """POST routes: authorizer must have validated Clerk session JWT (any logged-in user)."""
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

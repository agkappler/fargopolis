"""Fixtures shared by every Lambda vertical's tests, auto-discovered by pytest for anything under
`infrastructure/lambdas/` (`pytest.ini`'s `testpaths = .`).

Lives at the lambdas root -- not under `shared/` or any `<vertical>/` -- because it must never be
swept into a deployed artifact. `infrastructure/lib/python-lambda-bundling.ts` only ever copies
`<handlerDir>/handler.py` (+ `requirements.txt`) into a handler's own zip, and for the shared
Lambda layer every vertical actually uses in prod, it does `cp -R shared` -- a recursive copy of
the *entire* `shared/` directory. That means nothing under `shared/`, test code included, is safe
to put there; see `tests/test_lambda_utils.py` (this directory) for what used to live at
`shared/tests/` before that was caught and moved here.

See `lambda_test_utils.py` (this directory) for the non-fixture helpers (`load_handler_module`,
`create_table`) built on the same "lives at the lambdas root" rule, and `bounties/tests/conftest.py`
for the reference vertical-specific fixtures built on top of these.
"""

from __future__ import annotations

import json
import os
from typing import Any, Callable

import boto3
import pytest

os.environ.setdefault("AWS_ACCESS_KEY_ID", "testing")
os.environ.setdefault("AWS_SECRET_ACCESS_KEY", "testing")
os.environ.setdefault("AWS_SECURITY_TOKEN", "testing")
os.environ.setdefault("AWS_SESSION_TOKEN", "testing")
os.environ.setdefault("AWS_DEFAULT_REGION", "us-east-1")


@pytest.fixture(scope="session")
def dynamodb_resource() -> Any:
    """A single `boto3.resource("dynamodb")`, reused across every test and `mock_aws()` activation.

    Constructing a boto3 resource (rather than a client) loads botocore's DynamoDB service and
    resource JSON models, which dominates per-test fixture cost (~125ms measured, vs ~3ms for
    `mock_aws()` itself and single-digit ms per `create_table`). moto's `mock_aws()` patches
    request dispatch per-activation regardless of which resource object issues the calls, so one
    resource constructed once (even outside any `mock_aws()` context -- construction makes no AWS
    call) is safe to reuse across every test's own fresh `mock_aws()` context.
    """
    return boto3.resource("dynamodb")


@pytest.fixture
def make_event() -> Callable[..., dict[str, Any]]:
    """Build a minimal API Gateway HTTP API v2 (payload format 2.0) event.

    `body`, when given, is JSON-encoded unless already a `str` (pass a raw string to exercise
    malformed-JSON handling). `query`, when given, becomes `queryStringParameters`. `path_params`,
    when given, becomes `pathParameters` (API Gateway's resolved `{proxy}`-style route
    placeholders -- some handlers read these directly rather than parsing `rawPath` themselves).
    `authenticated=True` mirrors the Clerk authorizer's lambda context contract read by
    `shared.lambda_utils.authorizer_lambda_context`.
    """

    def _make_event(
        method: str,
        path: str,
        body: Any = None,
        query: dict[str, str] | None = None,
        path_params: dict[str, str] | None = None,
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
        if query is not None:
            event["queryStringParameters"] = query
        if path_params is not None:
            event["pathParameters"] = path_params
        if authenticated:
            event["requestContext"]["authorizer"] = {
                "lambda": {"authenticated": "true", "sub": sub or "user_test123"}
            }
        return event

    return _make_event

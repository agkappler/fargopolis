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

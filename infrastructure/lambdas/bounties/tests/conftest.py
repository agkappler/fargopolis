"""Fixtures for bounties handler tests: moto-mocked DynamoDB tables + the shared
`bounties/handler.py` module.

The reference implementation other verticals copy -- see `../../README.md`. Builds on the
cross-vertical fixtures/helpers in `../../conftest.py` (`dynamodb_resource`, `make_event`) and
`../../lambda_test_utils.py` (`load_handler_module`, `create_table`). See
openspec/changes/add-bounties-pytest-scaffolding/design.md for the importlib module-loading
rationale, and openspec/changes/lazy-bind-dynamodb-resource/design.md for why the module import is
session-scoped rather than per-test.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

import pytest
from moto import mock_aws

from lambda_test_utils import create_table, load_handler_module

BOUNTIES_DIR = Path(__file__).resolve().parent.parent
BOUNTIES_TABLE_NAME = "test-bounties"
BOUNTY_CATEGORIES_TABLE_NAME = "test-bounty-categories"


@pytest.fixture(scope="session")
def bounties_handler_module() -> Any:
    """Import `bounties/handler.py` once per test session.

    Session-scoped (not per-test) because `handler.py` has no import-time env-var or AWS
    dependency -- everything it needs is resolved lazily inside route functions -- so nothing
    about a fresh import is test-specific. See `../../tests/test_lambda_utils.py` and
    `test_handler_module_imports_without_table_env_vars` below for the regression guards on that
    assumption.
    """
    return load_handler_module("bounties_handler", BOUNTIES_DIR / "handler.py")


@pytest.fixture
def bounties_handler(bounties_handler_module: Any, dynamodb_resource: Any, monkeypatch: pytest.MonkeyPatch):
    """Moto-mocked DynamoDB tables + the session-imported `bounties/handler.py` module.

    `mock_aws()` wraps the whole fixture body so it's active for every `handler()` call the test
    makes. Per-test isolation comes from creating fresh tables inside a fresh `mock_aws()` context
    each test, not from reimporting the module or reconstructing the DynamoDB resource.
    """
    monkeypatch.setenv("BOUNTIES_TABLE_NAME", BOUNTIES_TABLE_NAME)
    monkeypatch.setenv("BOUNTY_CATEGORIES_TABLE_NAME", BOUNTY_CATEGORIES_TABLE_NAME)

    with mock_aws():
        create_table(dynamodb_resource, BOUNTIES_TABLE_NAME, partition_key="bountyId")
        create_table(dynamodb_resource, BOUNTY_CATEGORIES_TABLE_NAME, partition_key="categoryId")

        yield bounties_handler_module


@pytest.fixture
def bounties_table(bounties_handler: Any, dynamodb_resource: Any) -> Any:
    return dynamodb_resource.Table(BOUNTIES_TABLE_NAME)


@pytest.fixture
def bounty_categories_table(bounties_handler: Any, dynamodb_resource: Any) -> Any:
    return dynamodb_resource.Table(BOUNTY_CATEGORIES_TABLE_NAME)

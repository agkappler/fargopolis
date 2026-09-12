"""Fixtures for recipes handler tests: moto-mocked DynamoDB tables + the shared
`recipes/handler.py` module.

Copied from `bounties/tests/conftest.py` (the reference implementation, see `../../README.md`).
Builds on the cross-vertical fixtures/helpers in `../../conftest.py` (`dynamodb_resource`,
`make_event`) and `../../lambda_test_utils.py` (`load_handler_module`, `create_table`).
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

import pytest
from moto import mock_aws

from lambda_test_utils import create_table, load_handler_module

RECIPES_DIR = Path(__file__).resolve().parent.parent
RECIPES_TABLE_NAME = "test-recipes"
FILES_TABLE_NAME = "test-files"

# Mirrors infrastructure/lib/constructs/recipes-construct.ts's `RecipesByNameIndex` exactly,
# including its `INCLUDE` projection. `GET /api/recipes` reads from this GSI, so list-view items
# only ever carry these projected fields (plus the base table's key attributes, always projected)
# -- `ingredients`, `steps`, and `description` are NOT projected and come back empty there, same
# as production. Using `ProjectionType: "ALL"` here would hide that real behavior.
RECIPES_BY_NAME_INDEX = "RecipesByNameIndex"
RECIPES_BY_NAME_INDEX_SPEC = {
    "IndexName": RECIPES_BY_NAME_INDEX,
    "KeySchema": [
        {"AttributeName": "entityType", "KeyType": "HASH"},
        {"AttributeName": "nameSortKey", "KeyType": "RANGE"},
    ],
    "Projection": {
        "ProjectionType": "INCLUDE",
        "NonKeyAttributes": [
            "name",
            "prepTimeMinutes",
            "cookTimeMinutes",
            "totalCalories",
            "quantity",
            "avatarFileId",
        ],
    },
}


@pytest.fixture(scope="session")
def recipes_handler_module() -> Any:
    """Import `recipes/handler.py` once per test session.

    See `bounties/tests/conftest.py`'s `bounties_handler_module` for the full rationale (identical
    here) and `../../tests/test_lambda_utils.py` for the regression guard it depends on.
    """
    return load_handler_module("recipes_handler", RECIPES_DIR / "handler.py")


@pytest.fixture
def recipes_handler(recipes_handler_module: Any, dynamodb_resource: Any, monkeypatch: pytest.MonkeyPatch):
    """Moto-mocked DynamoDB tables + the session-imported `recipes/handler.py` module."""
    monkeypatch.setenv("RECIPES_TABLE_NAME", RECIPES_TABLE_NAME)
    monkeypatch.setenv("FILES_TABLE_NAME", FILES_TABLE_NAME)

    with mock_aws():
        create_table(
            dynamodb_resource,
            RECIPES_TABLE_NAME,
            partition_key="recipeId",
            global_secondary_indexes=[RECIPES_BY_NAME_INDEX_SPEC],
        )
        create_table(dynamodb_resource, FILES_TABLE_NAME, partition_key="fileId")

        yield recipes_handler_module


@pytest.fixture
def recipes_table(recipes_handler: Any, dynamodb_resource: Any) -> Any:
    return dynamodb_resource.Table(RECIPES_TABLE_NAME)


@pytest.fixture
def files_table(recipes_handler: Any, dynamodb_resource: Any) -> Any:
    return dynamodb_resource.Table(FILES_TABLE_NAME)

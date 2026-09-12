"""Fixtures for dnd handler tests: moto-mocked DynamoDB tables + the shared `dnd/handler.py`
module.

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

DND_DIR = Path(__file__).resolve().parent.parent
DND_TABLE_NAME = "test-dnd-characters"
FILES_TABLE_NAME = "test-files"

# Mirrors infrastructure/lib/constructs/dnd-construct.ts's `DndCharactersByNameIndex` exactly,
# including its `INCLUDE` projection. Notably this projection does NOT include `abilities` or
# `weapons` -- see test_handler.py's "GSI projection bug" tests for what that means for
# _find_character_id_for_ability/_find_character_id_for_weapon, which query this same index.
DND_BY_NAME_INDEX_SPEC = {
    "IndexName": "DndCharactersByNameIndex",
    "KeySchema": [
        {"AttributeName": "entityType", "KeyType": "HASH"},
        {"AttributeName": "nameSortKey", "KeyType": "RANGE"},
    ],
    "Projection": {
        "ProjectionType": "INCLUDE",
        "NonKeyAttributes": ["name", "race", "subrace", "className", "subclassName", "level", "avatarFileId"],
    },
}


@pytest.fixture(scope="session")
def dnd_handler_module() -> Any:
    """Import `dnd/handler.py` once per test session.

    See `bounties/tests/conftest.py`'s `bounties_handler_module` for the full rationale (identical
    here) and `../../tests/test_lambda_utils.py` for the regression guard it depends on.
    """
    return load_handler_module("dnd_handler", DND_DIR / "handler.py")


@pytest.fixture
def dnd_handler(dnd_handler_module: Any, dynamodb_resource: Any, monkeypatch: pytest.MonkeyPatch):
    """Moto-mocked DynamoDB tables + the session-imported `dnd/handler.py` module."""
    monkeypatch.setenv("DND_TABLE_NAME", DND_TABLE_NAME)
    monkeypatch.setenv("FILES_TABLE_NAME", FILES_TABLE_NAME)

    with mock_aws():
        create_table(
            dynamodb_resource,
            DND_TABLE_NAME,
            partition_key="characterId",
            global_secondary_indexes=[DND_BY_NAME_INDEX_SPEC],
        )
        create_table(dynamodb_resource, FILES_TABLE_NAME, partition_key="fileId")

        yield dnd_handler_module


@pytest.fixture
def dnd_table(dnd_handler: Any, dynamodb_resource: Any) -> Any:
    return dynamodb_resource.Table(DND_TABLE_NAME)


@pytest.fixture
def files_table(dnd_handler: Any, dynamodb_resource: Any) -> Any:
    return dynamodb_resource.Table(FILES_TABLE_NAME)

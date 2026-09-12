"""Fixtures for dnd_glossary handler tests: moto-mocked DynamoDB tables + the shared
`dnd_glossary/handler.py` module.

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

DND_GLOSSARY_DIR = Path(__file__).resolve().parent.parent
RACES_TABLE_NAME = "test-dnd-glossary-races"
SUBCLASSES_TABLE_NAME = "test-dnd-glossary-subclasses"

# Mirrors infrastructure/lib/constructs/dnd-glossary-construct.ts's two GSIs exactly, including
# their `INCLUDE` projections.
RACES_BY_NAME_INDEX_SPEC = {
    "IndexName": "DndGlossaryRacesByNameIndex",
    "KeySchema": [
        {"AttributeName": "entityType", "KeyType": "HASH"},
        {"AttributeName": "nameSortKey", "KeyType": "RANGE"},
    ],
    "Projection": {
        "ProjectionType": "INCLUDE",
        "NonKeyAttributes": ["name", "description", "index"],
    },
}
SUBCLASSES_BY_CLASS_INDEX_SPEC = {
    "IndexName": "DndGlossarySubclassesByClassIndex",
    "KeySchema": [
        {"AttributeName": "classIndex", "KeyType": "HASH"},
        {"AttributeName": "nameSortKey", "KeyType": "RANGE"},
    ],
    "Projection": {
        "ProjectionType": "INCLUDE",
        "NonKeyAttributes": ["name", "index", "isCustomClass", "isCustom"],
    },
}


@pytest.fixture(scope="session")
def dnd_glossary_handler_module() -> Any:
    """Import `dnd_glossary/handler.py` once per test session.

    See `bounties/tests/conftest.py`'s `bounties_handler_module` for the full rationale (identical
    here) and `../../tests/test_lambda_utils.py` for the regression guard it depends on.
    """
    return load_handler_module("dnd_glossary_handler", DND_GLOSSARY_DIR / "handler.py")


@pytest.fixture
def dnd_glossary_handler(dnd_glossary_handler_module: Any, dynamodb_resource: Any, monkeypatch: pytest.MonkeyPatch):
    """Moto-mocked DynamoDB tables + the session-imported `dnd_glossary/handler.py` module."""
    monkeypatch.setenv("DND_GLOSSARY_RACES_TABLE_NAME", RACES_TABLE_NAME)
    monkeypatch.setenv("DND_GLOSSARY_SUBCLASSES_TABLE_NAME", SUBCLASSES_TABLE_NAME)

    with mock_aws():
        create_table(
            dynamodb_resource,
            RACES_TABLE_NAME,
            partition_key="raceId",
            global_secondary_indexes=[RACES_BY_NAME_INDEX_SPEC],
        )
        create_table(
            dynamodb_resource,
            SUBCLASSES_TABLE_NAME,
            partition_key="subclassId",
            global_secondary_indexes=[SUBCLASSES_BY_CLASS_INDEX_SPEC],
        )

        yield dnd_glossary_handler_module


@pytest.fixture
def races_table(dnd_glossary_handler: Any, dynamodb_resource: Any) -> Any:
    return dynamodb_resource.Table(RACES_TABLE_NAME)


@pytest.fixture
def subclasses_table(dnd_glossary_handler: Any, dynamodb_resource: Any) -> Any:
    return dynamodb_resource.Table(SUBCLASSES_TABLE_NAME)

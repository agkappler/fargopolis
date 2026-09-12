"""Fixtures for camping handler tests: moto-mocked DynamoDB table + the shared
`camping/handler.py` module.

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

CAMPING_DIR = Path(__file__).resolve().parent.parent
CAMPSITES_TABLE_NAME = "test-campsites"

# Mirrors infrastructure/lib/constructs/campsites-construct.ts's `CampsitesByNameIndex` exactly,
# including its `INCLUDE` projection. `GET /api/campsites` reads from this GSI; `visits` is
# intentionally not projected (the list view never needs it -- `_to_api_campsite_list_entry`
# doesn't read it either), so no projection-mismatch quirk to guard here like recipes/dnd_glossary.
CAMPSITES_BY_NAME_INDEX_SPEC = {
    "IndexName": "CampsitesByNameIndex",
    "KeySchema": [
        {"AttributeName": "entityType", "KeyType": "HASH"},
        {"AttributeName": "nameSortKey", "KeyType": "RANGE"},
    ],
    "Projection": {
        "ProjectionType": "INCLUDE",
        "NonKeyAttributes": [
            "name",
            "lat",
            "lng",
            "region",
            "park",
            "travelTimeMinutes",
            "dyrtUrl",
            "firepit",
            "views",
            "privacy",
            "space",
            "coverPhotoId",
            "visitCount",
            "lastVisitDate",
        ],
    },
}


@pytest.fixture(scope="session")
def camping_handler_module() -> Any:
    """Import `camping/handler.py` once per test session.

    See `bounties/tests/conftest.py`'s `bounties_handler_module` for the full rationale (identical
    here) and `../../tests/test_lambda_utils.py` for the regression guard it depends on.
    """
    return load_handler_module("camping_handler", CAMPING_DIR / "handler.py")


@pytest.fixture
def camping_handler(camping_handler_module: Any, dynamodb_resource: Any, monkeypatch: pytest.MonkeyPatch):
    """Moto-mocked DynamoDB table + the session-imported `camping/handler.py` module."""
    monkeypatch.setenv("CAMPSITES_TABLE_NAME", CAMPSITES_TABLE_NAME)

    with mock_aws():
        create_table(
            dynamodb_resource,
            CAMPSITES_TABLE_NAME,
            partition_key="campsiteId",
            global_secondary_indexes=[CAMPSITES_BY_NAME_INDEX_SPEC],
        )

        yield camping_handler_module


@pytest.fixture
def campsites_table(camping_handler: Any, dynamodb_resource: Any) -> Any:
    return dynamodb_resource.Table(CAMPSITES_TABLE_NAME)

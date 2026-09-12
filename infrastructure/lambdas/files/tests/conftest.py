"""Fixtures for files handler tests: moto-mocked DynamoDB (+ S3, for presigned URLs) tables + the
shared `files/handler.py` module.

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

FILES_DIR = Path(__file__).resolve().parent.parent
FILES_TABLE_NAME = "test-files"
UPLOADS_BUCKET_NAME = "test-fargopolis-uploads"


@pytest.fixture(scope="session")
def files_handler_module() -> Any:
    """Import `files/handler.py` once per test session.

    See `bounties/tests/conftest.py`'s `bounties_handler_module` for the full rationale (identical
    here) and `../../tests/test_lambda_utils.py` for the regression guard it depends on.
    """
    return load_handler_module("files_handler", FILES_DIR / "handler.py")


@pytest.fixture
def files_handler(files_handler_module: Any, dynamodb_resource: Any, monkeypatch: pytest.MonkeyPatch):
    """Moto-mocked DynamoDB table + the session-imported `files/handler.py` module.

    `generate_presigned_url` (used for both reads and the presign-put route) is a pure local
    signing operation -- it never validates that the bucket exists -- so the fixture only needs to
    set `FARGOPOLIS_UPLOADS_BUCKET_NAME`, not actually create an S3 bucket in the mock account.
    """
    monkeypatch.setenv("FILES_TABLE_NAME", FILES_TABLE_NAME)
    monkeypatch.setenv("FARGOPOLIS_UPLOADS_BUCKET_NAME", UPLOADS_BUCKET_NAME)

    with mock_aws():
        create_table(dynamodb_resource, FILES_TABLE_NAME, partition_key="fileId")

        yield files_handler_module


@pytest.fixture
def files_table(files_handler: Any, dynamodb_resource: Any) -> Any:
    return dynamodb_resource.Table(FILES_TABLE_NAME)

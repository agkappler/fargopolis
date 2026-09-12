"""Shared helpers for Lambda-handler unit tests (plain functions, not fixtures -- these take
per-vertical parameters that a fixture can't).

Lives at the lambdas root, not under `shared/` or any `<vertical>/`, for the same bundling-safety
reason as `conftest.py` in this directory -- see that file's docstring.
"""

from __future__ import annotations

import importlib.util
from pathlib import Path
from typing import Any, Sequence


def load_handler_module(module_name: str, handler_path: Path) -> Any:
    """Import a Lambda's flat `handler.py` under a unique module name via `importlib`.

    Every Lambda vertical has a flat top-level `handler.py` -- CDK bundles it as a zip with
    `handler.py` at the root, not as an installed package (see
    `infrastructure/lib/python-lambda-bundling.ts`). A plain `import handler` from two verticals'
    tests in the same pytest session would collide in `sys.modules`, so each vertical's
    session-scoped `<vertical>_handler_module` fixture loads it under its own unique name via this
    helper instead of a normal `import`.
    """
    spec = importlib.util.spec_from_file_location(module_name, handler_path)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def create_table(
    dynamodb: Any,
    table_name: str,
    partition_key: str,
    sort_key: str | None = None,
    global_secondary_indexes: Sequence[dict[str, Any]] = (),
) -> Any:
    """Create an on-demand moto-mocked table with a partition key (+ optional sort key / GSIs).

    Mirrors the on-demand `BillingMode` every real table in this repo uses (see CLAUDE.md's
    DynamoDB conventions). Only create the tables and indexes the handler code under test actually
    exercises -- match concrete access patterns, not the full CDK construct (see
    `openspec/changes/add-bounties-pytest-scaffolding/design.md` Decision 4).

    When a handler reads from a GSI, pass its real `Projection` (copied from the corresponding
    `infrastructure/lib/constructs/*-construct.ts`) in `global_secondary_indexes` rather than
    defaulting to `ALL` -- an overly-generous test projection would hide real production behavior,
    like fields a narrower (`INCLUDE`) projection silently omits from query results.
    """
    key_schema = [{"AttributeName": partition_key, "KeyType": "HASH"}]
    attribute_definitions = [{"AttributeName": partition_key, "AttributeType": "S"}]
    if sort_key:
        key_schema.append({"AttributeName": sort_key, "KeyType": "RANGE"})
        attribute_definitions.append({"AttributeName": sort_key, "AttributeType": "S"})

    kwargs: dict[str, Any] = {
        "TableName": table_name,
        "KeySchema": key_schema,
        "BillingMode": "PAY_PER_REQUEST",
    }

    if global_secondary_indexes:
        known_attrs = {a["AttributeName"] for a in attribute_definitions}
        for gsi in global_secondary_indexes:
            for key in gsi["KeySchema"]:
                if key["AttributeName"] not in known_attrs:
                    attribute_definitions.append({"AttributeName": key["AttributeName"], "AttributeType": "S"})
                    known_attrs.add(key["AttributeName"])
        kwargs["GlobalSecondaryIndexes"] = list(global_secondary_indexes)

    kwargs["AttributeDefinitions"] = attribute_definitions
    return dynamodb.create_table(**kwargs)

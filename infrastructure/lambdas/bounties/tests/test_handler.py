"""Unit tests for infrastructure/lambdas/bounties/handler.py, mocking DynamoDB with moto.

Tests call `handler()` directly with hand-built API Gateway HTTP API v2 events; the Clerk
authorizer itself is not exercised (see design.md Non-Goals) — `authenticated`/writer checks are
tested through the authorizer-context contract `require_clerk_writer` reads.
"""

from __future__ import annotations

import importlib.util
import json

from .conftest import BOUNTIES_DIR


# --- Import-time behavior ------------------------------------------------------------------------


def test_handler_module_imports_without_table_env_vars(monkeypatch) -> None:
    """Regression guard for the session-scoped `bounties_handler_module` fixture: importing
    `handler.py` must not depend on BOUNTIES_TABLE_NAME / BOUNTY_CATEGORIES_TABLE_NAME (or any
    other env state) at import time -- only lazily, inside route functions. The session-scoped
    fixture imports the module once, before any test has set those vars; if a future change
    reintroduced an import-time dependency on them, it would fail here loudly instead of silently
    breaking whichever test happens to resolve that fixture first.
    """
    monkeypatch.delenv("BOUNTIES_TABLE_NAME", raising=False)
    monkeypatch.delenv("BOUNTY_CATEGORIES_TABLE_NAME", raising=False)

    spec = importlib.util.spec_from_file_location(
        "bounties_handler_import_check", BOUNTIES_DIR / "handler.py"
    )
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)  # must not raise


# --- GET /api/bounties ------------------------------------------------------------------------


def test_get_bounties_empty(bounties_handler, make_event):
    resp = bounties_handler.handler(make_event("GET", "/api/bounties"), None)
    assert resp["statusCode"] == 200
    assert json.loads(resp["body"]) == []


def test_get_bounties_sorted_and_status_defaults(bounties_handler, bounties_table, make_event):
    bounties_table.put_item(
        Item={"bountyId": "b2", "title": "Second", "categoryId": "c1", "status": "COMPLETE"}
    )
    bounties_table.put_item(
        Item={"bountyId": "b1", "title": "First", "categoryId": "c1", "status": "not-a-status"}
    )

    resp = bounties_handler.handler(make_event("GET", "/api/bounties"), None)
    body = json.loads(resp["body"])

    assert resp["statusCode"] == 200
    assert [b["bountyId"] for b in body] == ["b1", "b2"]
    assert body[0]["status"] == "ACTIVE"  # invalid stored status normalizes to ACTIVE
    assert body[1]["status"] == "COMPLETE"


# --- GET /api/bountyCategories -----------------------------------------------------------------


def test_get_categories_empty(bounties_handler, make_event):
    resp = bounties_handler.handler(make_event("GET", "/api/bountyCategories"), None)
    assert resp["statusCode"] == 200
    assert json.loads(resp["body"]) == []


def test_get_categories_sorted(bounties_handler, bounty_categories_table, make_event):
    bounty_categories_table.put_item(Item={"categoryId": "c2", "name": "Second"})
    bounty_categories_table.put_item(Item={"categoryId": "c1", "name": "First"})

    resp = bounties_handler.handler(make_event("GET", "/api/bountyCategories"), None)
    body = json.loads(resp["body"])

    assert resp["statusCode"] == 200
    assert [c["categoryId"] for c in body] == ["c1", "c2"]


# --- POST /api/createBounty --------------------------------------------------------------------


def test_create_bounty_requires_auth(bounties_handler, make_event):
    event = make_event("POST", "/api/createBounty", body={"categoryId": "c1"})
    resp = bounties_handler.handler(event, None)
    assert resp["statusCode"] == 401


def test_create_bounty_requires_category_id(bounties_handler, make_event):
    event = make_event("POST", "/api/createBounty", body={"title": "No category"}, authenticated=True)
    resp = bounties_handler.handler(event, None)
    assert resp["statusCode"] == 400


def test_create_bounty_success_persists_item(bounties_handler, bounties_table, make_event):
    body = {
        "title": "Fix the fence",
        "description": "It's broken",
        "categoryId": "c1",
        "expirationDate": "2026-12-31",
    }
    event = make_event("POST", "/api/createBounty", body=body, authenticated=True)
    resp = bounties_handler.handler(event, None)

    assert resp["statusCode"] == 200
    created = json.loads(resp["body"])
    assert created["title"] == "Fix the fence"
    assert created["status"] == "ACTIVE"
    assert created["expirationDate"] == "2026-12-31"

    stored = bounties_table.get_item(Key={"bountyId": created["bountyId"]})["Item"]
    assert stored["categoryId"] == "c1"
    assert stored["expirationDate"] == "2026-12-31"


def test_create_bounty_invalid_status_is_rejected(bounties_handler, make_event):
    body = {"categoryId": "c1", "status": "NOT_A_STATUS"}
    event = make_event("POST", "/api/createBounty", body=body, authenticated=True)
    resp = bounties_handler.handler(event, None)
    assert resp["statusCode"] == 400


# --- POST /api/updateBounty ---------------------------------------------------------------------


def test_update_bounty_requires_auth(bounties_handler, make_event):
    event = make_event("POST", "/api/updateBounty", body={"bountyId": "b1", "categoryId": "c1"})
    resp = bounties_handler.handler(event, None)
    assert resp["statusCode"] == 401


def test_update_bounty_requires_bounty_and_category_id(bounties_handler, make_event):
    event = make_event("POST", "/api/updateBounty", body={"bountyId": "b1"}, authenticated=True)
    resp = bounties_handler.handler(event, None)
    assert resp["statusCode"] == 400


def test_update_bounty_missing_bounty_is_404(bounties_handler, make_event):
    body = {"bountyId": "does-not-exist", "categoryId": "c1"}
    event = make_event("POST", "/api/updateBounty", body=body, authenticated=True)
    resp = bounties_handler.handler(event, None)
    assert resp["statusCode"] == 404


def test_update_bounty_success(bounties_handler, bounties_table, make_event):
    bounties_table.put_item(
        Item={"bountyId": "b1", "title": "Old title", "categoryId": "c1", "status": "ACTIVE"}
    )
    body = {"bountyId": "b1", "title": "New title", "categoryId": "c2", "status": "COMPLETE"}
    event = make_event("POST", "/api/updateBounty", body=body, authenticated=True)
    resp = bounties_handler.handler(event, None)

    assert resp["statusCode"] == 200
    updated = json.loads(resp["body"])
    assert updated["title"] == "New title"
    assert updated["categoryId"] == "c2"
    assert updated["status"] == "COMPLETE"


# --- POST /api/createBountyCategory --------------------------------------------------------------


def test_create_category_requires_auth(bounties_handler, make_event):
    event = make_event("POST", "/api/createBountyCategory", body={"name": "Chores"})
    resp = bounties_handler.handler(event, None)
    assert resp["statusCode"] == 401


def test_create_category_success(bounties_handler, bounty_categories_table, make_event):
    event = make_event(
        "POST", "/api/createBountyCategory", body={"name": "Chores"}, authenticated=True
    )
    resp = bounties_handler.handler(event, None)

    assert resp["statusCode"] == 200
    created = json.loads(resp["body"])
    assert created["name"] == "Chores"

    stored = bounty_categories_table.get_item(Key={"categoryId": created["categoryId"]})["Item"]
    assert stored["name"] == "Chores"


# --- Routing edge cases --------------------------------------------------------------------------


def test_unknown_route_is_404(bounties_handler, make_event):
    event = make_event("GET", "/api/nope")
    resp = bounties_handler.handler(event, None)
    assert resp["statusCode"] == 404
    assert json.loads(resp["body"])["routeKey"] == "GET /api/nope"


def test_options_returns_200_empty_body(bounties_handler, make_event):
    event = make_event("OPTIONS", "/api/bounties")
    resp = bounties_handler.handler(event, None)
    assert resp["statusCode"] == 200
    assert resp["body"] == ""


def test_malformed_json_body_is_400(bounties_handler, make_event):
    event = make_event("POST", "/api/createBounty", body="{not json", authenticated=True)
    resp = bounties_handler.handler(event, None)
    assert resp["statusCode"] == 400

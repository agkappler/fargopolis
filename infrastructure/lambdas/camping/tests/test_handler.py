"""Unit tests for infrastructure/lambdas/camping/handler.py, mocking DynamoDB with moto.

Built on the shared fixtures/helpers in `../../conftest.py` and `../../lambda_test_utils.py` --
see `bounties/tests/test_handler.py` for the reference implementation this pattern is copied from.
Tests call `handler()` directly with hand-built API Gateway HTTP API v2 events; the Clerk
authorizer itself is not exercised (see openspec/changes/add-bounties-pytest-scaffolding/design.md
Non-Goals) -- `authenticated`/writer checks are tested through the authorizer-context contract
`require_clerk_writer` reads.
"""

from __future__ import annotations

import json


def _create_campsite(camping_handler, make_event, name="Pine Ridge", lat=44.5, lng=-110.2, **extra):
    body = {"name": name, "lat": lat, "lng": lng, **extra}
    event = make_event("POST", "/api/createCampsite", body=body, authenticated=True)
    resp = camping_handler.handler(event, None)
    return json.loads(resp["body"])


def _add_visit(camping_handler, make_event, campsite_id, start_date="2026-06-01", **extra):
    body = {"startDate": start_date, **extra}
    event = make_event(
        "POST", f"/api/addVisitToCampsite/{campsite_id}", body=body, authenticated=True
    )
    resp = camping_handler.handler(event, None)
    return json.loads(resp["body"])


# --- GET /api/campsites -----------------------------------------------------------------------


def test_list_campsites_empty(camping_handler, make_event):
    resp = camping_handler.handler(make_event("GET", "/api/campsites"), None)
    assert resp["statusCode"] == 200
    assert json.loads(resp["body"]) == []


# --- GET /api/campsite/{campsiteId} ---------------------------------------------------------------


def test_get_campsite_not_found(camping_handler, make_event):
    resp = camping_handler.handler(make_event("GET", "/api/campsite/does-not-exist"), None)
    assert resp["statusCode"] == 404


def test_get_campsite_success(camping_handler, make_event):
    created = _create_campsite(camping_handler, make_event)
    resp = camping_handler.handler(make_event("GET", f"/api/campsite/{created['campsiteId']}"), None)
    assert resp["statusCode"] == 200
    assert json.loads(resp["body"])["name"] == "Pine Ridge"


# --- POST /api/createCampsite -----------------------------------------------------------------------


def test_create_campsite_requires_auth(camping_handler, make_event):
    event = make_event("POST", "/api/createCampsite", body={"name": "Pine Ridge", "lat": 44.5, "lng": -110.2})
    resp = camping_handler.handler(event, None)
    assert resp["statusCode"] == 401


def test_create_campsite_requires_name(camping_handler, make_event):
    event = make_event("POST", "/api/createCampsite", body={"lat": 44.5, "lng": -110.2}, authenticated=True)
    resp = camping_handler.handler(event, None)
    assert resp["statusCode"] == 400


def test_create_campsite_requires_valid_lat(camping_handler, make_event):
    event = make_event(
        "POST", "/api/createCampsite", body={"name": "Bad Lat", "lat": 200, "lng": -110.2}, authenticated=True
    )
    resp = camping_handler.handler(event, None)
    assert resp["statusCode"] == 400


def test_create_campsite_requires_valid_rating(camping_handler, make_event):
    event = make_event(
        "POST",
        "/api/createCampsite",
        body={"name": "Bad Rating", "lat": 44.5, "lng": -110.2, "views": 6},
        authenticated=True,
    )
    resp = camping_handler.handler(event, None)
    assert resp["statusCode"] == 400


def test_create_campsite_success_persists_item(camping_handler, campsites_table, make_event):
    created = _create_campsite(camping_handler, make_event, region="Wyoming", firepit=True, views=5)
    assert created["region"] == "Wyoming"
    assert created["firepit"] is True
    assert created["visits"] == []

    stored = campsites_table.get_item(Key={"campsiteId": created["campsiteId"]})["Item"]
    assert stored["entityType"] == "CAMPSITE"
    assert stored["nameSortKey"] == f"pine ridge#{created['campsiteId']}"
    assert stored["version"] == 0


# --- POST /api/updateCampsite -----------------------------------------------------------------------


def test_update_campsite_requires_auth(camping_handler, make_event):
    event = make_event(
        "POST", "/api/updateCampsite", body={"campsiteId": "c1", "name": "New", "lat": 1, "lng": 1}
    )
    resp = camping_handler.handler(event, None)
    assert resp["statusCode"] == 401


def test_update_campsite_missing_is_404(camping_handler, make_event):
    body = {"campsiteId": "does-not-exist", "name": "New", "lat": 1, "lng": 1}
    event = make_event("POST", "/api/updateCampsite", body=body, authenticated=True)
    resp = camping_handler.handler(event, None)
    assert resp["statusCode"] == 404


def test_update_campsite_success(camping_handler, make_event):
    created = _create_campsite(camping_handler, make_event)
    body = {"campsiteId": created["campsiteId"], "name": "Pine Ridge Updated", "lat": 45.0, "lng": -111.0}
    event = make_event("POST", "/api/updateCampsite", body=body, authenticated=True)
    resp = camping_handler.handler(event, None)
    assert resp["statusCode"] == 200
    assert json.loads(resp["body"])["name"] == "Pine Ridge Updated"


# --- DELETE /api/campsite/{campsiteId} ----------------------------------------------------------------


def test_delete_campsite_requires_auth(camping_handler, make_event):
    resp = camping_handler.handler(make_event("DELETE", "/api/campsite/c1"), None)
    assert resp["statusCode"] == 401


def test_delete_campsite_missing_still_returns_200(camping_handler, make_event):
    """`_delete_campsite` uses a plain `delete_item` with no `ConditionExpression` -- deleting a
    campsite that doesn't exist is *not* a 404, it just succeeds (matches DynamoDB's own
    delete-is-idempotent semantics). Worth locking in since every other "missing resource" route
    in this handler returns 404."""
    event = make_event("DELETE", "/api/campsite/does-not-exist", authenticated=True)
    resp = camping_handler.handler(event, None)
    assert resp["statusCode"] == 200
    assert json.loads(resp["body"]) == {"campsiteId": "does-not-exist", "deleted": True}


def test_delete_campsite_success(camping_handler, campsites_table, make_event):
    created = _create_campsite(camping_handler, make_event)
    event = make_event("DELETE", f"/api/campsite/{created['campsiteId']}", authenticated=True)
    resp = camping_handler.handler(event, None)
    assert resp["statusCode"] == 200
    assert "Item" not in campsites_table.get_item(Key={"campsiteId": created["campsiteId"]})


# --- POST /api/addVisitToCampsite/{campsiteId} ----------------------------------------------------


def test_add_visit_requires_auth(camping_handler, make_event):
    event = make_event("POST", "/api/addVisitToCampsite/c1", body={"startDate": "2026-06-01"})
    resp = camping_handler.handler(event, None)
    assert resp["statusCode"] == 401


def test_add_visit_missing_campsite_is_404(camping_handler, make_event):
    event = make_event(
        "POST", "/api/addVisitToCampsite/does-not-exist", body={"startDate": "2026-06-01"}, authenticated=True
    )
    resp = camping_handler.handler(event, None)
    assert resp["statusCode"] == 404


def test_add_visit_end_date_before_start_date_is_400(camping_handler, make_event):
    created = _create_campsite(camping_handler, make_event)
    event = make_event(
        "POST",
        f"/api/addVisitToCampsite/{created['campsiteId']}",
        body={"startDate": "2026-06-10", "endDate": "2026-06-01"},
        authenticated=True,
    )
    resp = camping_handler.handler(event, None)
    assert resp["statusCode"] == 400


def test_add_visit_success_updates_summary(camping_handler, make_event):
    created = _create_campsite(camping_handler, make_event)
    updated = _add_visit(
        camping_handler, make_event, created["campsiteId"], start_date="2026-06-01", people=["Alex", "Sam"]
    )
    assert updated["visitCount"] == 1
    assert updated["lastVisitDate"] == "2026-06-01"
    assert updated["visits"][0]["people"] == ["Alex", "Sam"]
    assert updated["visits"][0]["photoIds"] == []


# --- POST /api/updateVisit ------------------------------------------------------------------------


def test_update_visit_requires_auth(camping_handler, make_event):
    event = make_event("POST", "/api/updateVisit", body={"campsiteId": "c1", "visitId": "v1"})
    resp = camping_handler.handler(event, None)
    assert resp["statusCode"] == 401


def test_update_visit_missing_visit_is_404(camping_handler, make_event):
    created = _create_campsite(camping_handler, make_event)
    body = {"campsiteId": created["campsiteId"], "visitId": "does-not-exist", "startDate": "2026-06-01"}
    event = make_event("POST", "/api/updateVisit", body=body, authenticated=True)
    resp = camping_handler.handler(event, None)
    assert resp["statusCode"] == 404


def test_update_visit_success_preserves_photo_ids(camping_handler, make_event):
    created = _create_campsite(camping_handler, make_event)
    with_visit = _add_visit(camping_handler, make_event, created["campsiteId"])
    visit_id = with_visit["visits"][0]["visitId"]

    photos_event = make_event(
        "POST",
        "/api/updateVisitPhotos",
        body={"campsiteId": created["campsiteId"], "visitId": visit_id, "photoIds": ["p1", "p2"]},
        authenticated=True,
    )
    camping_handler.handler(photos_event, None)

    update_event = make_event(
        "POST",
        "/api/updateVisit",
        body={"campsiteId": created["campsiteId"], "visitId": visit_id, "startDate": "2026-06-02", "notes": "Great trip"},
        authenticated=True,
    )
    resp = camping_handler.handler(update_event, None)
    assert resp["statusCode"] == 200
    updated_visit = json.loads(resp["body"])["visits"][0]
    assert updated_visit["startDate"] == "2026-06-02"
    assert updated_visit["notes"] == "Great trip"
    assert updated_visit["photoIds"] == ["p1", "p2"]


# --- POST /api/deleteVisit -------------------------------------------------------------------------


def test_delete_visit_requires_auth(camping_handler, make_event):
    event = make_event("POST", "/api/deleteVisit", body={"campsiteId": "c1", "visitId": "v1"})
    resp = camping_handler.handler(event, None)
    assert resp["statusCode"] == 401


def test_delete_visit_missing_is_404(camping_handler, make_event):
    created = _create_campsite(camping_handler, make_event)
    body = {"campsiteId": created["campsiteId"], "visitId": "does-not-exist"}
    event = make_event("POST", "/api/deleteVisit", body=body, authenticated=True)
    resp = camping_handler.handler(event, None)
    assert resp["statusCode"] == 404


def test_delete_visit_success_clears_cover_when_invalidated(camping_handler, make_event):
    """Deleting the visit that owns the campsite's `coverPhotoId` must clear the cover --
    `_write_visits` recomputes valid photo ids from the surviving visits and REMOVEs `coverPhotoId`
    when it no longer points at any of them."""
    created = _create_campsite(camping_handler, make_event)
    with_visit = _add_visit(camping_handler, make_event, created["campsiteId"])
    visit_id = with_visit["visits"][0]["visitId"]

    camping_handler.handler(
        make_event(
            "POST",
            "/api/updateVisitPhotos",
            body={"campsiteId": created["campsiteId"], "visitId": visit_id, "photoIds": ["p1"]},
            authenticated=True,
        ),
        None,
    )
    camping_handler.handler(
        make_event(
            "POST",
            "/api/updateCampsiteCover",
            body={"campsiteId": created["campsiteId"], "coverPhotoId": "p1"},
            authenticated=True,
        ),
        None,
    )

    resp = camping_handler.handler(
        make_event(
            "POST",
            "/api/deleteVisit",
            body={"campsiteId": created["campsiteId"], "visitId": visit_id},
            authenticated=True,
        ),
        None,
    )
    assert resp["statusCode"] == 200
    updated = json.loads(resp["body"])
    assert updated["visits"] == []
    assert updated["coverPhotoId"] is None


# --- POST /api/updateVisitPhotos ------------------------------------------------------------------


def test_update_visit_photos_requires_list(camping_handler, make_event):
    created = _create_campsite(camping_handler, make_event)
    with_visit = _add_visit(camping_handler, make_event, created["campsiteId"])
    visit_id = with_visit["visits"][0]["visitId"]

    event = make_event(
        "POST",
        "/api/updateVisitPhotos",
        body={"campsiteId": created["campsiteId"], "visitId": visit_id, "photoIds": "not-a-list"},
        authenticated=True,
    )
    resp = camping_handler.handler(event, None)
    assert resp["statusCode"] == 400


def test_update_visit_photos_success(camping_handler, make_event):
    created = _create_campsite(camping_handler, make_event)
    with_visit = _add_visit(camping_handler, make_event, created["campsiteId"])
    visit_id = with_visit["visits"][0]["visitId"]

    event = make_event(
        "POST",
        "/api/updateVisitPhotos",
        body={"campsiteId": created["campsiteId"], "visitId": visit_id, "photoIds": ["p1", "p2"]},
        authenticated=True,
    )
    resp = camping_handler.handler(event, None)
    assert resp["statusCode"] == 200
    assert json.loads(resp["body"])["visits"][0]["photoIds"] == ["p1", "p2"]


# --- POST /api/updateCampsiteCover ------------------------------------------------------------------


def test_update_campsite_cover_rejects_photo_not_belonging_to_visits(camping_handler, make_event):
    created = _create_campsite(camping_handler, make_event)
    event = make_event(
        "POST",
        "/api/updateCampsiteCover",
        body={"campsiteId": created["campsiteId"], "coverPhotoId": "not-a-real-photo"},
        authenticated=True,
    )
    resp = camping_handler.handler(event, None)
    assert resp["statusCode"] == 400


def test_update_campsite_cover_success(camping_handler, make_event):
    created = _create_campsite(camping_handler, make_event)
    with_visit = _add_visit(camping_handler, make_event, created["campsiteId"])
    visit_id = with_visit["visits"][0]["visitId"]
    camping_handler.handler(
        make_event(
            "POST",
            "/api/updateVisitPhotos",
            body={"campsiteId": created["campsiteId"], "visitId": visit_id, "photoIds": ["p1"]},
            authenticated=True,
        ),
        None,
    )

    resp = camping_handler.handler(
        make_event(
            "POST",
            "/api/updateCampsiteCover",
            body={"campsiteId": created["campsiteId"], "coverPhotoId": "p1"},
            authenticated=True,
        ),
        None,
    )
    assert resp["statusCode"] == 200
    assert json.loads(resp["body"])["coverPhotoId"] == "p1"


def test_update_campsite_cover_clear_with_null(camping_handler, make_event):
    created = _create_campsite(camping_handler, make_event)
    with_visit = _add_visit(camping_handler, make_event, created["campsiteId"])
    visit_id = with_visit["visits"][0]["visitId"]
    camping_handler.handler(
        make_event(
            "POST",
            "/api/updateVisitPhotos",
            body={"campsiteId": created["campsiteId"], "visitId": visit_id, "photoIds": ["p1"]},
            authenticated=True,
        ),
        None,
    )
    camping_handler.handler(
        make_event(
            "POST",
            "/api/updateCampsiteCover",
            body={"campsiteId": created["campsiteId"], "coverPhotoId": "p1"},
            authenticated=True,
        ),
        None,
    )

    resp = camping_handler.handler(
        make_event(
            "POST",
            "/api/updateCampsiteCover",
            body={"campsiteId": created["campsiteId"], "coverPhotoId": None},
            authenticated=True,
        ),
        None,
    )
    assert resp["statusCode"] == 200
    assert json.loads(resp["body"])["coverPhotoId"] is None


# --- Routing edge cases ----------------------------------------------------------------------------


def test_unknown_route_is_404(camping_handler, make_event):
    resp = camping_handler.handler(make_event("GET", "/api/nope"), None)
    assert resp["statusCode"] == 404


def test_options_returns_200_empty_body(camping_handler, make_event):
    resp = camping_handler.handler(make_event("OPTIONS", "/api/campsites"), None)
    assert resp["statusCode"] == 200
    assert resp["body"] == ""

"""Unit tests for infrastructure/lambdas/files/handler.py, mocking DynamoDB (+ S3 for presigned
URL generation, which never touches the network) with moto.

Built on the shared fixtures/helpers in `../../conftest.py` and `../../lambda_test_utils.py` --
see `bounties/tests/test_handler.py` for the reference implementation this pattern is copied from.
Tests call `handler()` directly with hand-built API Gateway HTTP API v2 events; the Clerk
authorizer itself is not exercised (see openspec/changes/add-bounties-pytest-scaffolding/design.md
Non-Goals) -- `authenticated`/writer checks are tested through the authorizer-context contract
`require_clerk_writer` reads.
"""

from __future__ import annotations

import json


# --- GET /api/fileUrl/{fileId} ----------------------------------------------------------------


def test_get_file_url_by_id_not_found(files_handler, make_event):
    resp = files_handler.handler(make_event("GET", "/api/fileUrl/does-not-exist"), None)
    assert resp["statusCode"] == 404


def test_get_file_url_by_id_success(files_handler, files_table, make_event):
    files_table.put_item(
        Item={
            "fileId": "f1",
            "uuId": "uuid-1",
            "filename": "chili.jpg",
            "contentType": "image/jpeg",
            "sizeBytes": 1024,
            "fileRole": "RECIPE_IMAGE",
        }
    )

    resp = files_handler.handler(make_event("GET", "/api/fileUrl/f1"), None)
    assert resp["statusCode"] == 200
    body = json.loads(resp["body"])
    assert body["fileId"] == "f1"
    assert body["filename"] == "chili.jpg"
    assert body["fileRole"] == "RECIPE_IMAGE"
    assert "uuid-1_chili.jpg" in body["url"]


def test_get_file_url_by_id_campsite_photo_requires_auth(files_handler, files_table, make_event):
    files_table.put_item(
        Item={
            "fileId": "photo1",
            "uuId": "uuid-2",
            "filename": "campsite.jpg",
            "contentType": "image/jpeg",
            "sizeBytes": 2048,
            "fileRole": "CAMPSITE_PHOTO",
        }
    )

    resp = files_handler.handler(make_event("GET", "/api/fileUrl/photo1"), None)
    assert resp["statusCode"] == 401


def test_get_file_url_by_id_campsite_photo_success_when_authenticated(files_handler, files_table, make_event):
    files_table.put_item(
        Item={
            "fileId": "photo1",
            "uuId": "uuid-2",
            "filename": "campsite.jpg",
            "contentType": "image/jpeg",
            "sizeBytes": 2048,
            "fileRole": "CAMPSITE_PHOTO",
        }
    )

    event = make_event("GET", "/api/fileUrl/photo1", authenticated=True)
    resp = files_handler.handler(event, None)
    assert resp["statusCode"] == 200
    body = json.loads(resp["body"])
    assert body["fileId"] == "photo1"
    assert body["fileRole"] == "CAMPSITE_PHOTO"
    assert "uuid-2_campsite.jpg" in body["url"]


# --- GET /api/getLatestResumeUrl ------------------------------------------------------------------


def test_get_latest_resume_url_empty(files_handler, make_event):
    resp = files_handler.handler(make_event("GET", "/api/getLatestResumeUrl"), None)
    assert resp["statusCode"] == 200
    assert json.loads(resp["body"]) == {"url": ""}


def test_get_latest_resume_url_matches_legacy_numeric_role_variants(files_handler, files_table, make_event):
    """`_get_latest_resume_url`'s filter matches `fileRole` stored as the string `"RESUME"` (new
    records) or the legacy Postgres role code, as either a DynamoDB Number (4) or String ("4").
    Each item added below has a lexicographically later `fileId` than the last, so if the latest
    result advances each time, that specific role representation was included by the filter."""
    files_table.put_item(Item={"fileId": "a", "uuId": "u-a", "filename": "resume-a.pdf", "fileRole": "RESUME"})
    resp = files_handler.handler(make_event("GET", "/api/getLatestResumeUrl"), None)
    assert "u-a_resume-a.pdf" in json.loads(resp["body"])["url"]

    files_table.put_item(Item={"fileId": "b", "uuId": "u-b", "filename": "resume-b.pdf", "fileRole": 4})
    resp = files_handler.handler(make_event("GET", "/api/getLatestResumeUrl"), None)
    assert "u-b_resume-b.pdf" in json.loads(resp["body"])["url"]

    files_table.put_item(Item={"fileId": "c", "uuId": "u-c", "filename": "resume-c.pdf", "fileRole": "4"})
    resp = files_handler.handler(make_event("GET", "/api/getLatestResumeUrl"), None)
    assert "u-c_resume-c.pdf" in json.loads(resp["body"])["url"]

    files_table.put_item(Item={"fileId": "d", "uuId": "u-d", "filename": "not-a-resume.pdf", "fileRole": "RECIPE_IMAGE"})
    resp = files_handler.handler(make_event("GET", "/api/getLatestResumeUrl"), None)
    assert "u-c_resume-c.pdf" in json.loads(resp["body"])["url"]


def test_get_latest_resume_url_prefers_ulid_over_legacy_numeric_id(files_handler, files_table, make_event):
    """`_latest_resume_item`'s sort key ranks any non-numeric (ULID, post-migration) `fileId`
    above any numeric (legacy Postgres) one, regardless of the numeric value -- a resume uploaded
    through the current system always outranks a pre-migration one."""
    files_table.put_item(Item={"fileId": "999999", "uuId": "u-legacy", "filename": "old.pdf", "fileRole": "RESUME"})
    files_table.put_item(Item={"fileId": "01arz3ndektsv4rrffq69g5fav", "uuId": "u-new", "filename": "new.pdf", "fileRole": "RESUME"})

    resp = files_handler.handler(make_event("GET", "/api/getLatestResumeUrl"), None)
    assert "u-new_new.pdf" in json.loads(resp["body"])["url"]


def test_get_latest_resume_url_picks_highest_among_numeric_ids(files_handler, files_table, make_event):
    files_table.put_item(Item={"fileId": "5", "uuId": "u-5", "filename": "five.pdf", "fileRole": "RESUME"})
    files_table.put_item(Item={"fileId": "42", "uuId": "u-42", "filename": "forty-two.pdf", "fileRole": "RESUME"})

    resp = files_handler.handler(make_event("GET", "/api/getLatestResumeUrl"), None)
    assert "u-42_forty-two.pdf" in json.loads(resp["body"])["url"]


# --- POST /api/files/presignPut -------------------------------------------------------------------


def test_presign_put_requires_auth(files_handler, make_event):
    body = {"filename": "chili.jpg", "contentType": "image/jpeg", "sizeBytes": 1024, "fileRole": "RECIPE_IMAGE"}
    resp = files_handler.handler(make_event("POST", "/api/files/presignPut", body=body), None)
    assert resp["statusCode"] == 401


def test_presign_put_requires_filename(files_handler, make_event):
    body = {"contentType": "image/jpeg", "sizeBytes": 1024, "fileRole": "RECIPE_IMAGE"}
    event = make_event("POST", "/api/files/presignPut", body=body, authenticated=True)
    resp = files_handler.handler(event, None)
    assert resp["statusCode"] == 400


def test_presign_put_requires_content_type(files_handler, make_event):
    body = {"filename": "chili.jpg", "sizeBytes": 1024, "fileRole": "RECIPE_IMAGE"}
    event = make_event("POST", "/api/files/presignPut", body=body, authenticated=True)
    resp = files_handler.handler(event, None)
    assert resp["statusCode"] == 400


def test_presign_put_requires_size_bytes(files_handler, make_event):
    body = {"filename": "chili.jpg", "contentType": "image/jpeg", "fileRole": "RECIPE_IMAGE"}
    event = make_event("POST", "/api/files/presignPut", body=body, authenticated=True)
    resp = files_handler.handler(event, None)
    assert resp["statusCode"] == 400


def test_presign_put_requires_valid_file_role(files_handler, make_event):
    body = {"filename": "chili.jpg", "contentType": "image/jpeg", "sizeBytes": 1024, "fileRole": "NOT_A_ROLE"}
    event = make_event("POST", "/api/files/presignPut", body=body, authenticated=True)
    resp = files_handler.handler(event, None)
    assert resp["statusCode"] == 400


def test_presign_put_success_persists_item(files_handler, files_table, make_event):
    body = {
        "filename": "chili.jpg",
        "contentType": "image/jpeg",
        "sizeBytes": 1024,
        "fileRole": "recipe_image",
        "uuId": "uuid-1",
    }
    event = make_event("POST", "/api/files/presignPut", body=body, authenticated=True)
    resp = files_handler.handler(event, None)

    assert resp["statusCode"] == 200
    created = json.loads(resp["body"])
    assert created["fileRole"] == "RECIPE_IMAGE"
    assert created["uploadMethod"] == "PUT"
    assert created["objectKey"] == "uuid-1_chili.jpg"
    assert "uuid-1_chili.jpg" in created["uploadUrl"]

    stored = files_table.get_item(Key={"fileId": created["fileId"]})["Item"]
    assert stored["filename"] == "chili.jpg"
    assert stored["fileRole"] == "RECIPE_IMAGE"


# --- Routing edge cases ----------------------------------------------------------------------------


def test_unknown_route_is_404(files_handler, make_event):
    resp = files_handler.handler(make_event("GET", "/api/nope"), None)
    assert resp["statusCode"] == 404


def test_options_returns_200_empty_body(files_handler, make_event):
    resp = files_handler.handler(make_event("OPTIONS", "/api/fileUrl/f1"), None)
    assert resp["statusCode"] == 200
    assert resp["body"] == ""

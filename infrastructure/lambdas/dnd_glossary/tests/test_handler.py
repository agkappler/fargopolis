"""Unit tests for infrastructure/lambdas/dnd_glossary/handler.py, mocking DynamoDB with moto.

Built on the shared fixtures/helpers in `../../conftest.py` and `../../lambda_test_utils.py` --
see `bounties/tests/test_handler.py` for the reference implementation this pattern is copied from.
Tests call `handler()` directly with hand-built API Gateway HTTP API v2 events (including
`pathParameters`, which several routes here read directly rather than parsing `rawPath`); the
Clerk authorizer itself is not exercised (see
openspec/changes/add-bounties-pytest-scaffolding/design.md Non-Goals) -- `authenticated`/writer
checks are tested through the authorizer-context contract `require_clerk_writer` reads.
"""

from __future__ import annotations

import json


def _create_race(dnd_glossary_handler, make_event, name="Aasimar", description="Celestial-touched"):
    event = make_event(
        "POST", "/api/createRace", body={"name": name, "description": description}, authenticated=True
    )
    resp = dnd_glossary_handler.handler(event, None)
    return json.loads(resp["body"])


def _create_subclass(dnd_glossary_handler, make_event, name="Way of Shadow", class_index="monk"):
    event = make_event(
        "POST",
        "/api/subclasses/createSubclass",
        body={"name": name, "classIndex": class_index},
        authenticated=True,
    )
    resp = dnd_glossary_handler.handler(event, None)
    return json.loads(resp["body"])


# --- GET /api/races (auth-gated: empty list, not 401, when unauthenticated) ---------------------


def test_get_races_unauthenticated_returns_empty_list(dnd_glossary_handler, make_event):
    """`_get_races_list` returns 200 + [] for unauthenticated requests rather than 401 -- parity
    with the legacy Java controller's "authenticated-only empty list" behavior."""
    resp = dnd_glossary_handler.handler(make_event("GET", "/api/races"), None)
    assert resp["statusCode"] == 200
    assert json.loads(resp["body"]) == []


def test_get_races_authenticated_lists_by_name(dnd_glossary_handler, make_event):
    _create_race(dnd_glossary_handler, make_event, name="Zephyrborn")
    _create_race(dnd_glossary_handler, make_event, name="Aasimar")

    resp = dnd_glossary_handler.handler(make_event("GET", "/api/races", authenticated=True), None)
    assert resp["statusCode"] == 200
    names = [r["name"] for r in json.loads(resp["body"])]
    assert names == ["Aasimar", "Zephyrborn"]


# --- GET /api/races/{raceId} (auth-gated: literal `null` body, not 401, when unauthenticated) ---


def test_get_race_unauthenticated_returns_null_body(dnd_glossary_handler, make_event):
    resp = dnd_glossary_handler.handler(
        make_event("GET", "/api/races/does-not-exist", path_params={"raceId": "does-not-exist"}), None
    )
    assert resp["statusCode"] == 200
    assert resp["body"] == "null"


def test_get_race_authenticated_not_found(dnd_glossary_handler, make_event):
    event = make_event(
        "GET", "/api/races/does-not-exist", path_params={"raceId": "does-not-exist"}, authenticated=True
    )
    resp = dnd_glossary_handler.handler(event, None)
    assert resp["statusCode"] == 404


def test_get_race_authenticated_success(dnd_glossary_handler, make_event):
    race = _create_race(dnd_glossary_handler, make_event)
    event = make_event(
        "GET", f"/api/races/{race['raceId']}", path_params={"raceId": race["raceId"]}, authenticated=True
    )
    resp = dnd_glossary_handler.handler(event, None)
    assert resp["statusCode"] == 200
    assert json.loads(resp["body"])["name"] == "Aasimar"


# --- GET /api/races/{raceId}/traits (public -- no auth gate) -------------------------------------


def test_get_traits_not_found(dnd_glossary_handler, make_event):
    event = make_event(
        "GET", "/api/races/does-not-exist/traits", path_params={"raceId": "does-not-exist"}
    )
    resp = dnd_glossary_handler.handler(event, None)
    assert resp["statusCode"] == 404


def test_get_traits_success(dnd_glossary_handler, make_event):
    race = _create_race(dnd_glossary_handler, make_event)
    race_id = race["raceId"]
    dnd_glossary_handler.handler(
        make_event(
            "POST",
            f"/api/races/{race_id}/updateTraits",
            body=[{"name": "Celestial Resistance", "description": "Resist necrotic/radiant"}],
            path_params={"raceId": race_id},
            authenticated=True,
        ),
        None,
    )

    resp = dnd_glossary_handler.handler(
        make_event("GET", f"/api/races/{race_id}/traits", path_params={"raceId": race_id}), None
    )
    assert resp["statusCode"] == 200
    traits = json.loads(resp["body"])
    assert [t["name"] for t in traits] == ["Celestial Resistance"]


# --- POST /api/createRace -------------------------------------------------------------------------


def test_create_race_requires_auth(dnd_glossary_handler, make_event):
    event = make_event("POST", "/api/createRace", body={"name": "Aasimar"})
    resp = dnd_glossary_handler.handler(event, None)
    assert resp["statusCode"] == 401


def test_create_race_requires_name(dnd_glossary_handler, make_event):
    event = make_event("POST", "/api/createRace", body={"description": "No name"}, authenticated=True)
    resp = dnd_glossary_handler.handler(event, None)
    assert resp["statusCode"] == 400


def test_create_race_success_persists_item(dnd_glossary_handler, races_table, make_event):
    created = _create_race(dnd_glossary_handler, make_event)
    stored = races_table.get_item(Key={"raceId": created["raceId"]})["Item"]
    assert stored["entityType"] == "RACE"
    assert stored["nameSortKey"] == f"aasimar#{created['raceId']}"
    assert stored["index"] == "aasimar"
    assert stored["traits"] == []


# --- POST /api/races/{raceId}/updateTraits --------------------------------------------------------


def test_update_traits_requires_auth(dnd_glossary_handler, make_event):
    event = make_event(
        "POST", "/api/races/r1/updateTraits", body=[], path_params={"raceId": "r1"}
    )
    resp = dnd_glossary_handler.handler(event, None)
    assert resp["statusCode"] == 401


def test_update_traits_requires_list_body(dnd_glossary_handler, make_event):
    race = _create_race(dnd_glossary_handler, make_event)
    event = make_event(
        "POST",
        f"/api/races/{race['raceId']}/updateTraits",
        body={"name": "Not a list"},
        path_params={"raceId": race["raceId"]},
        authenticated=True,
    )
    resp = dnd_glossary_handler.handler(event, None)
    assert resp["statusCode"] == 400


def test_update_traits_missing_race_is_404(dnd_glossary_handler, make_event):
    event = make_event(
        "POST",
        "/api/races/does-not-exist/updateTraits",
        body=[],
        path_params={"raceId": "does-not-exist"},
        authenticated=True,
    )
    resp = dnd_glossary_handler.handler(event, None)
    assert resp["statusCode"] == 404


def test_update_traits_success(dnd_glossary_handler, races_table, make_event):
    race = _create_race(dnd_glossary_handler, make_event)
    race_id = race["raceId"]
    event = make_event(
        "POST",
        f"/api/races/{race_id}/updateTraits",
        body=[{"name": "Darkvision", "description": "See in the dark"}],
        path_params={"raceId": race_id},
        authenticated=True,
    )
    resp = dnd_glossary_handler.handler(event, None)
    assert resp["statusCode"] == 200
    assert json.loads(resp["body"])[0]["name"] == "Darkvision"

    stored = races_table.get_item(Key={"raceId": race_id})["Item"]
    assert stored["version"] == 1


# --- GET /api/subclasses/class/{classIndex} ---------------------------------------------------------


def test_get_subclasses_by_class(dnd_glossary_handler, make_event):
    _create_subclass(dnd_glossary_handler, make_event, name="Way of Shadow", class_index="monk")
    _create_subclass(dnd_glossary_handler, make_event, name="Circle of Spores", class_index="druid")

    event = make_event("GET", "/api/subclasses/class/monk", path_params={"classIndex": "monk"})
    resp = dnd_glossary_handler.handler(event, None)
    assert resp["statusCode"] == 200
    subclasses = json.loads(resp["body"])
    assert [s["name"] for s in subclasses] == ["Way of Shadow"]


# --- GET /api/subclasses/{subclassId} ---------------------------------------------------------------


def test_get_subclass_not_found(dnd_glossary_handler, make_event):
    event = make_event(
        "GET", "/api/subclasses/does-not-exist", path_params={"subclassId": "does-not-exist"}
    )
    resp = dnd_glossary_handler.handler(event, None)
    assert resp["statusCode"] == 404


# --- GET /api/subclasses/{subclassId}/features (public) + updateFeatures ---------------------------


def test_get_features_success(dnd_glossary_handler, make_event):
    subclass = _create_subclass(dnd_glossary_handler, make_event)
    sid = subclass["subclassId"]
    dnd_glossary_handler.handler(
        make_event(
            "POST",
            f"/api/subclasses/{sid}/updateFeatures",
            body=[{"name": "Shadow Arts", "description": "Cast minor illusion", "level": 3}],
            path_params={"subclassId": sid},
            authenticated=True,
        ),
        None,
    )

    resp = dnd_glossary_handler.handler(
        make_event("GET", f"/api/subclasses/{sid}/features", path_params={"subclassId": sid}), None
    )
    assert resp["statusCode"] == 200
    features = json.loads(resp["body"])
    assert features[0]["name"] == "Shadow Arts"
    assert features[0]["level"] == 3


def test_update_features_requires_auth(dnd_glossary_handler, make_event):
    event = make_event(
        "POST", "/api/subclasses/s1/updateFeatures", body=[], path_params={"subclassId": "s1"}
    )
    resp = dnd_glossary_handler.handler(event, None)
    assert resp["statusCode"] == 401


# --- POST /api/subclasses/createSubclass and POST /api/createSubclass (duplicate registrations) ----


def test_create_subclass_requires_auth(dnd_glossary_handler, make_event):
    event = make_event(
        "POST", "/api/subclasses/createSubclass", body={"name": "Way of Shadow", "classIndex": "monk"}
    )
    resp = dnd_glossary_handler.handler(event, None)
    assert resp["statusCode"] == 401


def test_create_subclass_requires_class_index(dnd_glossary_handler, make_event):
    event = make_event(
        "POST", "/api/subclasses/createSubclass", body={"name": "Way of Shadow"}, authenticated=True
    )
    resp = dnd_glossary_handler.handler(event, None)
    assert resp["statusCode"] == 400


def test_create_subclass_success_persists_item_via_both_routes(dnd_glossary_handler, subclasses_table, make_event):
    """`POST /api/subclasses/createSubclass` and `POST /api/createSubclass` both route to
    `_create_subclass` -- exercise both registrations."""
    nested = _create_subclass(dnd_glossary_handler, make_event, name="Way of Shadow", class_index="monk")
    stored = subclasses_table.get_item(Key={"subclassId": nested["subclassId"]})["Item"]
    assert stored["classIndex"] == "monk"
    assert stored["isCustom"] is True

    flat_event = make_event(
        "POST", "/api/createSubclass", body={"name": "Oath of Glory", "classIndex": "paladin"}, authenticated=True
    )
    flat_resp = dnd_glossary_handler.handler(flat_event, None)
    assert flat_resp["statusCode"] == 200
    assert json.loads(flat_resp["body"])["classIndex"] == "paladin"


# --- PUT /api/subclasses/updateSubclass/{subclassId} and POST /api/updateSubclass (body-based) -----


def test_update_subclass_requires_auth(dnd_glossary_handler, make_event):
    event = make_event(
        "PUT", "/api/subclasses/updateSubclass/s1", body={"name": "New", "classIndex": "monk"}, path_params={"subclassId": "s1"}
    )
    resp = dnd_glossary_handler.handler(event, None)
    assert resp["statusCode"] == 401


def test_update_subclass_via_put_path_route(dnd_glossary_handler, make_event):
    subclass = _create_subclass(dnd_glossary_handler, make_event)
    sid = subclass["subclassId"]
    event = make_event(
        "PUT",
        f"/api/subclasses/updateSubclass/{sid}",
        body={"name": "Way of the Long Death", "classIndex": "monk"},
        path_params={"subclassId": sid},
        authenticated=True,
    )
    resp = dnd_glossary_handler.handler(event, None)
    assert resp["statusCode"] == 200
    assert json.loads(resp["body"])["name"] == "Way of the Long Death"


def test_update_subclass_via_post_flat_route(dnd_glossary_handler, make_event):
    subclass = _create_subclass(dnd_glossary_handler, make_event)
    sid = subclass["subclassId"]
    event = make_event(
        "POST",
        "/api/updateSubclass",
        body={"subclassId": sid, "name": "Way of the Drunken Master", "classIndex": "monk"},
        authenticated=True,
    )
    resp = dnd_glossary_handler.handler(event, None)
    assert resp["statusCode"] == 200
    assert json.loads(resp["body"])["name"] == "Way of the Drunken Master"


# --- DELETE /api/subclasses/deleteSubclass/{subclassId} --------------------------------------------


def test_delete_subclass_requires_auth(dnd_glossary_handler, make_event):
    event = make_event(
        "DELETE", "/api/subclasses/deleteSubclass/s1", path_params={"subclassId": "s1"}
    )
    resp = dnd_glossary_handler.handler(event, None)
    assert resp["statusCode"] == 401


def test_delete_subclass_missing_is_404(dnd_glossary_handler, make_event):
    event = make_event(
        "DELETE",
        "/api/subclasses/deleteSubclass/does-not-exist",
        path_params={"subclassId": "does-not-exist"},
        authenticated=True,
    )
    resp = dnd_glossary_handler.handler(event, None)
    assert resp["statusCode"] == 404


def test_delete_subclass_success(dnd_glossary_handler, subclasses_table, make_event):
    subclass = _create_subclass(dnd_glossary_handler, make_event)
    sid = subclass["subclassId"]
    event = make_event(
        "DELETE", f"/api/subclasses/deleteSubclass/{sid}", path_params={"subclassId": sid}, authenticated=True
    )
    resp = dnd_glossary_handler.handler(event, None)
    assert resp["statusCode"] == 200
    assert "Item" not in subclasses_table.get_item(Key={"subclassId": sid})


# --- Routing edge cases ----------------------------------------------------------------------------


def test_unknown_route_is_404(dnd_glossary_handler, make_event):
    resp = dnd_glossary_handler.handler(make_event("GET", "/api/nope"), None)
    assert resp["statusCode"] == 404


def test_options_returns_200_empty_body(dnd_glossary_handler, make_event):
    resp = dnd_glossary_handler.handler(make_event("OPTIONS", "/api/races"), None)
    assert resp["statusCode"] == 200
    assert resp["body"] == ""

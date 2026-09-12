"""Unit tests for infrastructure/lambdas/recipes/handler.py, mocking DynamoDB with moto.

Second vertical built on the shared fixtures/helpers in `../../conftest.py` and
`../../lambda_test_utils.py` -- see `bounties/tests/test_handler.py` for the reference
implementation this pattern is copied from. Tests call `handler()` directly with hand-built API
Gateway HTTP API v2 events; the Clerk authorizer itself is not exercised (see
openspec/changes/add-bounties-pytest-scaffolding/design.md Non-Goals) -- `authenticated`/writer
checks are tested through the authorizer-context contract `require_clerk_writer` reads.
"""

from __future__ import annotations

import json


# --- GET /api/recipes (list view, GSI-backed) -----------------------------------------------------


def test_get_recipes_empty(recipes_handler, make_event):
    resp = recipes_handler.handler(make_event("GET", "/api/recipes"), None)
    assert resp["statusCode"] == 200
    assert json.loads(resp["body"]) == []


def test_get_recipes_list_view_omits_fields_the_gsi_does_not_project(recipes_handler, make_event):
    """`RecipesByNameIndex` (see conftest.py's `RECIPES_BY_NAME_INDEX_SPEC`) has an `INCLUDE`
    projection that does not include `description`, `ingredients`, or `steps` -- so the list view
    must show them empty even though the full recipe (read from the base table) has them."""
    create = recipes_handler.handler(
        make_event(
            "POST",
            "/api/createRecipe",
            body={
                "name": "Chili",
                "description": "Spicy",
                "quantity": "4 servings",
                "prepTimeMinutes": 10,
                "cookTimeMinutes": 30,
                "totalCalories": 500,
            },
            authenticated=True,
        ),
        None,
    )
    recipe_id = json.loads(create["body"])["recipeId"]
    recipes_handler.handler(
        make_event(
            "POST",
            f"/api/addIngredientToRecipe/{recipe_id}",
            body={"name": "Beans", "quantity": "1 can"},
            authenticated=True,
        ),
        None,
    )
    recipes_handler.handler(
        make_event(
            "POST",
            f"/api/updateStepsForRecipe/{recipe_id}",
            body=[{"description": "Simmer"}],
            authenticated=True,
        ),
        None,
    )

    list_resp = recipes_handler.handler(make_event("GET", "/api/recipes"), None)
    listed = json.loads(list_resp["body"])[0]
    assert listed["recipeId"] == recipe_id
    assert listed["name"] == "Chili"
    assert listed["quantity"] == "4 servings"
    assert listed["prepTimeMinutes"] == 10
    assert listed["totalCalories"] == 500
    assert listed["description"] == ""
    assert listed["ingredients"] == []
    assert listed["steps"] == []

    full_resp = recipes_handler.handler(make_event("GET", f"/api/recipe/{recipe_id}"), None)
    full = json.loads(full_resp["body"])
    assert full["description"] == "Spicy"
    assert [i["name"] for i in full["ingredients"]] == ["Beans"]
    assert [s["description"] for s in full["steps"]] == ["Simmer"]


# --- GET /api/recipe/{recipeId} -------------------------------------------------------------------


def test_get_recipe_not_found(recipes_handler, make_event):
    resp = recipes_handler.handler(make_event("GET", "/api/recipe/does-not-exist"), None)
    assert resp["statusCode"] == 404


# --- POST /api/createRecipe -----------------------------------------------------------------------


def test_create_recipe_requires_auth(recipes_handler, make_event):
    event = make_event("POST", "/api/createRecipe", body={"name": "Chili"})
    resp = recipes_handler.handler(event, None)
    assert resp["statusCode"] == 401


def test_create_recipe_requires_name(recipes_handler, make_event):
    event = make_event("POST", "/api/createRecipe", body={"description": "No name"}, authenticated=True)
    resp = recipes_handler.handler(event, None)
    assert resp["statusCode"] == 400


def test_create_recipe_success_persists_item(recipes_handler, recipes_table, make_event):
    body = {"name": "Chili", "description": "Spicy", "avatarId": "file-1"}
    event = make_event("POST", "/api/createRecipe", body=body, authenticated=True)
    resp = recipes_handler.handler(event, None)

    assert resp["statusCode"] == 200
    created = json.loads(resp["body"])
    assert created["name"] == "Chili"
    assert created["avatarId"] == "file-1"
    assert created["ingredients"] == []

    stored = recipes_table.get_item(Key={"recipeId": created["recipeId"]})["Item"]
    assert stored["entityType"] == "RECIPE"
    assert stored["nameSortKey"] == f"chili#{created['recipeId']}"
    assert stored["version"] == 0


# --- POST /api/updateRecipe -----------------------------------------------------------------------


def test_update_recipe_requires_auth(recipes_handler, make_event):
    event = make_event("POST", "/api/updateRecipe", body={"recipeId": "r1", "name": "New"})
    resp = recipes_handler.handler(event, None)
    assert resp["statusCode"] == 401


def test_update_recipe_requires_recipe_id(recipes_handler, make_event):
    event = make_event("POST", "/api/updateRecipe", body={"name": "New"}, authenticated=True)
    resp = recipes_handler.handler(event, None)
    assert resp["statusCode"] == 400


def test_update_recipe_missing_recipe_is_404(recipes_handler, make_event):
    body = {"recipeId": "does-not-exist", "name": "New"}
    event = make_event("POST", "/api/updateRecipe", body=body, authenticated=True)
    resp = recipes_handler.handler(event, None)
    assert resp["statusCode"] == 404


def test_update_recipe_success(recipes_handler, make_event):
    create = recipes_handler.handler(
        make_event("POST", "/api/createRecipe", body={"name": "Chili"}, authenticated=True), None
    )
    recipe_id = json.loads(create["body"])["recipeId"]

    update = recipes_handler.handler(
        make_event(
            "POST",
            "/api/updateRecipe",
            body={"recipeId": recipe_id, "name": "Beef Chili", "totalCalories": 600},
            authenticated=True,
        ),
        None,
    )
    assert update["statusCode"] == 200
    updated = json.loads(update["body"])
    assert updated["name"] == "Beef Chili"
    assert updated["totalCalories"] == 600


# --- POST /api/addIngredientToRecipe/{recipeId} ----------------------------------------------------


def test_add_ingredient_requires_auth(recipes_handler, make_event):
    event = make_event("POST", "/api/addIngredientToRecipe/r1", body={"name": "Beans"})
    resp = recipes_handler.handler(event, None)
    assert resp["statusCode"] == 401


def test_add_ingredient_missing_recipe_is_404(recipes_handler, make_event):
    event = make_event(
        "POST", "/api/addIngredientToRecipe/does-not-exist", body={"name": "Beans"}, authenticated=True
    )
    resp = recipes_handler.handler(event, None)
    assert resp["statusCode"] == 404


def test_add_ingredient_success(recipes_handler, recipes_table, make_event):
    create = recipes_handler.handler(
        make_event("POST", "/api/createRecipe", body={"name": "Chili"}, authenticated=True), None
    )
    recipe_id = json.loads(create["body"])["recipeId"]

    resp = recipes_handler.handler(
        make_event(
            "POST",
            f"/api/addIngredientToRecipe/{recipe_id}",
            body={"name": "Beans", "quantity": "1 can"},
            authenticated=True,
        ),
        None,
    )
    assert resp["statusCode"] == 200
    assert json.loads(resp["body"])["name"] == "Beans"

    stored = recipes_table.get_item(Key={"recipeId": recipe_id})["Item"]
    assert [i["name"] for i in stored["ingredients"]] == ["Beans"]
    assert stored["version"] == 1


# --- POST /api/updateIngredient -------------------------------------------------------------------


def test_update_ingredient_requires_auth(recipes_handler, make_event):
    event = make_event("POST", "/api/updateIngredient", body={"ingredientId": "i1"})
    resp = recipes_handler.handler(event, None)
    assert resp["statusCode"] == 401


def test_update_ingredient_requires_ingredient_id(recipes_handler, make_event):
    event = make_event("POST", "/api/updateIngredient", body={"recipeId": "r1"}, authenticated=True)
    resp = recipes_handler.handler(event, None)
    assert resp["statusCode"] == 400


def test_update_ingredient_not_found_is_404(recipes_handler, make_event):
    event = make_event(
        "POST", "/api/updateIngredient", body={"ingredientId": "does-not-exist"}, authenticated=True
    )
    resp = recipes_handler.handler(event, None)
    assert resp["statusCode"] == 404


def test_update_ingredient_success_falls_back_to_scan_when_recipe_id_omitted(recipes_handler, make_event):
    """`_update_ingredient` scans the whole table for the owning recipe when `recipeId` isn't
    given (`_find_recipe_id_for_ingredient`) -- exercise that path explicitly, with a second,
    unrelated recipe present to prove the scan doesn't just get lucky with a single-item table."""
    recipes_handler.handler(
        make_event("POST", "/api/createRecipe", body={"name": "Unrelated"}, authenticated=True), None
    )
    create = recipes_handler.handler(
        make_event("POST", "/api/createRecipe", body={"name": "Chili"}, authenticated=True), None
    )
    recipe_id = json.loads(create["body"])["recipeId"]
    add = recipes_handler.handler(
        make_event(
            "POST",
            f"/api/addIngredientToRecipe/{recipe_id}",
            body={"name": "Beans", "quantity": "1 can"},
            authenticated=True,
        ),
        None,
    )
    ingredient_id = json.loads(add["body"])["ingredientId"]

    resp = recipes_handler.handler(
        make_event(
            "POST",
            "/api/updateIngredient",
            body={"ingredientId": ingredient_id, "quantity": "2 cans"},
            authenticated=True,
        ),
        None,
    )
    assert resp["statusCode"] == 200
    assert json.loads(resp["body"])["quantity"] == "2 cans"


# --- POST /api/updateStepsForRecipe/{recipeId} ------------------------------------------------------


def test_update_steps_requires_auth(recipes_handler, make_event):
    event = make_event("POST", "/api/updateStepsForRecipe/r1", body=[{"description": "Simmer"}])
    resp = recipes_handler.handler(event, None)
    assert resp["statusCode"] == 401


def test_update_steps_requires_list_body(recipes_handler, make_event):
    create = recipes_handler.handler(
        make_event("POST", "/api/createRecipe", body={"name": "Chili"}, authenticated=True), None
    )
    recipe_id = json.loads(create["body"])["recipeId"]

    event = make_event(
        "POST", f"/api/updateStepsForRecipe/{recipe_id}", body={"description": "Not a list"}, authenticated=True
    )
    resp = recipes_handler.handler(event, None)
    assert resp["statusCode"] == 400


def test_update_steps_success(recipes_handler, recipes_table, make_event):
    create = recipes_handler.handler(
        make_event("POST", "/api/createRecipe", body={"name": "Chili"}, authenticated=True), None
    )
    recipe_id = json.loads(create["body"])["recipeId"]

    resp = recipes_handler.handler(
        make_event(
            "POST",
            f"/api/updateStepsForRecipe/{recipe_id}",
            body=[{"description": "Brown the beef"}, {"description": "Simmer"}],
            authenticated=True,
        ),
        None,
    )
    assert resp["statusCode"] == 200
    steps = json.loads(resp["body"])
    assert [s["description"] for s in steps] == ["Brown the beef", "Simmer"]
    assert [s["stepNumber"] for s in steps] == [1, 2]

    stored = recipes_table.get_item(Key={"recipeId": recipe_id})["Item"]
    assert len(stored["steps"]) == 2


# --- POST /api/updateRecipeAvatar (query-param route) -----------------------------------------------


def test_update_recipe_avatar_requires_auth(recipes_handler, make_event):
    event = make_event("POST", "/api/updateRecipeAvatar", query={"recipeId": "r1", "fileId": "f1"})
    resp = recipes_handler.handler(event, None)
    assert resp["statusCode"] == 401


def test_update_recipe_avatar_requires_file_id(recipes_handler, make_event):
    event = make_event(
        "POST", "/api/updateRecipeAvatar", query={"recipeId": "r1"}, authenticated=True
    )
    resp = recipes_handler.handler(event, None)
    assert resp["statusCode"] == 400


def test_update_recipe_avatar_missing_file_is_404(recipes_handler, make_event):
    create = recipes_handler.handler(
        make_event("POST", "/api/createRecipe", body={"name": "Chili"}, authenticated=True), None
    )
    recipe_id = json.loads(create["body"])["recipeId"]

    event = make_event(
        "POST",
        "/api/updateRecipeAvatar",
        query={"recipeId": recipe_id, "fileId": "does-not-exist"},
        authenticated=True,
    )
    resp = recipes_handler.handler(event, None)
    assert resp["statusCode"] == 404


def test_update_recipe_avatar_success(recipes_handler, recipes_table, files_table, make_event):
    create = recipes_handler.handler(
        make_event("POST", "/api/createRecipe", body={"name": "Chili"}, authenticated=True), None
    )
    recipe_id = json.loads(create["body"])["recipeId"]
    files_table.put_item(Item={"fileId": "f1", "uuId": "uuid-1", "filename": "chili.jpg"})

    event = make_event(
        "POST", "/api/updateRecipeAvatar", query={"recipeId": recipe_id, "fileId": "f1"}, authenticated=True
    )
    resp = recipes_handler.handler(event, None)

    assert resp["statusCode"] == 200
    body = json.loads(resp["body"])
    assert body["fileId"] == "f1"
    assert body["filename"] == "chili.jpg"

    stored = recipes_table.get_item(Key={"recipeId": recipe_id})["Item"]
    assert stored["avatarFileId"] == "f1"


# --- Routing edge cases ------------------------------------------------------------------------------


def test_unknown_route_is_404(recipes_handler, make_event):
    event = make_event("GET", "/api/nope")
    resp = recipes_handler.handler(event, None)
    assert resp["statusCode"] == 404


def test_options_returns_200_empty_body(recipes_handler, make_event):
    event = make_event("OPTIONS", "/api/recipes")
    resp = recipes_handler.handler(event, None)
    assert resp["statusCode"] == 200
    assert resp["body"] == ""

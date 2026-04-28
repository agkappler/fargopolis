"""
Recipes HTTP API backed by the FargopolisRecipes DynamoDB table.

Routes mirror legacy Java endpoints:
- GET /api/recipes
- GET /api/recipe/{recipeId}
- POST /api/createRecipe
- POST /api/updateRecipe
- POST /api/addIngredientToRecipe/{recipeId}
- POST /api/updateIngredient
- POST /api/updateStepsForRecipe/{recipeId}
- POST /api/updateRecipeAvatar
"""

from __future__ import annotations

import json
from typing import Any

from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError
from shared.lambda_utils import (
    generate_ulid,
    json_response,
    parse_body,
    require_clerk_writer,
    scan_all_items,
    table_from_env,
)

RECIPES_TABLE_ENV = "RECIPES_TABLE_NAME"
FILES_TABLE_ENV = "FILES_TABLE_NAME"
RECIPES_BY_NAME_INDEX = "RecipesByNameIndex"
ENTITY_RECIPE = "RECIPE"


def _make_name_sort_key(name: str, recipe_id: str) -> str:
    return f"{name.strip().lower()}#{recipe_id}"


def _to_api_recipe(item: dict[str, Any]) -> dict[str, Any]:
    return {
        "recipeId": str(item["recipeId"]),
        "name": item.get("name", ""),
        "description": item.get("description", ""),
        "quantity": item.get("quantity", ""),
        "prepTimeMinutes": item.get("prepTimeMinutes", 0),
        "cookTimeMinutes": item.get("cookTimeMinutes", 0),
        "totalCalories": item.get("totalCalories"),
        "avatarId": item.get("avatarFileId"),
        "ingredients": [_to_api_ingredient(i) for i in (item.get("ingredients") or [])],
        "steps": [_to_api_step(s) for s in sorted((item.get("steps") or []), key=lambda x: int(x.get("stepNumber") or 0))],
    }


def _to_api_ingredient(item: dict[str, Any]) -> dict[str, Any]:
    return {
        "ingredientId": str(item.get("ingredientId", "")),
        "name": item.get("name", ""),
        "quantity": item.get("quantity", ""),
        "calories": item.get("calories"),
    }


def _to_api_step(item: dict[str, Any]) -> dict[str, Any]:
    return {
        "stepId": str(item.get("stepId", "")),
        "stepNumber": item.get("stepNumber", 0),
        "description": item.get("description", ""),
    }


def _get_recipe_or_404(recipe_id: str) -> tuple[dict[str, Any] | None, dict[str, Any] | None]:
    table = table_from_env(RECIPES_TABLE_ENV)
    response = table.get_item(Key={"recipeId": recipe_id})
    item = response.get("Item")
    if not item:
        return None, json_response(404, {"message": f"Recipe not found: {recipe_id}"})
    return item, None


def _get_recipes() -> dict[str, Any]:
    table = table_from_env(RECIPES_TABLE_ENV)
    response = table.query(
        IndexName=RECIPES_BY_NAME_INDEX,
        KeyConditionExpression=Key("entityType").eq(ENTITY_RECIPE),
    )
    items = response.get("Items", [])
    return json_response(200, [_to_api_recipe(i) for i in items])


def _get_recipe(recipe_id: str) -> dict[str, Any]:
    item, err = _get_recipe_or_404(recipe_id)
    if err:
        return err
    return json_response(200, _to_api_recipe(item or {}))


def _create_recipe(body: dict[str, Any]) -> dict[str, Any]:
    name = (body.get("name") or "").strip()
    if not name:
        raise ValueError("name is required")
    recipe_id = generate_ulid()
    item = {
        "recipeId": recipe_id,
        "name": name,
        "description": body.get("description") or "",
        "quantity": body.get("quantity") or "",
        "prepTimeMinutes": body.get("prepTimeMinutes") or 0,
        "cookTimeMinutes": body.get("cookTimeMinutes") or 0,
        "totalCalories": body.get("totalCalories"),
        "avatarFileId": body.get("avatarId"),
        "ingredients": [],
        "steps": [],
        "entityType": ENTITY_RECIPE,
        "nameSortKey": _make_name_sort_key(name, recipe_id),
        "version": 0,
    }
    table = table_from_env(RECIPES_TABLE_ENV)
    table.put_item(Item=item, ConditionExpression="attribute_not_exists(recipeId)")
    return json_response(200, _to_api_recipe(item))


def _update_recipe(body: dict[str, Any]) -> dict[str, Any]:
    recipe_id = str(body.get("recipeId") or "").strip()
    if not recipe_id:
        raise ValueError("recipeId is required")

    expr_names = {
        "#name": "name",
        "#description": "description",
        "#quantity": "quantity",
        "#prep": "prepTimeMinutes",
        "#cook": "cookTimeMinutes",
        "#total": "totalCalories",
    }
    expr_values = {
        ":name": (body.get("name") or "").strip(),
        ":description": body.get("description") or "",
        ":quantity": body.get("quantity") or "",
        ":prep": body.get("prepTimeMinutes") or 0,
        ":cook": body.get("cookTimeMinutes") or 0,
        ":total": body.get("totalCalories"),
    }
    update_expr = "SET #name = :name, #description = :description, #quantity = :quantity, #prep = :prep, #cook = :cook, #total = :total"
    if body.get("name") is not None:
        expr_names["#nsk"] = "nameSortKey"
        expr_values[":nsk"] = _make_name_sort_key((body.get("name") or "").strip(), recipe_id)
        update_expr += ", #nsk = :nsk"

    table = table_from_env(RECIPES_TABLE_ENV)
    table.update_item(
        Key={"recipeId": recipe_id},
        UpdateExpression=update_expr,
        ExpressionAttributeNames=expr_names,
        ExpressionAttributeValues=expr_values,
        ConditionExpression="attribute_exists(recipeId)",
    )
    return _get_recipe(recipe_id)


def _add_ingredient(recipe_id: str, body: dict[str, Any]) -> dict[str, Any]:
    ingredient = {
        "ingredientId": str(body.get("ingredientId") or generate_ulid()),
        "name": body.get("name") or "",
        "quantity": body.get("quantity") or "",
        "calories": body.get("calories"),
    }
    table = table_from_env(RECIPES_TABLE_ENV)
    table.update_item(
        Key={"recipeId": recipe_id},
        UpdateExpression="SET ingredients = list_append(if_not_exists(ingredients, :empty), :new) ADD version :one",
        ExpressionAttributeValues={":empty": [], ":new": [ingredient], ":one": 1},
        ConditionExpression="attribute_exists(recipeId)",
    )
    return json_response(200, _to_api_ingredient(ingredient))


def _find_recipe_id_for_ingredient(ingredient_id: str) -> str | None:
    table = table_from_env(RECIPES_TABLE_ENV)
    for item in scan_all_items(table):
        for ing in item.get("ingredients") or []:
            if str(ing.get("ingredientId", "")) == ingredient_id:
                return str(item.get("recipeId", ""))
    return None


def _update_ingredient(body: dict[str, Any]) -> dict[str, Any]:
    ingredient_id = str(body.get("ingredientId") or "").strip()
    if not ingredient_id:
        raise ValueError("ingredientId is required")
    recipe_id = str(body.get("recipeId") or "").strip()
    if not recipe_id:
        recipe_id = _find_recipe_id_for_ingredient(ingredient_id) or ""
    if not recipe_id:
        return json_response(404, {"message": f"Ingredient not found: {ingredient_id}"})

    item, err = _get_recipe_or_404(recipe_id)
    if err:
        return err
    if not item:
        return json_response(404, {"message": f"Recipe not found: {recipe_id}"})
    ingredients = list(item.get("ingredients") or [])
    updated = None
    for idx, ing in enumerate(ingredients):
        if str(ing.get("ingredientId", "")) == ingredient_id:
            merged = dict(ing)
            merged["name"] = body.get("name") or merged.get("name") or ""
            merged["quantity"] = body.get("quantity") or merged.get("quantity") or ""
            merged["calories"] = body.get("calories", merged.get("calories"))
            ingredients[idx] = merged
            updated = merged
            break
    if not updated:
        return json_response(404, {"message": f"Ingredient not found: {ingredient_id}"})

    table = table_from_env(RECIPES_TABLE_ENV)
    table.update_item(
        Key={"recipeId": recipe_id},
        UpdateExpression="SET ingredients = :ingredients ADD version :one",
        ExpressionAttributeValues={":ingredients": ingredients, ":one": 1},
        ConditionExpression="attribute_exists(recipeId)",
    )
    return json_response(200, _to_api_ingredient(updated))


def _update_steps(recipe_id: str, body: Any) -> dict[str, Any]:
    if not isinstance(body, list):
        raise ValueError("Body must be a list of steps")
    steps = []
    for index, step in enumerate(body):
        if not isinstance(step, dict):
            continue
        steps.append(
            {
                "stepId": str(step.get("stepId") or generate_ulid()),
                "stepNumber": index + 1,
                "description": step.get("description") or "",
            }
        )
    table = table_from_env(RECIPES_TABLE_ENV)
    table.update_item(
        Key={"recipeId": recipe_id},
        UpdateExpression="SET steps = :steps ADD version :one",
        ExpressionAttributeValues={":steps": steps, ":one": 1},
        ConditionExpression="attribute_exists(recipeId)",
    )
    return json_response(200, [_to_api_step(s) for s in steps])


def _update_recipe_avatar(event: dict[str, Any]) -> dict[str, Any]:
    query = event.get("queryStringParameters") or {}
    recipe_id = str(query.get("recipeId") or "").strip()
    file_id = str(query.get("fileId") or "").strip()
    if not recipe_id:
        raise ValueError("recipeId is required")
    if not file_id:
        raise ValueError("fileId is required")

    files_table = table_from_env(FILES_TABLE_ENV)
    file_response = files_table.get_item(Key={"fileId": file_id})
    file_item = file_response.get("Item")
    if not file_item:
        return json_response(404, {"message": f"File not found: {file_id}"})

    recipes_table = table_from_env(RECIPES_TABLE_ENV)
    recipes_table.update_item(
        Key={"recipeId": recipe_id},
        UpdateExpression="SET avatarFileId = :fid ADD version :one",
        ExpressionAttributeValues={":fid": file_id, ":one": 1},
        ConditionExpression="attribute_exists(recipeId)",
    )
    return json_response(
        200,
        {
            "url": "",
            "fileId": file_id,
            "uuId": file_item.get("uuId"),
            "filename": file_item.get("filename"),
        },
    )


def handler(event: dict[str, Any], context: Any) -> dict[str, Any]:
    try:
        req = event.get("requestContext") or {}
        http = req.get("http") or {}
        method = http.get("method", "GET").upper()
        raw_path = event.get("rawPath") or ""
        route_key = f"{method} {raw_path}"

        if method == "OPTIONS":
            return {"statusCode": 200, "body": ""}

        if route_key == "GET /api/recipes":
            return _get_recipes()
        if method == "GET" and raw_path.startswith("/api/recipe/"):
            return _get_recipe(raw_path[len("/api/recipe/") :].strip())

        if route_key == "POST /api/createRecipe":
            err = require_clerk_writer(event)
            if err:
                return err
            return _create_recipe(parse_body(event))
        if route_key == "POST /api/updateRecipe":
            err = require_clerk_writer(event)
            if err:
                return err
            return _update_recipe(parse_body(event))
        if method == "POST" and raw_path.startswith("/api/addIngredientToRecipe/"):
            err = require_clerk_writer(event)
            if err:
                return err
            recipe_id = raw_path[len("/api/addIngredientToRecipe/") :].strip()
            return _add_ingredient(recipe_id, parse_body(event))
        if route_key == "POST /api/updateIngredient":
            err = require_clerk_writer(event)
            if err:
                return err
            return _update_ingredient(parse_body(event))
        if method == "POST" and raw_path.startswith("/api/updateStepsForRecipe/"):
            err = require_clerk_writer(event)
            if err:
                return err
            recipe_id = raw_path[len("/api/updateStepsForRecipe/") :].strip()
            return _update_steps(recipe_id, parse_body(event))
        if route_key == "POST /api/updateRecipeAvatar":
            err = require_clerk_writer(event)
            if err:
                return err
            return _update_recipe_avatar(event)

        return json_response(404, {"message": "Not found", "routeKey": route_key})
    except json.JSONDecodeError:
        return json_response(400, {"message": "Invalid JSON body"})
    except ValueError as e:
        return json_response(400, {"message": str(e)})
    except ClientError as e:
        code = e.response.get("Error", {}).get("Code", "")
        if code == "ConditionalCheckFailedException":
            return json_response(404, {"message": "Recipe not found"})
        return json_response(500, {"message": code or str(e)})
    except Exception as e:
        return json_response(500, {"message": str(e)})

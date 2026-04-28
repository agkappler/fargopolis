"""
Files HTTP API for uploads + file metadata reads.

Routes:
- GET /api/fileUrl/{fileId}
- GET /api/getLatestResumeUrl  (public; latest RESUME role, same shape as legacy Java ImageUrl)
- POST /api/files/presignPut
"""

from __future__ import annotations

import json
import os
from typing import Any

import boto3
from boto3.dynamodb.conditions import Attr
from botocore.exceptions import ClientError
from shared.lambda_utils import generate_ulid, json_response, parse_body, require_clerk_writer, scan_all_items, table_from_env

VALID_FILE_ROLES = frozenset({"RECIPE_IMAGE", "CHARACTER_AVATAR", "CHARACTER_RESOURCE", "RESUME"})
FILES_TABLE_ENV = "FILES_TABLE_NAME"
UPLOADS_BUCKET_ENV = "FARGOPOLIS_UPLOADS_BUCKET_NAME"
FILE_URL_ROUTE_PREFIX = "/api/fileUrl/"

_s3_client: Any = None


def _s3() -> Any:
    global _s3_client
    if _s3_client is None:
        _s3_client = boto3.client("s3")
    return _s3_client


def _uploads_bucket_name() -> str:
    bucket_name = os.environ.get(UPLOADS_BUCKET_ENV)
    if not bucket_name:
        raise RuntimeError(f"Missing env {UPLOADS_BUCKET_ENV}")
    return bucket_name


def presign_get_object_url(key: str, *, expires_in: int = 15 * 60) -> str:
    return _s3().generate_presigned_url(
        "get_object",
        Params={"Bucket": _uploads_bucket_name(), "Key": key},
        ExpiresIn=expires_in,
    )


def presign_put_object_url(key: str, *, content_type: str, expires_in: int = 15 * 60) -> str:
    return _s3().generate_presigned_url(
        "put_object",
        Params={"Bucket": _uploads_bucket_name(), "Key": key, "ContentType": content_type},
        ExpiresIn=expires_in,
    )


def _normalize_file_role(raw: Any) -> str:
    if not isinstance(raw, str):
        raise ValueError("fileRole must be one of: RECIPE_IMAGE, CHARACTER_AVATAR, CHARACTER_RESOURCE, RESUME")
    role = raw.strip().upper()
    if role not in VALID_FILE_ROLES:
        raise ValueError("fileRole must be one of: RECIPE_IMAGE, CHARACTER_AVATAR, CHARACTER_RESOURCE, RESUME")
    return role


def _require_str(body: dict[str, Any], key: str) -> str:
    value = body.get(key)
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"{key} is required")
    return value.strip()


def _metadata_with_url(item: dict[str, Any]) -> dict[str, Any]:
    metadata = {
        "fileId": str(item["fileId"]),
        "uuId": item.get("uuId"),
        "filename": item.get("filename"),
        "contentType": item.get("contentType"),
        "sizeBytes": item.get("sizeBytes"),
        "fileRole": item.get("fileRole"),
    }
    key = f'{item.get("uuId", "")}_{item.get("filename", "")}'
    metadata["url"] = presign_get_object_url(key)
    return metadata


def _latest_resume_item(items: list[dict[str, Any]]) -> dict[str, Any] | None:
    """Prefer highest numeric fileId (Postgres-era); else lexicographic max (ULID time-order)."""
    if not items:
        return None

    def sort_key(item: dict[str, Any]) -> tuple:
        fid = str(item.get("fileId") or "").strip()
        if fid.isdigit():
            return (0, int(fid))
        return (1, fid)

    return max(items, key=sort_key)


def _get_latest_resume_url() -> dict[str, Any]:
    table = table_from_env(FILES_TABLE_ENV)
    # Dynamo uses string "RESUME"; legacy Postgres may have stored role as N(4) or string "4".
    resume_filter = (
        Attr("fileRole").eq("RESUME") | Attr("fileRole").eq(4) | Attr("fileRole").eq("4")
    )
    items = scan_all_items(table, FilterExpression=resume_filter)
    latest = _latest_resume_item(items)
    if not latest:
        return json_response(200, {"url": ""})
    url = presign_get_object_url(f'{latest.get("uuId", "")}_{latest.get("filename", "")}')
    return json_response(200, {"url": url})


def _get_file_url_by_id(raw_path: str) -> dict[str, Any]:
    file_id = raw_path[len(FILE_URL_ROUTE_PREFIX) :].strip()
    if not file_id:
        raise ValueError("fileId is required")
    table = table_from_env(FILES_TABLE_ENV)
    resp = table.get_item(Key={"fileId": file_id})
    item = resp.get("Item")
    if not item:
        return json_response(404, {"message": f"File metadata not found for id: {file_id}"})
    return json_response(200, _metadata_with_url(item))


def _create_presign_put(body: dict[str, Any]) -> dict[str, Any]:
    filename = _require_str(body, "filename")
    content_type = _require_str(body, "contentType")
    size_bytes = body.get("sizeBytes")
    if size_bytes is None:
        raise ValueError("sizeBytes is required")

    file_role = _normalize_file_role(body.get("fileRole"))
    uu_id = (body.get("uuId") or "").strip() or generate_ulid().lower()
    file_id = generate_ulid()
    key = f"{uu_id}_{filename}"
    put_url = presign_put_object_url(key, content_type=content_type)

    table = table_from_env(FILES_TABLE_ENV)
    item = {
        "fileId": file_id,
        "uuId": uu_id,
        "filename": filename,
        "contentType": content_type,
        "sizeBytes": size_bytes,
        "fileRole": file_role,
    }
    table.put_item(Item=item, ConditionExpression="attribute_not_exists(fileId)")

    out = _metadata_with_url(item)
    out["uploadUrl"] = put_url
    out["uploadMethod"] = "PUT"
    out["uploadHeaders"] = {"Content-Type": content_type}
    out["objectKey"] = key
    return json_response(200, out)


def handler(event: dict[str, Any], context: Any) -> dict[str, Any]:
    try:
        req = event.get("requestContext") or {}
        http = req.get("http") or {}
        method = http.get("method", "GET").upper()
        raw_path = event.get("rawPath") or ""

        if method == "OPTIONS":
            return {"statusCode": 200, "body": ""}

        if method == "GET" and raw_path == "/api/getLatestResumeUrl":
            return _get_latest_resume_url()

        if method == "GET" and raw_path.startswith(FILE_URL_ROUTE_PREFIX):
            return _get_file_url_by_id(raw_path)

        if method == "POST" and raw_path == "/api/files/presignPut":
            err = require_clerk_writer(event)
            if err:
                return err
            body = parse_body(event)
            return _create_presign_put(body)

        return json_response(404, {"message": "Not found", "routeKey": f"{method} {raw_path}"})
    except json.JSONDecodeError:
        return json_response(400, {"message": "Invalid JSON body"})
    except ValueError as e:
        return json_response(400, {"message": str(e)})
    except ClientError as e:
        code = e.response.get("Error", {}).get("Code", "")
        if code == "ConditionalCheckFailedException":
            return json_response(409, {"message": "Conflict creating file metadata"})
        return json_response(500, {"message": code or str(e)})
    except Exception as e:
        return json_response(500, {"message": str(e)})

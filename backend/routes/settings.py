from __future__ import annotations

import time
from typing import Any

from fastapi import APIRouter, Depends

import database
from routes.events import verify_api_key_dependency

router = APIRouter()


@router.get("/api/v1/settings", dependencies=[Depends(verify_api_key_dependency)])
def get_settings() -> dict[str, Any]:
    return database.get_settings()


@router.put("/api/v1/settings", dependencies=[Depends(verify_api_key_dependency)])
def put_settings(patch: dict[str, Any]) -> dict[str, Any]:
    return database.save_settings(patch)


@router.get("/api/v1/meta", dependencies=[Depends(verify_api_key_dependency)])
def get_meta() -> dict[str, Any]:
    # Imported lazily so this module can be imported before main finishes
    # defining the retention helpers.
    from main import _retention_days

    return {"retentionDays": _retention_days()}


@router.get("/api/v1/export", dependencies=[Depends(verify_api_key_dependency)])
def export_data() -> dict[str, Any]:
    return {
        "exportedAt": int(time.time() * 1000),
        "events": database.export_events(),
    }


@router.delete("/api/v1/data", dependencies=[Depends(verify_api_key_dependency)])
def delete_data() -> dict[str, int]:
    return {"deleted": database.delete_all_events()}

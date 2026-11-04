from __future__ import annotations

import secrets
import uuid
from typing import Any, Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Query, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Field

import database

router = APIRouter()


# Auth is resolved lazily from main so this module can be imported standalone
# (e.g. for tests) and to avoid a circular import at startup.
def verify_api_key_dependency(authorization: Optional[str] = Header(default=None)) -> None:
    from main import verify_api_key

    # Resolve the header here (FastAPI injects it into this dependency) and pass
    # the plain string through to main's checker.
    verify_api_key(authorization)


def _current_api_key() -> str:
    from main import FLOWSYNC_API_KEY

    return FLOWSYNC_API_KEY


class FlowSyncEvent(BaseModel):
    # VS Code events are posted without an id; a uuid is synthesized on ingest.
    id: Optional[str] = None
    type: str
    project: str = "default"
    ts: int
    source: str = "vscode"
    payload: dict[str, Any] = Field(default_factory=dict)


class EventsBatch(BaseModel):
    events: list[FlowSyncEvent]


class _Connection:
    def __init__(self, websocket: WebSocket, project: Optional[str]) -> None:
        self.websocket = websocket
        self.project = project


class ProjectConnectionManager:
    def __init__(self) -> None:
        self.connections: list[_Connection] = []

    async def connect(self, websocket: WebSocket, project: Optional[str]) -> None:
        await websocket.accept()
        self.connections.append(_Connection(websocket, project))

    def disconnect(self, websocket: WebSocket) -> None:
        self.connections = [c for c in self.connections if c.websocket is not websocket]

    async def broadcast(self, message: dict[str, Any], project: str) -> None:
        stale: list[WebSocket] = []
        for conn in self.connections:
            # Unfiltered listeners get everything; filtered listeners only get
            # messages for their project.
            if conn.project is not None and conn.project != project:
                continue
            try:
                await conn.websocket.send_json(message)
            except Exception:
                stale.append(conn.websocket)
        for websocket in stale:
            self.disconnect(websocket)


manager = ProjectConnectionManager()


@router.post("/api/v1/events", dependencies=[Depends(verify_api_key_dependency)])
async def post_events(batch: EventsBatch) -> dict[str, list[str]]:
    rows: list[dict[str, Any]] = []
    for event in batch.events:
        rows.append(
            {
                "id": event.id or str(uuid.uuid4()),
                "type": event.type,
                "project": event.project,
                "ts": event.ts,
                "source": event.source,
                "payload": event.payload,
            }
        )
    accepted = database.insert_events(rows)
    accepted_ids = set(accepted)
    # Only broadcast rows that were actually inserted. Retried batches used to
    # be broadcast again even though the database ignored them, which showed up
    # as duplicate feed rows.
    for row in rows:
        if row["id"] in accepted_ids:
            await manager.broadcast(
                {"type": "event", "event": row},
                project=row["project"],
            )
    return {"accepted": accepted}


@router.get("/api/v1/events")
def get_events(
    limit: int = Query(50, ge=1, le=500),
    type: Optional[str] = Query(None, alias="type"),
    project: Optional[str] = None,
    from_ts: Optional[int] = Query(None, alias="from"),
    to_ts: Optional[int] = Query(None, alias="to"),
) -> dict[str, list[dict[str, Any]]]:
    return {
        "events": database.list_events(
            limit=limit,
            event_type=type,
            project=project,
            from_ts=from_ts,
            to_ts=to_ts,
        )
    }


@router.websocket("/ws/events")
async def ws_events(
    websocket: WebSocket,
    token: Optional[str] = Query(None),
    project: Optional[str] = Query(None),
) -> None:
    key = _current_api_key()
    if not token or not secrets.compare_digest(token, key):
        await websocket.close(code=4401)
        return
    await manager.connect(websocket, project)
    try:
        recent = database.list_events(50, project=project)
        await websocket.send_json({"type": "init", "events": recent})
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)
from __future__ import annotations

from typing import Any, Optional

from fastapi import FastAPI, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

import database

app = FastAPI(title="FlowSync API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class EventPayload(BaseModel):
    url: Optional[str] = None
    title: Optional[str] = None
    dwellTime: Optional[float] = None
    visitCount: Optional[int] = None


class FlowSyncEvent(BaseModel):
    id: str
    type: str
    project: str = "default"
    ts: int
    source: str = "chrome"
    payload: EventPayload = Field(default_factory=EventPayload)


class EventsBatch(BaseModel):
    events: list[FlowSyncEvent]


class ConnectionManager:
    def __init__(self) -> None:
        self.connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self.connections.append(websocket)

    def disconnect(self, websocket: WebSocket) -> None:
        if websocket in self.connections:
            self.connections.remove(websocket)

    async def broadcast(self, message: dict[str, Any]) -> None:
        stale: list[WebSocket] = []
        for websocket in self.connections:
            try:
                await websocket.send_json(message)
            except Exception:
                stale.append(websocket)
        for websocket in stale:
            self.disconnect(websocket)


manager = ConnectionManager()

database.init_db()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/v1/events")
async def post_events(batch: EventsBatch) -> dict[str, list[str]]:
    rows = [event.model_dump(mode="json") for event in batch.events]
    accepted = database.insert_events(rows)
    for event in batch.events:
        await manager.broadcast({"type": "event", "event": event.model_dump()})
    return {"accepted": accepted}


@app.get("/api/v1/events")
def get_events(
    limit: int = Query(50, ge=1, le=500),
    type: Optional[str] = Query(None, alias="type"),
    project: Optional[str] = None,
) -> dict[str, list[dict[str, Any]]]:
    return {"events": database.list_events(limit=limit, event_type=type, project=project)}


@app.get("/api/v1/events/stats")
def get_stats() -> dict[str, Any]:
    return database.stats()


@app.websocket("/ws/events")
async def ws_events(
    websocket: WebSocket,
    token: Optional[str] = Query(None),
) -> None:
    del token  # Auth not implemented yet — presence of the param matches the client contract.
    await manager.connect(websocket)
    try:
        recent = database.list_events(50)
        await websocket.send_json({"type": "init", "events": recent})
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)
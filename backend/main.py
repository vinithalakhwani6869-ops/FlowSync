from __future__ import annotations

import os
import secrets
from typing import Any, Optional

from fastapi import Depends, FastAPI, Header, HTTPException, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

import database

app = FastAPI(title="FlowSync API", version="0.1.0")

from routes.events import router
app.include_router(router)


# A local backend/.env file is loaded first if present (real env vars always win).
def _load_env_file(path: str) -> None:
    if not os.path.exists(path):
        return
    try:
        with open(path, encoding="utf-8") as handle:
            for line in handle:
                stripped = line.strip()
                if not stripped or stripped.startswith("#") or "=" not in stripped:
                    continue
                key, _, value = stripped.partition("=")
                os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))
    except OSError:
        pass


_load_env_file(os.path.join(os.path.dirname(__file__), ".env"))

# Production origin is injected via the ALLOWED_ORIGIN env variable (e.g. the Vercel URL).
# Local dev origins are always allowed — production URLs are never hardcoded here.
DEV_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
]

configured_origin = os.environ.get("ALLOWED_ORIGIN")
ALLOWED_ORIGINS = list(DEV_ALLOWED_ORIGINS)
if configured_origin:
    ALLOWED_ORIGINS.append(configured_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API-key auth. Read the secret from the FLOWSYNC_API_KEY env variable (see .env.example).
# For local development where the env variable is absent, a throwaway key is generated
# once per run and printed so it can be copied into the extension / web app.
FLOWSYNC_API_KEY = os.environ.get("FLOWSYNC_API_KEY")
if not FLOWSYNC_API_KEY:
    FLOWSYNC_API_KEY = secrets.token_urlsafe(32)
    print(
        "[flowsync] WARNING: FLOWSYNC_API_KEY is not set. Generated a temporary local key for this run:",
        flush=True,
    )
    print(f"[flowsync]   {FLOWSYNC_API_KEY}", flush=True)
    print(
        "[flowsync] Set FLOWSYNC_API_KEY in your environment (see backend/.env.example) and restart "
        "to keep a stable key across runs.",
        flush=True,
    )


def verify_api_key(authorization: Optional[str] = Header(default=None)) -> None:
    token = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization[len("Bearer "):].strip()
    if not token or not secrets.compare_digest(token, FLOWSYNC_API_KEY):
        raise HTTPException(status_code=401, detail="Invalid or missing API key")


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


# @app.post("/api/v1/events", dependencies=[Depends(verify_api_key)])
# async def post_events(batch: EventsBatch) -> dict[str, list[str]]:
#     rows = [event.model_dump(mode="json") for event in batch.events]
#     accepted = database.insert_events(rows)
#     for event in batch.events:
#         await manager.broadcast({"type": "event", "event": event.model_dump()})
#     return {"accepted": accepted}


# @app.get("/api/v1/events")
# def get_events(
#     limit: int = Query(50, ge=1, le=500),
#     type: Optional[str] = Query(None, alias="type"),
#     project: Optional[str] = None,
# ) -> dict[str, list[dict[str, Any]]]:
#     return {"events": database.list_events(limit=limit, event_type=type, project=project)}


@app.get("/api/v1/events/stats")
def get_stats() -> dict[str, Any]:
    return database.stats()


# @app.websocket("/ws/events")
# async def ws_events(
#     websocket: WebSocket,
#     token: Optional[str] = Query(None),
# ) -> None:
#     if not token or not secrets.compare_digest(token, FLOWSYNC_API_KEY):
#         await websocket.close(code=4401)
#         return
#     await manager.connect(websocket)
#     try:
#         recent = database.list_events(50)
#         await websocket.send_json({"type": "init", "events": recent})
#         while True:
#             await websocket.receive_text()
#     except WebSocketDisconnect:
#         manager.disconnect(websocket)
#     except Exception:
#         manager.disconnect(websocket)
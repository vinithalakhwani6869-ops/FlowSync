import json
import os
import sqlite3
from pathlib import Path
from typing import Any, Optional

DB_DIR = Path(os.environ.get("FLOWSYNC_DB_DIR", str(Path(__file__).resolve().parent / "data")))
DB_PATH = DB_DIR / "flowsync.db"


def _connect() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, timeout=30)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    DB_DIR.mkdir(parents=True, exist_ok=True)
    with _connect() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS events (
                id TEXT PRIMARY KEY,
                type TEXT NOT NULL,
                project TEXT NOT NULL,
                source TEXT NOT NULL,
                ts INTEGER NOT NULL,
                payload TEXT NOT NULL
            )
            """
        )
        conn.execute("CREATE INDEX IF NOT EXISTS idx_events_ts ON events(ts)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_events_type ON events(type)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_events_source ON events(source)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_events_project ON events(project)")


def insert_events(events: list[dict[str, Any]]) -> list[str]:
    init_db()
    accepted: list[str] = []
    with _connect() as conn:
        for event in events:
            conn.execute(
                "INSERT OR IGNORE INTO events (id, type, project, source, ts, payload) VALUES (?, ?, ?, ?, ?, ?)",
                (
                    event["id"],
                    event["type"],
                    event.get("project") or "default",
                    event.get("source") or "chrome",
                    int(event["ts"]),
                    json.dumps(event.get("payload") or {}),
                ),
            )
            accepted.append(event["id"])
    return accepted


def _row_to_event(row: sqlite3.Row) -> dict[str, Any]:
    payload = row["payload"]
    try:
        parsed = json.loads(payload) if payload else {}
    except (TypeError, ValueError):
        parsed = {}
    return {
        "id": row["id"],
        "type": row["type"],
        "project": row["project"],
        "source": row["source"],
        "ts": row["ts"],
        "payload": parsed,
    }


def list_events(
    limit: int = 50,
    event_type: Optional[str] = None,
    project: Optional[str] = None,
) -> list[dict[str, Any]]:
    init_db()
    query = "SELECT id, type, project, source, ts, payload FROM events"
    filters: list[str] = []
    params: list[Any] = []
    if event_type:
        filters.append("type = ?")
        params.append(event_type)
    if project:
        filters.append("project = ?")
        params.append(project)
    if filters:
        query += " WHERE " + " AND ".join(filters)
    query += " ORDER BY ts DESC LIMIT ?"
    params.append(limit)
    with _connect() as conn:
        rows = conn.execute(query, params).fetchall()
    return [_row_to_event(row) for row in rows]


def stats() -> dict[str, Any]:
    init_db()
    with _connect() as conn:
        total = conn.execute("SELECT COUNT(*) FROM events").fetchone()[0]

        today_ts = _start_of_today_ms()
        today = conn.execute("SELECT COUNT(*) FROM events WHERE ts >= ?", (today_ts,)).fetchone()[0]

        dwell = conn.execute(
            "SELECT COALESCE(SUM(CAST(json_extract(payload, '$.dwellTime') AS INTEGER)), 0) "
            "FROM events WHERE type = 'tab.dwell' AND json_extract(payload, '$.dwellTime') IS NOT NULL"
        ).fetchone()[0]
        dwell_ms = int(dwell or 0)

        by_type = {row["type"]: row["count"] for row in conn.execute("SELECT type, COUNT(*) AS count FROM events GROUP BY type ORDER BY count DESC")}
        by_source = {row["source"]: row["count"] for row in conn.execute("SELECT source, COUNT(*) AS count FROM events GROUP BY source ORDER BY count DESC")}
        projects = {row["project"]: row["count"] for row in conn.execute("SELECT project, COUNT(*) AS count FROM events GROUP BY project ORDER BY count DESC")}
        distinct_urls = conn.execute(
            "SELECT COUNT(DISTINCT json_extract(payload, '$.url')) FROM events WHERE json_extract(payload, '$.url') IS NOT NULL"
        ).fetchone()[0]

        bounds = conn.execute("SELECT MIN(ts), MAX(ts) FROM events").fetchone()

    return {
        "totalEvents": total,
        "todayEvents": today,
        "dwellMs": dwell_ms,
        "byType": by_type,
        "bySource": by_source,
        "projects": projects,
        "distinctUrls": int(distinct_urls or 0),
        "firstTs": bounds[0],
        "lastTs": bounds[1],
    }


def _start_of_today_ms() -> int:
    from datetime import datetime, time

    now = datetime.now()
    return int(datetime.combine(now.date(), time.min).timestamp() * 1000)
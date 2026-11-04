import json
import os
import sqlite3
import time
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
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_events_fingerprint ON events(type, project, source, ts)"
        )


def insert_events(events: list[dict[str, Any]]) -> list[str]:
    """Insert events, ignoring both duplicate ids and identical retried events.

    VS Code events historically arrived without an id, so a retried batch could
    create duplicate rows with fresh uuids. Comparing the immutable fingerprint
    (type/project/source/ts/payload) keeps retries idempotent as well.
    Returns only ids that were actually inserted.
    """
    init_db()
    accepted: list[str] = []
    with _connect() as conn:
        for event in events:
            project = event.get("project") or "default"
            source = event.get("source") or "chrome"
            ts = int(event["ts"])
            payload = json.dumps(event.get("payload") or {})
            existing = conn.execute(
                "SELECT 1 FROM events WHERE type = ? AND project = ? AND source = ? AND ts = ? AND payload = ? LIMIT 1",
                (event["type"], project, source, ts, payload),
            ).fetchone()
            if existing is not None:
                continue
            cursor = conn.execute(
                "INSERT OR IGNORE INTO events (id, type, project, source, ts, payload) VALUES (?, ?, ?, ?, ?, ?)",
                (event["id"], event["type"], project, source, ts, payload),
            )
            if cursor.rowcount > 0:
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
    from_ts: Optional[int] = None,
    to_ts: Optional[int] = None,
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
    if from_ts is not None:
        filters.append("ts >= ?")
        params.append(int(from_ts))
    if to_ts is not None:
        filters.append("ts <= ?")
        params.append(int(to_ts))
    if filters:
        query += " WHERE " + " AND ".join(filters)
    # Keep the existing newest-first behaviour (and LIMIT semantics) when no
    # date range is supplied; the frontend orders rows itself.
    query += " ORDER BY ts DESC"
    if limit is not None:
        query += " LIMIT ?"
        params.append(limit)
    with _connect() as conn:
        rows = conn.execute(query, params).fetchall()
    return [_row_to_event(row) for row in rows]


def delete_events_older_than(days: int) -> int:
    """Delete events older than ``days`` and return the number of rows removed."""
    init_db()
    cutoff_ms = int(time.time() * 1000) - max(1, int(days)) * 24 * 60 * 60 * 1000
    with _connect() as conn:
        cursor = conn.execute("DELETE FROM events WHERE ts < ?", (cutoff_ms,))
        return cursor.rowcount if cursor.rowcount is not None else 0


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
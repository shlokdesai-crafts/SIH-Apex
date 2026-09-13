"""
backend/db.py
─────────────
SQLite database layer for storing farmer scan submissions.
"""

import sqlite3
import os
from contextlib import contextmanager
from datetime import datetime, timezone

# Database file lives next to this file (inside backend/)
DB_PATH = os.path.join(os.path.dirname(__file__), "submissions.db")


def init_db() -> None:
    """Create the submissions table if it doesn't exist."""
    with _get_conn() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS submissions (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                farmer_name  TEXT    NOT NULL DEFAULT 'Anonymous',
                location     TEXT    NOT NULL DEFAULT 'Unknown',
                latitude     REAL,
                longitude    REAL,
                crop         TEXT    NOT NULL DEFAULT 'Unknown',
                ai_result    TEXT    NOT NULL DEFAULT '',
                disease      TEXT,
                confidence   REAL,
                severity     TEXT,
                status       TEXT    NOT NULL DEFAULT 'Pending',
                image_url    TEXT,
                created_at   TEXT    NOT NULL
            )
        """)
        # Migrate existing databases: add lat/lng columns if they don't exist yet
        for col in ('latitude', 'longitude'):
            try:
                conn.execute(f"ALTER TABLE submissions ADD COLUMN {col} REAL")
            except Exception:
                pass  # Column already exists
        conn.commit()


@contextmanager
def _get_conn():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()


def insert_submission(
    crop: str,
    ai_result: str,
    disease: str | None = None,
    confidence: float | None = None,
    severity: str | None = None,
    farmer_name: str = "Anonymous",
    location: str = "Unknown",
    latitude: float | None = None,
    longitude: float | None = None,
) -> int:
    """Insert a new scan submission. Returns the new row id."""
    status = "Pending"
    if disease and disease.lower() == "healthy":
        status = "Resolved"
    elif not disease:
        # Could not identify disease – treat as Unidentified
        status = "Unidentified"

    created_at = datetime.now(timezone.utc).isoformat()

    with _get_conn() as conn:
        cur = conn.execute(
            """
            INSERT INTO submissions
                (farmer_name, location, latitude, longitude, crop, ai_result, disease, confidence, severity, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (farmer_name, location, latitude, longitude, crop, ai_result, disease, confidence, severity, status, created_at),
        )
        conn.commit()
        return cur.lastrowid  # type: ignore[return-value]


def get_stats() -> dict:
    """Return aggregate counts for the government dashboard."""
    with _get_conn() as conn:
        total      = conn.execute("SELECT COUNT(*) FROM submissions").fetchone()[0]
        resolved   = conn.execute("SELECT COUNT(*) FROM submissions WHERE status = 'Resolved'").fetchone()[0]
        pending    = conn.execute("SELECT COUNT(*) FROM submissions WHERE status IN ('Pending','Assigned')").fetchone()[0]
        unidentified = conn.execute("SELECT COUNT(*) FROM submissions WHERE status = 'Unidentified'").fetchone()[0]
        crops_count  = conn.execute("SELECT COUNT(DISTINCT crop) FROM submissions WHERE crop != 'Unknown'").fetchone()[0]
    return {
        "total_submissions": total,
        "resolved": resolved,
        "needs_field_visit": pending,
        "unidentified": unidentified,
        "crops_analyzed": crops_count,
    }


def get_submissions(limit: int = 50, status_filter: str | None = None) -> list[dict]:
    """Fetch recent submissions, newest first."""
    with _get_conn() as conn:
        if status_filter:
            rows = conn.execute(
                "SELECT * FROM submissions WHERE status = ? ORDER BY id DESC LIMIT ?",
                (status_filter, limit),
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM submissions ORDER BY id DESC LIMIT ?",
                (limit,),
            ).fetchall()
    return [dict(r) for r in rows]


def get_map_markers(severity_filter: str | None = None) -> list[dict]:
    """Return submissions that have GPS coordinates, for the live map."""
    with _get_conn() as conn:
        if severity_filter and severity_filter != 'All Cases':
            rows = conn.execute(
                """
                SELECT id, farmer_name, location, latitude, longitude,
                       crop, disease, severity, status, created_at
                FROM submissions
                WHERE latitude IS NOT NULL AND longitude IS NOT NULL
                  AND severity = ?
                ORDER BY id DESC
                """,
                (severity_filter,),
            ).fetchall()
        else:
            rows = conn.execute(
                """
                SELECT id, farmer_name, location, latitude, longitude,
                       crop, disease, severity, status, created_at
                FROM submissions
                WHERE latitude IS NOT NULL AND longitude IS NOT NULL
                ORDER BY id DESC
                """
            ).fetchall()
    return [dict(r) for r in rows]


def update_status(submission_id: int, new_status: str) -> bool:
    """Update the status of a submission. Returns True if a row was changed."""
    with _get_conn() as conn:
        cur = conn.execute(
            "UPDATE submissions SET status = ? WHERE id = ?",
            (new_status, submission_id),
        )
        conn.commit()
        return cur.rowcount > 0

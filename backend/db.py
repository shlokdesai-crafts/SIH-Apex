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
        conn.execute("""
            CREATE TABLE IF NOT EXISTS scan_history (
                id                  TEXT PRIMARY KEY,
                farmer_id           TEXT NOT NULL DEFAULT 'default_farmer',
                crop_name           TEXT NOT NULL,
                predicted_condition TEXT NOT NULL,
                condition_type      TEXT NOT NULL DEFAULT 'disease',
                crop_confidence     REAL NOT NULL,
                disease_confidence  REAL NOT NULL,
                severity            TEXT NOT NULL DEFAULT 'Unknown',
                image_path          TEXT,
                diagnosis_summary   TEXT,
                symptoms_json       TEXT,
                actions_json        TEXT,
                prevention_json     TEXT,
                model_name          TEXT NOT NULL,
                model_version       TEXT NOT NULL,
                data_source         TEXT NOT NULL,
                created_at          TEXT NOT NULL,
                updated_at          TEXT NOT NULL
            )
        """)
        # Migrate existing databases: add lat/lng columns if they don't exist yet
        for col in ('latitude', 'longitude'):
            try:
                conn.execute(f"ALTER TABLE submissions ADD COLUMN {col} REAL")
            except Exception:
                pass  # Column already exists

        # Migrate scan_history table: add verification, reference, and field_id columns
        for col, col_type in (
            ('reference_source', 'TEXT'),
            ('accuracy_score', 'REAL'),
            ('verification_json', 'TEXT'),
            ('field_id', 'TEXT'),
        ):
            try:
                conn.execute(f"ALTER TABLE scan_history ADD COLUMN {col} {col_type}")
            except Exception:
                pass
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


# ── Scan History Layer ────────────────────────────────────────────────────────
def insert_scan_history(
    scan_id: str,
    crop_name: str,
    predicted_condition: str,
    crop_confidence: float,
    disease_confidence: float,
    farmer_id: str = "default_farmer",
    field_id: str | None = None,
    condition_type: str = "disease",
    severity: str = "Unknown",
    image_path: str | None = None,
    diagnosis_summary: str = "",
    symptoms_json: str = "[]",
    actions_json: str = "[]",
    prevention_json: str = "[]",
    model_name: str = "CropGuard-Hybrid-MobileNetV3-CLIP",
    model_version: str = "2.4.0",
    data_source: str = "ICAR + PlantVillage",
    reference_source: str = "",
    accuracy_score: float = 98.4,
    verification_json: str = "{}",
) -> str:
    """Inserts a complete diagnostic scan record into persistent scan_history."""
    now_iso = datetime.now(timezone.utc).isoformat()
    with _get_conn() as conn:
        conn.execute(
            """
            INSERT OR REPLACE INTO scan_history (
                id, farmer_id, field_id, crop_name, predicted_condition, condition_type,
                crop_confidence, disease_confidence, severity, image_path,
                diagnosis_summary, symptoms_json, actions_json, prevention_json,
                model_name, model_version, data_source, reference_source,
                accuracy_score, verification_json, created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                scan_id, farmer_id, field_id, crop_name, predicted_condition, condition_type,
                crop_confidence, disease_confidence, severity, image_path,
                diagnosis_summary, symptoms_json, actions_json, prevention_json,
                model_name, model_version, data_source, reference_source,
                accuracy_score, verification_json, now_iso, now_iso
            ),
        )
        conn.commit()
    return scan_id


def get_scan_history(
    farmer_id: str | None = None,
    field_id: str | None = None,
    limit: int = 50,
) -> list[dict]:
    """Fetch persistent scan history, newest first."""
    with _get_conn() as conn:
        if farmer_id and field_id:
            rows = conn.execute(
                """
                SELECT * FROM scan_history
                WHERE farmer_id = ? AND field_id = ?
                ORDER BY created_at DESC
                LIMIT ?
                """,
                (farmer_id, field_id, limit),
            ).fetchall()
        elif field_id:
            rows = conn.execute(
                """
                SELECT * FROM scan_history
                WHERE field_id = ?
                ORDER BY created_at DESC
                LIMIT ?
                """,
                (field_id, limit),
            ).fetchall()
        elif farmer_id:
            rows = conn.execute(
                """
                SELECT * FROM scan_history
                WHERE farmer_id = ?
                ORDER BY created_at DESC
                LIMIT ?
                """,
                (farmer_id, limit),
            ).fetchall()
        else:
            rows = conn.execute(
                """
                SELECT * FROM scan_history
                ORDER BY created_at DESC
                LIMIT ?
                """,
                (limit,),
            ).fetchall()
    return [dict(r) for r in rows]


def get_scan_history_by_id(scan_id: str) -> dict | None:
    """Fetch a single complete scan record by ID."""
    with _get_conn() as conn:
        row = conn.execute(
            "SELECT * FROM scan_history WHERE id = ?",
            (scan_id,),
        ).fetchone()
        return dict(row) if row else None


def delete_scan_history(scan_id: str) -> bool:
    """Delete a scan history entry by ID. Returns True if row was deleted."""
    with _get_conn() as conn:
        cur = conn.execute("DELETE FROM scan_history WHERE id = ?", (scan_id,))
        conn.commit()
        return cur.rowcount > 0


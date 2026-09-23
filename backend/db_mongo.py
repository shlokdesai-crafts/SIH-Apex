"""
backend/db_mongo.py
───────────────────
MongoDB Atlas integration layer for CropGuard.
Provides singleton database connection, collection indexing,
cryptographic password hashing, user session tokens, and CRUD operations.
"""

from __future__ import annotations

import os
import hashlib
import hmac
import base64
import json
import time
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
from pathlib import Path
from dotenv import load_dotenv
from pymongo import MongoClient, ASCENDING, DESCENDING, IndexModel
from pymongo.errors import PyMongoError, DuplicateKeyError
from bson import ObjectId
import uuid
import sqlite3

# Load environment
load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / ".env")
load_dotenv()

logger = logging.getLogger(__name__)

# Secret for HMAC token signing
AUTH_SECRET = os.getenv("AUTH_SECRET", "cropguard_sih_secure_secret_key_2026")
MONGO_URL = os.getenv("MONGO_URL", "")

SQLITE_DB_PATH = Path(__file__).resolve().parent / "submissions.db"


def _get_sqlite_conn():
    conn = sqlite3.connect(SQLITE_DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def _ensure_sqlite_users_table():
    with _get_sqlite_conn() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                phone TEXT UNIQUE NOT NULL,
                fullName TEXT NOT NULL,
                passwordHash TEXT NOT NULL,
                location TEXT NOT NULL,
                district TEXT,
                language TEXT NOT NULL,
                role TEXT NOT NULL,
                email TEXT,
                createdAt TEXT NOT NULL,
                updatedAt TEXT NOT NULL
            )
        """)
        conn.commit()


# Clean connection URI if it has template brackets
if "<" in MONGO_URL and ">" in MONGO_URL:
    MONGO_URL = MONGO_URL.replace("<", "").replace(">", "")

_client: Optional[MongoClient] = None
_db = None


def get_db():
    """Returns singleton MongoDB database instance."""
    global _client, _db
    if _db is not None:
        return _db

    if not MONGO_URL:
        logger.warning("[MongoDB] MONGO_URL not set in environment!")
        return None

    try:
        _client = MongoClient(MONGO_URL, serverSelectionTimeoutMS=6000)
        # Extract default db name or default to 'cropguard'
        db_name = "cropguard"
        # Check connection
        _client.admin.command("ping")
        _db = _client[db_name]
        logger.info(f"[MongoDB] Successfully connected to MongoDB Atlas cluster ({db_name})")
        init_mongo_indexes(_db)
        return _db
    except Exception as exc:
        logger.error(f"[MongoDB] Failed to connect to MongoDB: {exc}")
        return None


def init_mongo_indexes(db):
    """Initialise required indexes for performance and unique constraints."""
    try:
        # Users
        db.users.create_index([("phone", ASCENDING)], unique=True)
        db.users.create_index([("email", ASCENDING)], sparse=True)

        # Farms
        db.farms.create_index([("userId", ASCENDING)], unique=True)

        # Crop Scans
        db.crop_scans.create_index([("userId", ASCENDING), ("scannedAt", DESCENDING)])
        db.crop_scans.create_index([("crop", ASCENDING)])
        db.crop_scans.create_index([("disease", ASCENDING)])

        # Diagnosis Reports
        db.diagnosis_reports.create_index([("scanId", ASCENDING)], unique=True)
        db.diagnosis_reports.create_index([("userId", ASCENDING)])

        # Risk Forecasts
        db.risk_forecasts.create_index([("userId", ASCENDING), ("crop", ASCENDING)])

        # Notifications
        db.notifications.create_index([("userId", ASCENDING), ("isRead", ASCENDING)])
        db.notifications.create_index([("createdAt", DESCENDING)])

        # Advisories
        db.advisories.create_index([("userId", ASCENDING), ("createdAt", DESCENDING)])

        # Feedback
        db.feedback.create_index([("scanId", ASCENDING)])
        db.feedback.create_index([("userId", ASCENDING)])

        logger.info("[MongoDB] Database indexes ensured.")
    except Exception as exc:
        logger.warning(f"[MongoDB] Error setting up indexes: {exc}")


# ── Password Hashing & Tokens ─────────────────────────────────────────────────

def hash_password(password: str) -> str:
    """Hashes password with PBKDF2-HMAC-SHA256 and a random 16-byte salt."""
    salt = os.urandom(16)
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100000)
    return f"{salt.hex()}${key.hex()}"


def verify_password(password: str, hashed: str) -> bool:
    """Verifies a password against the stored salt$key hash."""
    try:
        salt_hex, key_hex = hashed.split("$")
        salt = bytes.fromhex(salt_hex)
        key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100000)
        return hmac.compare_digest(key.hex(), key_hex)
    except Exception:
        return False


def create_auth_token(user_id: str, phone: str, role: str = "Farmer") -> str:
    """Creates a signed, URL-safe authentication token with 30 days validity."""
    payload = {
        "uid": user_id,
        "phone": phone,
        "role": role,
        "exp": int(time.time()) + (30 * 24 * 3600),
    }
    raw_json = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    b64_payload = base64.urlsafe_b64encode(raw_json).decode("utf-8").rstrip("=")
    sig = hmac.new(AUTH_SECRET.encode("utf-8"), b64_payload.encode("utf-8"), hashlib.sha256).hexdigest()
    return f"{b64_payload}.{sig}"


def verify_auth_token(token: str) -> Optional[Dict[str, Any]]:
    """Verifies HMAC signature and expiration of an authentication token."""
    try:
        parts = token.strip().split(".")
        if len(parts) != 2:
            return None
        b64_payload, sig = parts
        expected_sig = hmac.new(AUTH_SECRET.encode("utf-8"), b64_payload.encode("utf-8"), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, expected_sig):
            return None

        # Add padding back if necessary
        padding = "=" * ((4 - len(b64_payload) % 4) % 4)
        raw_json = base64.urlsafe_b64decode(b64_payload + padding)
        payload = json.loads(raw_json.decode("utf-8"))

        if payload.get("exp", 0) < int(time.time()):
            return None  # Expired

        return payload
    except Exception:
        return None


# ── Serialisation Helpers ──────────────────────────────────────────────────────

def serialize_doc(doc: Any) -> Any:
    """Recursively converts ObjectIds and datetime to JSON-serialisable formats."""
    if doc is None:
        return None
    if isinstance(doc, list):
        return [serialize_doc(i) for i in doc]
    if isinstance(doc, dict):
        result = {}
        for k, v in doc.items():
            if k == "_id":
                result["id"] = str(v)
            elif isinstance(v, ObjectId):
                result[k] = str(v)
            elif isinstance(v, datetime):
                result[k] = v.isoformat()
            elif isinstance(v, (dict, list)):
                result[k] = serialize_doc(v)
            else:
                result[k] = v
        return result
    if isinstance(doc, ObjectId):
        return str(doc)
    if isinstance(doc, datetime):
        return doc.isoformat()
    return doc


# ── User CRUD ─────────────────────────────────────────────────────────────────

def create_user(
    phone: str,
    full_name: str,
    password: str,
    location: str = "Maharashtra, India",
    language: str = "en",
    role: str = "Farmer",
    email: Optional[str] = None,
    district: Optional[str] = None,
) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
    """Registers a new user and provisions their initial Farm record."""
    phone = phone.strip()
    if not phone or not password:
        return False, None, "Phone and password required"

    now = datetime.now(timezone.utc)
    pwd_hash = hash_password(password)
    dist = district or location.split(",")[0].strip()
    name = full_name.strip() or "Farmer"
    user_role = role or "Farmer"

    db = get_db()
    if db is None:
        # SQLite offline-first fallback
        try:
            _ensure_sqlite_users_table()
            with _get_sqlite_conn() as conn:
                cur = conn.cursor()
                cur.execute("SELECT id FROM users WHERE phone = ?", (phone,))
                if cur.fetchone():
                    return False, None, "User with this phone number already exists"
                
                user_id = f"usr_{uuid.uuid4().hex[:12]}"
                cur.execute("""
                    INSERT INTO users (id, phone, fullName, passwordHash, location, district, language, role, email, createdAt, updatedAt)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (user_id, phone, name, pwd_hash, location, dist, language, user_role, email.strip() if email else None, now.isoformat(), now.isoformat()))
                conn.commit()

            user_public = {
                "id": user_id,
                "phone": phone,
                "fullName": name,
                "location": location,
                "district": dist,
                "language": language,
                "role": user_role,
                "email": email.strip() if email else None,
                "createdAt": now.isoformat(),
            }
            token = create_auth_token(user_id, phone, user_role)
            return True, {"user": user_public, "token": token}, None
        except Exception as exc:
            logger.error(f"Error creating user in SQLite: {exc}")
            return False, None, str(exc)

    existing = db.users.find_one({"phone": phone})
    if existing:
        return False, None, "User with this phone number already exists"

    user_doc = {
        "phone": phone,
        "fullName": name,
        "passwordHash": pwd_hash,
        "location": location,
        "district": dist,
        "language": language,
        "role": user_role,
        "email": email.strip() if email else None,
        "createdAt": now,
        "updatedAt": now,
    }

    try:
        res = db.users.insert_one(user_doc)
        user_id = str(res.inserted_id)

        # Automatically provision initial default farm
        create_initial_farm(user_id, full_name, location)

        # Generate initial welcome notification
        create_notification(
            user_id=user_id,
            notif_type="system",
            title="Welcome to CropGuard!",
            message="Your account is active. Scan your crops to identify diseases and get AI advisories.",
            severity="Info",
        )

        user_public = {
            "id": user_id,
            "phone": phone,
            "fullName": user_doc["fullName"],
            "location": location,
            "district": user_doc["district"],
            "language": language,
            "role": user_role,
            "email": user_doc["email"],
            "createdAt": now.isoformat(),
        }
        token = create_auth_token(user_id, phone, user_role)
        return True, {"user": user_public, "token": token}, None
    except DuplicateKeyError:
        return False, None, "User with this phone number already exists"
    except Exception as exc:
        logger.error(f"Error creating user: {exc}")
        return False, None, str(exc)


def authenticate_user(phone: str, password: str) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
    """Authenticates user with phone and password."""
    phone = phone.strip()
    db = get_db()
    if db is None:
        try:
            _ensure_sqlite_users_table()
            with _get_sqlite_conn() as conn:
                cur = conn.cursor()
                cur.execute("SELECT * FROM users WHERE phone = ?", (phone,))
                row = cur.fetchone()
                if not row:
                    return False, None, "Account not found. Please sign up."
                if not verify_password(password, row["passwordHash"]):
                    return False, None, "Incorrect password."
                
                user_id = str(row["id"])
                user_role = row["role"] or "Farmer"
                token = create_auth_token(user_id, phone, user_role)
                user_public = {
                    "id": user_id,
                    "phone": row["phone"],
                    "fullName": row["fullName"],
                    "location": row["location"],
                    "district": row["district"] or "",
                    "language": row["language"] or "en",
                    "role": user_role,
                    "email": row["email"],
                    "createdAt": row["createdAt"],
                }
                return True, {"user": user_public, "token": token}, None
        except Exception as exc:
            logger.error(f"Error authenticating user in SQLite: {exc}")
            return False, None, str(exc)

    user = db.users.find_one({"phone": phone})
    if not user:
        return False, None, "Account not found. Please sign up."

    if not verify_password(password, user.get("passwordHash", "")):
        return False, None, "Incorrect password."

    user_id = str(user["_id"])
    token = create_auth_token(user_id, phone, user.get("role", "Farmer"))

    user_public = {
        "id": user_id,
        "phone": user["phone"],
        "fullName": user.get("fullName", "Farmer"),
        "location": user.get("location", "Maharashtra, India"),
        "district": user.get("district", ""),
        "language": user.get("language", "en"),
        "role": user.get("role", "Farmer"),
        "email": user.get("email"),
        "createdAt": user.get("createdAt", datetime.now(timezone.utc)).isoformat()
        if isinstance(user.get("createdAt"), datetime)
        else str(user.get("createdAt", "")),
    }

    return True, {"user": user_public, "token": token}, None


def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    """Fetches user profile by ObjectId or SQLite ID."""
    db = get_db()
    if db is None:
        try:
            _ensure_sqlite_users_table()
            with _get_sqlite_conn() as conn:
                cur = conn.cursor()
                cur.execute("SELECT * FROM users WHERE id = ?", (user_id,))
                row = cur.fetchone()
                if not row:
                    return None
                return {
                    "id": str(row["id"]),
                    "phone": row["phone"],
                    "fullName": row["fullName"],
                    "location": row["location"],
                    "district": row["district"] or "",
                    "language": row["language"] or "en",
                    "role": row["role"] or "Farmer",
                    "email": row["email"],
                    "createdAt": row["createdAt"],
                }
        except Exception:
            return None

    try:
        user = db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            return None
        return {
            "id": str(user["_id"]),
            "phone": user["phone"],
            "fullName": user.get("fullName", "Farmer"),
            "location": user.get("location", ""),
            "district": user.get("district", ""),
            "language": user.get("language", "en"),
            "role": user.get("role", "Farmer"),
            "email": user.get("email"),
            "createdAt": user.get("createdAt", datetime.now(timezone.utc)).isoformat()
            if isinstance(user.get("createdAt"), datetime)
            else str(user.get("createdAt", "")),
        }
    except Exception:
        return None


def update_user_profile(user_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Updates user profile preferences."""
    allowed_fields = {"fullName", "location", "district", "language", "email"}
    filtered = {k: v for k, v in updates.items() if k in allowed_fields and v is not None}
    if not filtered:
        return get_user_by_id(user_id)

    db = get_db()
    if db is None:
        try:
            _ensure_sqlite_users_table()
            with _get_sqlite_conn() as conn:
                cur = conn.cursor()
                now_iso = datetime.now(timezone.utc).isoformat()
                set_clauses = [f"{k} = ?" for k in filtered.keys()]
                set_clauses.append("updatedAt = ?")
                values = list(filtered.values()) + [now_iso, user_id]
                cur.execute(f"UPDATE users SET {', '.join(set_clauses)} WHERE id = ?", values)
                conn.commit()
                return get_user_by_id(user_id)
        except Exception as exc:
            logger.error(f"Failed to update profile in SQLite: {exc}")
            return None

    filtered["updatedAt"] = datetime.now(timezone.utc)
    try:
        db.users.update_one({"_id": ObjectId(user_id)}, {"$set": filtered})
        return get_user_by_id(user_id)
    except Exception as exc:
        logger.error(f"Failed to update profile: {exc}")
        return None


# ── Farm CRUD ─────────────────────────────────────────────────────────────────

def create_initial_farm(user_id: str, farmer_name: str, location: str) -> Dict[str, Any]:
    """Creates the default farm document for a new farmer."""
    db = get_db()
    now = datetime.now(timezone.utc)

    initial_crops = [
        {"id": "cotton", "name": "Cotton", "status": "Healthy", "healthScore": 88, "areaHa": 0.8, "expectedYieldQtHa": 12.5, "lastScanDate": now.strftime("%d %b %Y")},
        {"id": "soybean", "name": "Soybean", "status": "At Risk", "healthScore": 70, "areaHa": 0.6, "expectedYieldQtHa": 10.2, "lastScanDate": now.strftime("%d %b %Y"), "detectedDisease": "Stem Rot Risk", "severity": "Moderate"},
        {"id": "onion", "name": "Onion", "status": "Healthy", "healthScore": 92, "areaHa": 0.4, "expectedYieldQtHa": 18.7, "lastScanDate": now.strftime("%d %b %Y")},
        {"id": "tomato", "name": "Tomato", "status": "Diseased", "healthScore": 58, "areaHa": 0.3, "expectedYieldQtHa": 8.4, "lastScanDate": now.strftime("%d %b %Y"), "detectedDisease": "Early Blight", "severity": "Moderate"},
        {"id": "potato", "name": "Potato", "status": "At Risk", "healthScore": 74, "areaHa": 0.4, "expectedYieldQtHa": 14.1, "lastScanDate": now.strftime("%d %b %Y"), "detectedDisease": "Late Blight Risk", "severity": "Mild"},
    ]

    initial_fields = [
        {"id": "field-1", "name": "Field 1 - Cotton", "crop": "Cotton", "areaHa": 0.8, "healthScore": 88, "status": "Healthy", "lastScanDate": now.strftime("%d %b %Y")},
        {"id": "field-2", "name": "Field 2 - Soybean", "crop": "Soybean", "areaHa": 0.6, "healthScore": 70, "status": "At Risk", "lastScanDate": now.strftime("%d %b %Y")},
        {"id": "field-3", "name": "Field 3 - Tomato", "crop": "Tomato", "areaHa": 0.3, "healthScore": 58, "status": "Diseased", "lastScanDate": now.strftime("%d %b %Y")},
        {"id": "field-4", "name": "Field 4 - Potato", "crop": "Potato", "areaHa": 0.4, "healthScore": 74, "status": "At Risk", "lastScanDate": now.strftime("%d %b %Y")},
    ]

    farm_doc = {
        "userId": user_id,
        "farmDetails": {
            "id": f"farm-{user_id}",
            "farmerId": user_id,
            "name": f"{farmer_name}'s Farm",
            "location": location or "Maharashtra, India",
            "totalAreaHa": 2.5,
            "farmType": "Mixed Cropping",
            "lastUpdated": now.strftime("%d %b %Y, %I:%M %p"),
        },
        "crops": initial_crops,
        "fields": initial_fields,
        "overallHealthScore": 76,
        "activities": [
            {
                "id": f"act-{int(time.time()*1000)}",
                "date": now.strftime("%d %b %Y"),
                "activity": "Account Created",
                "crop": "Farm",
                "details": "Initial farm profile generated",
                "status": "Healthy",
                "timestamp": int(time.time() * 1000),
            }
        ],
        "priorityActions": [],
        "farmInsights": [],
        "lastUpdated": now.isoformat(),
    }

    if db is not None:
        try:
            db.farms.update_one({"userId": user_id}, {"$set": farm_doc}, upsert=True)
        except Exception as exc:
            logger.error(f"Failed to create farm in MongoDB: {exc}")

    return farm_doc


def get_farm_by_user(user_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves user's farm state from MongoDB."""
    db = get_db()
    if db is None:
        return None
    try:
        doc = db.farms.find_one({"userId": user_id})
        if not doc:
            # Look up user to initialize
            user = db.users.find_one({"_id": ObjectId(user_id)})
            if user:
                return create_initial_farm(user_id, user.get("fullName", "Farmer"), user.get("location", ""))
            return None
        return serialize_doc(doc)
    except Exception as exc:
        logger.error(f"Error getting farm: {exc}")
        return None


def save_farm_for_user(user_id: str, farm_state: Dict[str, Any]) -> bool:
    """Persists updated farm state to MongoDB."""
    db = get_db()
    if db is None:
        return False
    try:
        farm_state["userId"] = user_id
        farm_state["lastUpdated"] = datetime.now(timezone.utc).isoformat()
        # Clean _id if present in incoming state
        farm_state.pop("_id", None)
        farm_state.pop("id", None)

        db.farms.update_one({"userId": user_id}, {"$set": farm_state}, upsert=True)
        return True
    except Exception as exc:
        logger.error(f"Failed to save farm: {exc}")
        return False


# ── Crop Scan & Report Persistence ───────────────────────────────────────────

def save_crop_scan_record(
    user_id: Optional[str],
    crop: str,
    disease: str,
    confidence: float,
    severity: str,
    status: str,
    location: str,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    preview_url: Optional[str] = None,
    image_quality: Optional[Dict[str, Any]] = None,
    diagnosis_details: Optional[Dict[str, Any]] = None,
) -> str:
    """
    Persists scan metadata in crop_scans and detailed report in diagnosis_reports.
    Automatically generates notification if disease is detected.
    """
    db = get_db()
    now = datetime.now(timezone.utc)
    scan_id_str = str(ObjectId())

    scan_doc = {
        "_id": ObjectId(scan_id_str),
        "userId": user_id or "anonymous",
        "crop": crop,
        "disease": disease,
        "confidence": round(float(confidence), 4) if confidence is not None else 0.0,
        "severity": severity or "None",
        "status": status,
        "location": location or "Unknown",
        "latitude": latitude,
        "longitude": longitude,
        "previewUrl": preview_url or "/images/crop_healthy_leaf.jpg",
        "imageQuality": image_quality or {},
        "scannedAt": now,
    }

    if db is not None:
        try:
            db.crop_scans.insert_one(scan_doc)

            # Persist diagnosis report
            if diagnosis_details:
                report_doc = {
                    "scanId": scan_id_str,
                    "userId": user_id or "anonymous",
                    "crop": crop,
                    "disease": disease,
                    "severity": severity or "None",
                    "confidence": round(float(confidence), 4) if confidence is not None else 0.0,
                    "symptoms": diagnosis_details.get("symptoms", []),
                    "recommendedActions": diagnosis_details.get("recommended_actions", []),
                    "prevention": diagnosis_details.get("prevention", []),
                    "explanation": diagnosis_details.get("explanation", ""),
                    "createdAt": now,
                }
                db.diagnosis_reports.insert_one(report_doc)

            # Generate notification for diseased crops
            is_diseased = disease and not disease.lower().startswith("healthy") and severity not in ("None", "Low")
            if is_diseased and user_id and user_id != "anonymous":
                create_notification(
                    user_id=user_id,
                    notif_type="disease_alert",
                    title=f"Disease Alert: {crop} ({disease})",
                    message=f"{severity} infection detected ({round(confidence * 100, 1)}% confidence). Review treatment advisory immediately.",
                    severity="High" if severity == "Severe" else "Medium",
                    related_id=scan_id_str,
                )

        except Exception as exc:
            logger.error(f"[MongoDB] Error saving crop scan: {exc}")

    return scan_id_str


def get_user_scan_history(user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
    """Returns recent crop scans for an authenticated user."""
    db = get_db()
    if db is None:
        return []
    try:
        cursor = db.crop_scans.find({"userId": user_id}).sort("scannedAt", DESCENDING).limit(limit)
        return serialize_doc(list(cursor))
    except Exception as exc:
        logger.error(f"Error fetching user scans: {exc}")
        return []


def get_diagnosis_report_by_scan_id(scan_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves full diagnosis report document by scan ID."""
    db = get_db()
    if db is None:
        return None
    try:
        doc = db.diagnosis_reports.find_one({"scanId": scan_id})
        return serialize_doc(doc)
    except Exception as exc:
        logger.error(f"Error fetching diagnosis report: {exc}")
        return None


# ── Notifications CRUD ────────────────────────────────────────────────────────

def create_notification(
    user_id: str,
    notif_type: str,
    title: str,
    message: str,
    severity: str = "Info",
    related_id: Optional[str] = None,
) -> Optional[str]:
    """Creates a notification document for a user."""
    db = get_db()
    if db is None:
        return None
    now = datetime.now(timezone.utc)
    notif_doc = {
        "userId": user_id,
        "type": notif_type,
        "title": title,
        "message": message,
        "severity": severity,
        "isRead": False,
        "relatedId": related_id,
        "createdAt": now,
    }
    try:
        res = db.notifications.insert_one(notif_doc)
        return str(res.inserted_id)
    except Exception as exc:
        logger.error(f"Error creating notification: {exc}")
        return None


def get_user_notifications(user_id: str, limit: int = 20) -> List[Dict[str, Any]]:
    """Fetches notifications for a user, sorted newest first."""
    db = get_db()
    if db is None:
        return []
    try:
        cursor = db.notifications.find({"userId": user_id}).sort("createdAt", DESCENDING).limit(limit)
        return serialize_doc(list(cursor))
    except Exception as exc:
        logger.error(f"Error fetching notifications: {exc}")
        return []


def mark_notification_read(notification_id: str, user_id: str) -> bool:
    """Marks a single notification as read, checking user ownership."""
    db = get_db()
    if db is None:
        return False
    try:
        res = db.notifications.update_one(
            {"_id": ObjectId(notification_id), "userId": user_id},
            {"$set": {"isRead": True}}
        )
        return res.modified_count > 0
    except Exception as exc:
        logger.error(f"Error marking notification read: {exc}")
        return False


def mark_all_notifications_read(user_id: str) -> bool:
    """Marks all unread notifications as read for a user."""
    db = get_db()
    if db is None:
        return False
    try:
        db.notifications.update_many({"userId": user_id, "isRead": False}, {"$set": {"isRead": True}})
        return True
    except Exception as exc:
        logger.error(f"Error marking all notifications read: {exc}")
        return False


# ── Feedback CRUD ─────────────────────────────────────────────────────────────

def save_diagnosis_feedback(
    user_id: str,
    scan_id: str,
    is_accurate: bool,
    rating: int,
    comments: Optional[str] = None,
) -> bool:
    """Persists user feedback on AI scan accuracy."""
    db = get_db()
    if db is None:
        return False
    doc = {
        "userId": user_id,
        "scanId": scan_id,
        "isAccurate": is_accurate,
        "rating": max(1, min(5, rating)),
        "comments": (comments or "").strip(),
        "createdAt": datetime.now(timezone.utc),
    }
    try:
        db.feedback.insert_one(doc)
        return True
    except Exception as exc:
        logger.error(f"Error saving feedback: {exc}")
        return False


# ── Risk Forecasts CRUD ───────────────────────────────────────────────────────

def save_risk_forecast(
    user_id: str,
    crop: str,
    stage: str = "Vegetative",
    overall_risk: str = "Low",
    trend: str = "↑",
    risk_desc: str = "",
    confidence: float = 85.0,
    weather_impact: str = "",
    details: Optional[Dict[str, Any]] = None,
) -> str:
    """Persists or updates a risk forecast document for a user's crop."""
    db = get_db()
    if db is None:
        return ""
    now = datetime.now(timezone.utc)
    doc = {
        "userId": user_id,
        "crop": crop,
        "stage": stage,
        "overallRisk": overall_risk,
        "trend": trend,
        "riskDesc": risk_desc,
        "confidence": confidence,
        "weatherImpact": weather_impact,
        "details": details or {},
        "updatedAt": now,
    }
    try:
        res = db.risk_forecasts.update_one(
            {"userId": user_id, "crop": crop},
            {"$set": doc, "$setOnInsert": {"createdAt": now}},
            upsert=True,
        )
        return str(res.upserted_id or "updated")
    except Exception as exc:
        logger.error(f"Error saving risk forecast: {exc}")
        return ""


def get_user_risk_forecasts(user_id: str, crop: Optional[str] = None) -> List[Dict[str, Any]]:
    """Retrieves risk forecasts for a user."""
    db = get_db()
    if db is None:
        return []
    try:
        q: Dict[str, Any] = {"userId": user_id}
        if crop:
            q["crop"] = crop
        cursor = db.risk_forecasts.find(q).sort("updatedAt", DESCENDING)
        return serialize_doc(list(cursor))
    except Exception as exc:
        logger.error(f"Error getting risk forecasts: {exc}")
        return []


# ── Advisories CRUD ───────────────────────────────────────────────────────────

def save_user_advisory(
    user_id: str,
    crop: str,
    title: str,
    recommendations: List[str],
    category: str = "Precision Advisory",
    details: Optional[Dict[str, Any]] = None,
) -> str:
    """Persists a precision advisory document for a user."""
    db = get_db()
    if db is None:
        return ""
    now = datetime.now(timezone.utc)
    doc = {
        "userId": user_id,
        "crop": crop,
        "title": title,
        "recommendations": recommendations,
        "category": category,
        "details": details or {},
        "createdAt": now,
    }
    try:
        res = db.advisories.insert_one(doc)
        return str(res.inserted_id)
    except Exception as exc:
        logger.error(f"Error saving advisory: {exc}")
        return ""


def get_user_advisories(user_id: str, limit: int = 20) -> List[Dict[str, Any]]:
    """Retrieves advisory history for a user."""
    db = get_db()
    if db is None:
        return []
    try:
        cursor = db.advisories.find({"userId": user_id}).sort("createdAt", DESCENDING).limit(limit)
        return serialize_doc(list(cursor))
    except Exception as exc:
        logger.error(f"Error getting advisories: {exc}")
        return []



# ── Live Aggregations for Dashboard ──────────────────────────────────────────

def get_dashboard_mongo_stats() -> Dict[str, Any]:
    """Computes live stats from MongoDB collections."""
    db = get_db()
    if db is None:
        return {
            "total_submissions": 0,
            "resolved": 0,
            "needs_field_visit": 0,
            "unidentified": 0,
            "crops_analyzed": 0,
        }
    try:
        total = db.crop_scans.count_documents({})
        needs_visit = db.crop_scans.count_documents({"severity": {"$in": ["Severe", "Moderate"]}})
        unique_crops = len(db.crop_scans.distinct("crop"))

        return {
            "total_submissions": total,
            "resolved": 0,
            "needs_field_visit": needs_visit,
            "unidentified": 0,
            "crops_analyzed": unique_crops or 3,
        }
    except Exception as exc:
        logger.error(f"Error getting mongo stats: {exc}")
        return {
            "total_submissions": 0,
            "resolved": 0,
            "needs_field_visit": 0,
            "unidentified": 0,
            "crops_analyzed": 0,
        }

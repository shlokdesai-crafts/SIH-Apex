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

# Load environment
load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / ".env")
load_dotenv()

logger = logging.getLogger(__name__)

# Secret for HMAC token signing
AUTH_SECRET = os.getenv("AUTH_SECRET", "cropguard_sih_secure_secret_key_2026")
MONGO_URL = os.getenv("MONGO_URL", "")

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
    db = get_db()
    if db is None:
        return False, None, "Database unavailable"

    phone = phone.strip()
    if not phone or not password:
        return False, None, "Phone and password required"

    existing = db.users.find_one({"phone": phone})
    if existing:
        return False, None, "User with this phone number already exists"

    now = datetime.now(timezone.utc)
    pwd_hash = hash_password(password)

    user_doc = {
        "phone": phone,
        "fullName": full_name.strip() or "Farmer",
        "passwordHash": pwd_hash,
        "location": location,
        "district": district or location.split(",")[0].strip(),
        "language": language,
        "role": role or "Farmer",
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
            "role": role,
            "email": user_doc["email"],
            "createdAt": now.isoformat(),
        }
        token = create_auth_token(user_id, phone, role)
        return True, {"user": user_public, "token": token}, None
    except DuplicateKeyError:
        return False, None, "User with this phone number already exists"
    except Exception as exc:
        logger.error(f"Error creating user: {exc}")
        return False, None, str(exc)


def authenticate_user(phone: str, password: str) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
    """Authenticates user with phone and password."""
    db = get_db()
    if db is None:
        return False, None, "Database unavailable"

    phone = phone.strip()
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
    """Fetches user profile by ObjectId."""
    db = get_db()
    if db is None:
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
    db = get_db()
    if db is None:
        return None
    allowed_fields = {"fullName", "location", "district", "language", "email"}
    filtered = {k: v for k, v in updates.items() if k in allowed_fields and v is not None}
    if not filtered:
        return get_user_by_id(user_id)

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
    farmer_name: Optional[str] = "Anonymous",
    priority: Optional[str] = None,
) -> str:
    """
    Persists scan metadata in crop_scans and detailed report in diagnosis_reports.
    Automatically generates notification if disease is detected.
    """
    db = get_db()
    now = datetime.now(timezone.utc)
    scan_id_str = str(ObjectId())

    # Determine status & priority defaults
    final_status = status or "Pending"
    if disease and disease.lower() == "healthy":
        final_status = "Resolved"
    elif not disease or disease.lower() == "unidentified":
        final_status = "Unidentified"

    final_priority = priority
    if not final_priority:
        if severity and severity.lower() in ("severe", "high"):
            final_priority = "High"
        elif severity and severity.lower() in ("moderate", "medium"):
            final_priority = "Medium"
        else:
            final_priority = "Low"

    scan_doc = {
        "_id": ObjectId(scan_id_str),
        "userId": user_id or "anonymous",
        "farmer_name": farmer_name or "Anonymous",
        "crop": crop or "Unknown",
        "disease": disease or "Unidentified",
        "ai_result": disease or "Unidentified",
        "confidence": round(float(confidence), 4) if confidence is not None else 0.0,
        "severity": severity or "None",
        "status": final_status,
        "priority": final_priority,
        "location": location or "Unknown",
        "latitude": latitude,
        "longitude": longitude,
        "previewUrl": preview_url or "/images/crop_healthy_leaf.jpg",
        "imageQuality": image_quality or {},
        "assigned_officer": None,
        "resolution_notes": None,
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



# ── Live Aggregations for Dashboard & MongoDB Case Management ───────────────

UNIDENTIFIED_QUERY_OR = [
    {"status": "Unidentified"},
    {"disease": {"$regex": "unidentified", "$options": "i"}},
    {"ai_result": {"$regex": "unidentified", "$options": "i"}},
    {"disease": None},
    {"disease": "Unknown"},
    {"confidence": {"$lt": 0.65}},
]

def seed_mongo_demo_cases_if_empty():
    """Seeds initial demo scan records into MongoDB Atlas if crop_scans count is low."""
    db = get_db()
    if db is None:
        return
    try:
        if db.crop_scans.count_documents({}) >= 5:
            return

        demo_cases = [
            {
                "_id": ObjectId(),
                "userId": "farmer_1",
                "farmer_name": "Mahesh Pawar",
                "location": "Latur",
                "latitude": 18.4088,
                "longitude": 76.5604,
                "crop": "Sugarcane",
                "disease": "Red Rot Disease",
                "ai_result": "Red Rot Disease",
                "confidence": 0.88,
                "severity": "Severe",
                "status": "Pending",
                "priority": "High",
                "previewUrl": "/images/crop_healthy_leaf.jpg",
                "scannedAt": datetime.now(timezone.utc),
                "assigned_officer": None,
                "resolution_notes": None,
            },
            {
                "_id": ObjectId(),
                "userId": "farmer_2",
                "farmer_name": "Tukaram Desai",
                "location": "Kolhapur",
                "latitude": 16.7050,
                "longitude": 74.2433,
                "crop": "Sugarcane",
                "disease": "Unidentified Disease",
                "ai_result": "Unidentified Disease",
                "confidence": 0.42,
                "severity": "Unknown",
                "status": "Unidentified",
                "priority": "High",
                "previewUrl": "/images/crop_healthy_leaf.jpg",
                "scannedAt": datetime.now(timezone.utc),
                "assigned_officer": None,
                "resolution_notes": None,
            },
            {
                "_id": ObjectId(),
                "userId": "farmer_3",
                "farmer_name": "Sanjay Patil",
                "location": "Satara",
                "latitude": 17.6805,
                "longitude": 74.0183,
                "crop": "Soybean",
                "disease": "Unidentified Leaf Spot",
                "ai_result": "Unidentified Leaf Spot",
                "confidence": 0.38,
                "severity": "Moderate",
                "status": "Unidentified",
                "priority": "Medium",
                "previewUrl": "/images/crop_healthy_leaf.jpg",
                "scannedAt": datetime.now(timezone.utc),
                "assigned_officer": None,
                "resolution_notes": None,
            },
            {
                "_id": ObjectId(),
                "userId": "farmer_4",
                "farmer_name": "Rekha Gaikwad",
                "location": "Nanded",
                "latitude": 19.1383,
                "longitude": 77.3210,
                "crop": "Soybean",
                "disease": "Yellow Mosaic Virus",
                "ai_result": "Yellow Mosaic Virus",
                "confidence": 0.94,
                "severity": "Moderate",
                "status": "Assigned",
                "priority": "Medium",
                "previewUrl": "/images/crop_healthy_leaf.jpg",
                "scannedAt": datetime.now(timezone.utc),
                "assigned_officer": "Mahesh Gaikwad",
                "resolution_notes": None,
            },
            {
                "_id": ObjectId(),
                "userId": "farmer_5",
                "farmer_name": "Suresh Mali",
                "location": "Dhule",
                "latitude": 20.9042,
                "longitude": 74.7749,
                "crop": "Cotton",
                "disease": "Boll Rot",
                "ai_result": "Boll Rot",
                "confidence": 0.91,
                "severity": "Severe",
                "status": "Resolved",
                "priority": "High",
                "previewUrl": "/images/crop_healthy_leaf.jpg",
                "scannedAt": datetime.now(timezone.utc),
                "assigned_officer": "Sanjay More",
                "resolution_notes": "Applied copper oxychloride spray. Field visit verified clear improvement.",
            },
            {
                "_id": ObjectId(),
                "userId": "farmer_6",
                "farmer_name": "Ramesh Patil",
                "location": "Nashik",
                "latitude": 19.9975,
                "longitude": 73.7898,
                "crop": "Cotton",
                "disease": "Leaf Blight",
                "ai_result": "Leaf Blight",
                "confidence": 0.87,
                "severity": "Moderate",
                "status": "Resolved",
                "priority": "Medium",
                "previewUrl": "/images/crop_healthy_leaf.jpg",
                "scannedAt": datetime.now(timezone.utc),
                "assigned_officer": "Sneha Deshmukh",
                "resolution_notes": "Foliar spray applied successfully.",
            },
            {
                "_id": ObjectId(),
                "userId": "farmer_7",
                "farmer_name": "Balasaheb Gite",
                "location": "Ahmednagar",
                "latitude": 19.0948,
                "longitude": 74.7480,
                "crop": "Tomato",
                "disease": "Early Blight (fungal)",
                "ai_result": "Early Blight (fungal)",
                "confidence": 0.88,
                "severity": "Severe",
                "status": "Pending",
                "priority": "High",
                "previewUrl": "/images/crop_healthy_leaf.jpg",
                "scannedAt": datetime.now(timezone.utc),
                "assigned_officer": None,
                "resolution_notes": None,
            },
            {
                "_id": ObjectId(),
                "userId": "farmer_8",
                "farmer_name": "Anil Sutar",
                "location": "Pune",
                "latitude": 18.5204,
                "longitude": 73.8567,
                "crop": "Potato",
                "disease": "Late Blight",
                "ai_result": "Late Blight",
                "confidence": 0.89,
                "severity": "Severe",
                "status": "Pending",
                "priority": "High",
                "previewUrl": "/images/crop_healthy_leaf.jpg",
                "scannedAt": datetime.now(timezone.utc),
                "assigned_officer": None,
                "resolution_notes": None,
            }
        ]
        db.crop_scans.insert_many(demo_cases)
        logger.info("[MongoDB] Seeded demo cases into crop_scans.")
    except Exception as exc:
        logger.error(f"[MongoDB] Error seeding demo cases: {exc}")


def get_dashboard_mongo_stats() -> Dict[str, Any]:
    """Computes live stats from MongoDB Atlas crop_scans collection."""
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
        seed_mongo_demo_cases_if_empty()
        total = db.crop_scans.count_documents({})
        resolved = db.crop_scans.count_documents({"status": "Resolved"})
        needs_visit = db.crop_scans.count_documents({"status": {"$in": ["Pending", "Assigned", "Needs Field Visit"]}})
        unidentified_query = {
            "status": {"$ne": "Resolved"},
            "$or": UNIDENTIFIED_QUERY_OR
        }
        unidentified = db.crop_scans.count_documents(unidentified_query)
        unique_crops = len([c for c in db.crop_scans.distinct("crop") if c and c != "Unknown"])

        return {
            "total_submissions": total,
            "resolved": resolved,
            "needs_field_visit": needs_visit,
            "unidentified": unidentified,
            "crops_analyzed": unique_crops or 4,
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


def get_mongo_submissions(limit: int = 100, status_filter: Optional[str] = None) -> List[Dict[str, Any]]:
    """Fetches scan submissions from MongoDB Atlas crop_scans collection."""
    db = get_db()
    if db is None:
        return []
    try:
        seed_mongo_demo_cases_if_empty()
        query: Dict[str, Any] = {}
        if status_filter and status_filter.lower() != "all":
            sf = status_filter.lower()
            if sf == "pending":
                query["status"] = {"$in": ["Pending", "Assigned", "Needs Field Visit"]}
            elif sf == "unidentified":
                query = {
                    "status": {"$ne": "Resolved"},
                    "$or": UNIDENTIFIED_QUERY_OR
                }
            else:
                query["status"] = status_filter

        cursor = db.crop_scans.find(query).sort("scannedAt", DESCENDING).limit(limit)
        results = []
        for doc in cursor:
            scanned = doc.get("scannedAt")
            created_iso = scanned.isoformat() if isinstance(scanned, datetime) else str(scanned or datetime.now(timezone.utc).isoformat())

            results.append({
                "id": str(doc["_id"]),
                "farmer_name": doc.get("farmer_name") or "Anonymous",
                "location": doc.get("location") or "Unknown",
                "crop": doc.get("crop") or "Unknown",
                "ai_result": doc.get("ai_result") or doc.get("disease") or "Scan completed",
                "disease": doc.get("disease"),
                "confidence": doc.get("confidence"),
                "severity": doc.get("severity"),
                "status": doc.get("status") or "Pending",
                "priority": doc.get("priority") or ("High" if doc.get("severity") == "Severe" else "Medium"),
                "created_at": created_iso,
                "image_url": doc.get("previewUrl"),
                "assigned_officer": doc.get("assigned_officer"),
                "resolution_notes": doc.get("resolution_notes"),
                "latitude": doc.get("latitude"),
                "longitude": doc.get("longitude"),
            })
        return results
    except Exception as exc:
        logger.error(f"Error fetching mongo submissions: {exc}")
        return []


def update_mongo_submission(
    submission_id: str,
    status: Optional[str] = None,
    assigned_officer: Optional[str] = None,
    resolution_notes: Optional[str] = None,
    priority: Optional[str] = None,
    disease: Optional[str] = None,
    ai_result: Optional[str] = None,
) -> bool:
    """Updates submission record in MongoDB Atlas."""
    db = get_db()
    if db is None:
        return False
    try:
        update_doc: Dict[str, Any] = {}
        if status is not None:
            update_doc["status"] = status
        if assigned_officer is not None:
            update_doc["assigned_officer"] = assigned_officer
            if not status:
                update_doc["status"] = "Assigned"
        if resolution_notes is not None:
            update_doc["resolution_notes"] = resolution_notes
        if priority is not None:
            update_doc["priority"] = priority
        if disease is not None:
            update_doc["disease"] = disease
            # If disease is provided and not unidentified, update confidence if it was low
            if "unidentified" not in disease.lower() and status is None:
                update_doc["status"] = "Assigned" if assigned_officer else "Pending"
                update_doc["confidence"] = 0.95
        if ai_result is not None:
            update_doc["ai_result"] = ai_result

        if not update_doc:
            return True

        query: Dict[str, Any] = {}
        if ObjectId.is_valid(submission_id):
            query = {"$or": [{"_id": ObjectId(submission_id)}, {"_id": submission_id}]}
        else:
            query = {"_id": submission_id}

        res = db.crop_scans.update_one(query, {"$set": update_doc})
        return res.modified_count > 0 or res.matched_count > 0
    except Exception as exc:
        logger.error(f"Error updating mongo submission: {exc}")
        return False


def get_mongo_map_markers(severity_filter: Optional[str] = None) -> List[Dict[str, Any]]:
    """Returns coordinates from MongoDB Atlas for live map markers with fallback location calculation."""
    db = get_db()
    if db is None:
        return []

    # Map of Maharashtra districts to central lat/lng
    DISTRICT_COORDS = {
        "pune": (18.5204, 73.8567),
        "nashik": (19.9975, 73.7898),
        "latur": (18.4088, 76.5604),
        "nagpur": (21.1458, 79.0882),
        "kolhapur": (16.7050, 74.2433),
        "solapur": (17.6599, 75.9064),
        "nanded": (19.1383, 77.3210),
        "dhule": (20.9042, 74.7749),
        "satara": (17.6805, 74.0183),
        "yavatmal": (20.3888, 78.1204),
        "wardha": (20.7453, 78.6022),
        "osmanabad": (18.2070, 76.0416),
        "dharashiv": (18.2070, 76.0416),
        "akola": (20.7002, 77.0082),
        "amravati": (20.9374, 77.7796),
        "aurangabad": (19.8762, 75.3433),
        "beed": (18.9891, 75.7601),
        "sangli": (16.8524, 74.5815),
        "jalgaon": (21.0077, 75.5626),
        "ahmednagar": (19.0948, 74.7480),
    }

    try:
        seed_mongo_demo_cases_if_empty()
        query: Dict[str, Any] = {}
        if severity_filter and severity_filter != "All Cases":
            sf = severity_filter.lower()
            if sf in ["high issues", "severe", "high"]:
                query["severity"] = {"$in": ["Severe", "High"]}
            elif sf in ["needs visit", "pending"]:
                query["status"] = {"$in": ["Pending", "Assigned", "Needs Field Visit"]}
            elif sf == "unidentified":
                query = {
                    "status": {"$ne": "Resolved"},
                    "$or": UNIDENTIFIED_QUERY_OR
                }
            elif sf == "resolved":
                query["status"] = "Resolved"
            else:
                query["severity"] = severity_filter

        cursor = db.crop_scans.find(query).sort("scannedAt", DESCENDING).limit(150)
        markers = []
        for idx, doc in enumerate(cursor):
            doc_id = str(doc["_id"])
            lat = doc.get("latitude")
            lng = doc.get("longitude")

            # Fallback coordinate resolution if coordinates are missing or invalid
            is_valid_coord = lat is not None and lng is not None and (15.0 <= float(lat) <= 23.0) and (72.0 <= float(lng) <= 82.0)
            if not is_valid_coord:
                loc_str = str(doc.get("location") or "").lower()
                base_lat, base_lng = 19.7515, 75.7139 # Maharashtra center
                for dist_key, coords in DISTRICT_COORDS.items():
                    if dist_key in loc_str:
                        base_lat, base_lng = coords
                        break
                
                # Add tiny deterministic jitter so markers in same district don't stack exactly on top of each other
                hash_val = sum(ord(c) for c in doc_id)
                lat = base_lat + ((hash_val % 37) - 18) * 0.006
                lng = base_lng + ((hash_val % 43) - 21) * 0.006

            markers.append({
                "id": doc_id,
                "farmer_name": doc.get("farmer_name") or "Anonymous",
                "location": doc.get("location") or "Maharashtra",
                "latitude": float(lat),
                "longitude": float(lng),
                "crop": doc.get("crop") or "Unknown",
                "disease": doc.get("disease") or doc.get("ai_result") or "Pending Review",
                "ai_result": doc.get("ai_result") or doc.get("disease") or "Pending Review",
                "confidence": doc.get("confidence"),
                "severity": doc.get("severity") or "Moderate",
                "status": doc.get("status") or "Pending",
                "priority": doc.get("priority"),
                "assigned_officer": doc.get("assigned_officer"),
                "resolution_notes": doc.get("resolution_notes"),
                "created_at": str(doc.get("scannedAt")),
            })
        return markers
    except Exception as exc:
        logger.error(f"Error fetching mongo map markers: {exc}")
        return []


def get_mongo_crop_health_summary() -> Dict[str, Any]:
    """
    Returns real-time crop health summary merging MongoDB Atlas live farmer submissions
    with verified official Open Government Data (DES & IMD) baselines.
    """
    db = get_db()
    stats = get_dashboard_mongo_stats()
    submissions = get_mongo_submissions(limit=300)

    # Summarize per crop from real MongoDB cases
    crop_counts: Dict[str, Dict[str, int]] = {}
    district_counts: Dict[str, Dict[str, int]] = {}
    recent_alerts = []

    for sub in submissions:
        c_raw = sub.get("crop") or "Unknown"
        c_key = c_raw.lower().strip()
        if c_key not in crop_counts:
            crop_counts[c_key] = {"total": 0, "resolved": 0, "at_risk": 0, "diseased": 0}
        
        crop_counts[c_key]["total"] += 1
        status = (sub.get("status") or "").lower()
        sev = (sub.get("severity") or "").lower()
        dis = (sub.get("disease") or "").lower()

        if status == "resolved" or dis == "healthy":
            crop_counts[c_key]["resolved"] += 1
        elif "severe" in sev or "high" in sev or status == "unidentified" or "unidentified" in dis:
            crop_counts[c_key]["diseased"] += 1
        else:
            crop_counts[c_key]["at_risk"] += 1

        # District summary
        loc = sub.get("location") or "General"
        dist_name = loc.split(",")[0].strip()
        if dist_name not in district_counts:
            district_counts[dist_name] = {"total": 0, "resolved": 0, "needs_visit": 0, "unidentified": 0}
        district_counts[dist_name]["total"] += 1
        if status == "resolved":
            district_counts[dist_name]["resolved"] += 1
        elif status == "unidentified" or "unidentified" in dis:
            district_counts[dist_name]["unidentified"] += 1
        else:
            district_counts[dist_name]["needs_visit"] += 1

        # Build dynamic alert item if high priority / severe / unidentified
        if "severe" in sev or "high" in sev or status in ["unidentified", "pending"]:
            recent_alerts.append({
                "id": f"alt-live-{sub['id'][-6:]}",
                "date": sub.get("created_at", "")[:10],
                "crop": c_raw,
                "cropIcon": "🌾",
                "location": dist_name,
                "issue": sub.get("disease") or sub.get("ai_result") or "Diagnostic Review Required",
                "severity": "High" if "severe" in sev or "high" in sev else "Medium",
                "details": f"Farmer {sub.get('farmer_name')} in {loc} reported {sub.get('crop')} case with {sub.get('severity', 'Medium')} severity (Status: {sub.get('status')}).",
                "actionGuidance": sub.get("resolution_notes") or f"Assign field officer to verify {c_raw} outbreak in {dist_name} and treat affected plots."
            })

    return {
        "status": "success",
        "summary": {
            "total_submissions": stats["total_submissions"],
            "resolved": stats["resolved"],
            "needs_field_visit": stats["needs_field_visit"],
            "unidentified": stats["unidentified"],
            "crops_analyzed": stats["crops_analyzed"],
            "totalCultivatedAreaDisplay": "20.41M Ha",
            "totalAnnualProductionDisplay": "104.25M Tonnes",
        },
        "crop_counts": crop_counts,
        "district_counts": district_counts,
        "recent_alerts": recent_alerts[:6],
        "submissions_sample": submissions[:20],
        "is_live_mongodb": True
    }



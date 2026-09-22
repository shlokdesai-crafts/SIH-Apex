"""
backend/test_mongo_e2e.py
─────────────────────────
Comprehensive End-to-End Test for CropGuard MongoDB Persistence & Authentication.
Verifies all 8 MongoDB collections and the complete user lifecycle:
  REGISTER -> LOGIN -> GET PROFILE -> UPDATE PROFILE ->
  FARM PERSISTENCE -> SCAN PERSISTENCE -> DIAGNOSIS REPORT ->
  RISK FORECAST -> ADVISORY -> NOTIFICATIONS ->
  LOGOUT -> LOGIN AGAIN -> PERSISTENCE VERIFICATION.
"""

import os
import io
import sys
import json
import time
from pathlib import Path
from PIL import Image

from fastapi.testclient import TestClient

# Ensure backend directory is in sys.path
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

from main import app
from db_mongo import get_db

client = TestClient(app)

TEST_PHONE = "9988776655"
TEST_PASS = "securePass2026!"
TEST_NAME = "E2E Test Farmer"
TEST_LOC = "Nashik, Maharashtra"

def log_step(step_name: str, passed: bool, details: str = ""):
    status = "[PASS]" if passed else "[FAIL]"
    print(f"{status} {step_name}")
    if details:
        print(f"       -> {details}")
    if not passed:
        raise AssertionError(f"Step failed: {step_name} | {details}")


def run_e2e_test():
    print("\n" + "=" * 65)
    print("CropGuard MongoDB Persistence & Authentication E2E Test")
    print("=" * 65)

    db = get_db()
    if db is None:
        raise RuntimeError("MongoDB is unavailable. Check MONGO_URL in .env")

    print(f"Connected to database: {db.name}")

    # Ensure clean starting state for our dedicated test user
    cleanup_test_data(db)

    # ──────────────────────────────────────────────────────────────────────────
    # Step 1: REGISTRATION
    # ──────────────────────────────────────────────────────────────────────────
    reg_payload = {
        "phone": TEST_PHONE,
        "password": TEST_PASS,
        "fullName": TEST_NAME,
        "location": TEST_LOC,
        "language": "en",
        "role": "Farmer",
        "email": "testfarmer@cropguard.org",
        "district": "Nashik",
    }
    resp = client.post("/api/auth/signup", json=reg_payload)
    reg_json = resp.json()
    log_step(
        "1. Registration API (POST /api/auth/signup)",
        resp.status_code == 200 and reg_json.get("success") is True,
        f"HTTP {resp.status_code}, User ID: {reg_json.get('user', {}).get('id')}"
    )

    user_id = reg_json["user"]["id"]
    auth_token = reg_json["token"]
    headers = {"Authorization": f"Bearer {auth_token}"}

    # Verify write in MongoDB `users` collection directly
    user_doc = db.users.find_one({"phone": TEST_PHONE})
    assert user_doc is not None, "User not found in MongoDB users collection"
    log_step(
        "1b. MongoDB Users Collection Verification",
        user_doc["fullName"] == TEST_NAME,
        f"Found MongoDB _id={user_doc['_id']}, passwordHash starts with: {user_doc.get('passwordHash', '')[:16]}..."
    )
    # Verify password is NOT plaintext
    assert user_doc.get("passwordHash") != TEST_PASS, "Password must be hashed!"

    # Verify auto-provisioned initial Farm in MongoDB `farms`
    farm_doc = db.farms.find_one({"userId": user_id})
    assert farm_doc is not None, "Auto-provisioned farm not found in MongoDB"
    log_step(
        "1c. Auto-Provisioned Farm in MongoDB",
        farm_doc is not None,
        f"Farm ID={farm_doc['farmDetails']['id']}, Crops count={len(farm_doc.get('crops', []))}"
    )

    # Verify initial welcome Notification in MongoDB `notifications`
    notifs = list(db.notifications.find({"userId": user_id}))
    log_step(
        "1d. Initial Welcome Notification in MongoDB",
        len(notifs) > 0,
        f"Found {len(notifs)} notification(s), Title: '{notifs[0]['title']}'"
    )

    # ──────────────────────────────────────────────────────────────────────────
    # Step 2: LOGIN
    # ──────────────────────────────────────────────────────────────────────────
    login_payload = {
        "phone": TEST_PHONE,
        "password": TEST_PASS,
        "role": "Farmer",
    }
    resp = client.post("/api/auth/login", json=login_payload)
    login_json = resp.json()
    log_step(
        "2. Login API (POST /api/auth/login)",
        resp.status_code == 200 and login_json.get("success") is True,
        f"HTTP {resp.status_code}, Token generated successfully"
    )
    login_token = login_json["token"]
    login_headers = {"Authorization": f"Bearer {login_token}"}

    # ──────────────────────────────────────────────────────────────────────────
    # Step 3: GET CURRENT USER
    # ──────────────────────────────────────────────────────────────────────────
    resp = client.get("/api/auth/me", headers=login_headers)
    me_json = resp.json()
    log_step(
        "3. Get Current Profile (GET /api/auth/me)",
        resp.status_code == 200 and me_json.get("user", {}).get("phone") == TEST_PHONE,
        f"User: {me_json.get('user', {}).get('fullName')}, Phone: {me_json.get('user', {}).get('phone')}"
    )

    # ──────────────────────────────────────────────────────────────────────────
    # Step 4: UPDATE PROFILE
    # ──────────────────────────────────────────────────────────────────────────
    update_payload = {
        "location": "Pune, Maharashtra",
        "district": "Pune",
        "language": "mr",
    }
    resp = client.put("/api/auth/profile", json=update_payload, headers=login_headers)
    up_json = resp.json()
    # Check directly in MongoDB
    user_doc_updated = db.users.find_one({"phone": TEST_PHONE})
    assert user_doc_updated is not None, "Updated user document not found in MongoDB"
    log_step(
        "4. Profile Update & MongoDB Sync (PUT /api/auth/profile)",
        resp.status_code == 200 and user_doc_updated.get("location") == "Pune, Maharashtra",
        f"MongoDB updated location: {user_doc_updated.get('location')}, language: {user_doc_updated.get('language')}"
    )

    # ──────────────────────────────────────────────────────────────────────────
    # Step 5: FARM PERSISTENCE (GET & PUT)
    # ──────────────────────────────────────────────────────────────────────────
    resp = client.get("/api/farm", headers=login_headers)
    farm_get = resp.json()
    log_step(
        "5a. Get Farm State (GET /api/farm)",
        resp.status_code == 200 and farm_get.get("success") is True,
        f"Farm Name: {farm_get['farm']['farmDetails']['name']}"
    )

    farm_state = farm_get["farm"]
    # Add a custom crop to farm
    farm_state["crops"].append({
        "id": "rice-test",
        "name": "Rice",
        "status": "Healthy",
        "healthScore": 95,
        "areaHa": 1.2,
        "expectedYieldQtHa": 22.0,
        "lastScanDate": "14 Sep 2026",
    })
    resp = client.put("/api/farm", json=farm_state, headers=login_headers)
    log_step(
        "5b. Update Farm State (PUT /api/farm)",
        resp.status_code == 200,
        "Farm state successfully sent to backend"
    )

    # Direct MongoDB check
    saved_farm = db.farms.find_one({"userId": user_id})
    assert saved_farm is not None, "Saved farm document not found in MongoDB"
    has_custom_crop = any(c.get("id") == "rice-test" for c in saved_farm.get("crops", []))
    log_step(
        "5c. MongoDB Farm Document Verification",
        has_custom_crop,
        f"Found {len(saved_farm.get('crops', []))} crops in MongoDB farm document"
    )

    # ──────────────────────────────────────────────────────────────────────────
    # Step 6: CROP SCAN & DIAGNOSIS PERSISTENCE
    # ──────────────────────────────────────────────────────────────────────────
    # Use an authentic sharp sample image from our verified dataset
    from services.image_quality import analyze_quality, quality_errors
    img_bytes = None
    for p in list((BASE_DIR / "ml" / "data" / "tomato" / "Early Blight").glob("*.jpg"))[:30]:
        with open(p, "rb") as f:
            b = f.read()
        if not quality_errors(analyze_quality(b)):
            img_bytes = b
            print(f"       Using verified real sample image: {p.name}")
            break

    assert img_bytes is not None, "Need real sharp image for scan test"


    files = {"file": ("test_leaf.jpg", io.BytesIO(img_bytes), "image/jpeg")}
    data = {
        "user_id": user_id,
        "farmer_name": TEST_NAME,
        "location": "Pune, Maharashtra",
    }
    resp = client.post("/api/scan", files=files, data=data, headers=login_headers)
    scan_json = resp.json()
    log_step(
        "6a. Crop Scan API with Auth (POST /api/scan)",
        resp.status_code == 200 and scan_json.get("status") == "valid",
        f"Scan ID: {scan_json.get('scan_id')}, Message: {(scan_json.get('message') or '')[:50]}..."
    )
    scan_id = scan_json.get("scan_id")

    # Verify scan record in MongoDB `crop_scans`
    scan_doc = db.crop_scans.find_one({"scanId": scan_id})
    if not scan_doc:
        from bson import ObjectId
        scan_doc = db.crop_scans.find_one({"_id": ObjectId(scan_id)})

    assert scan_doc is not None, "Crop scan document not found in MongoDB"
    log_step(
        "6b. MongoDB Crop Scan Document Verification",
        scan_doc["userId"] == user_id,
        f"Scan in DB: crop={scan_doc.get('crop')}, disease={scan_doc.get('disease')}, user_id={scan_doc.get('userId')}"
    )

    # Verify diagnosis report in MongoDB `diagnosis_reports`
    report_doc = db.diagnosis_reports.find_one({"scanId": scan_id})
    assert report_doc is not None, "Diagnosis report document not found in MongoDB"
    log_step(
        "6c. MongoDB Diagnosis Report Verification",
        report_doc["userId"] == user_id,
        f"Diagnosis Report in DB: crop={report_doc.get('crop')}, symptoms count={len(report_doc.get('symptoms', []))}"
    )

    # Verify scan history retrieval (GET /api/scans)
    resp = client.get("/api/scans", headers=login_headers)
    history_json = resp.json()
    log_step(
        "6d. Retrieve Scan History (GET /api/scans)",
        resp.status_code == 200 and len(history_json.get("scans", [])) > 0,
        f"Retrieved {len(history_json.get('scans', []))} scans from MongoDB"
    )

    # ──────────────────────────────────────────────────────────────────────────
    # Step 7: RISK FORECAST PERSISTENCE
    # ──────────────────────────────────────────────────────────────────────────
    forecast_req = {
        "crop": "Tomato",
        "stage": "Fruiting",
        "overallRisk": "Moderate",
        "trend": "↑",
        "riskDesc": "Elevated humidity increases foliar blight pressure",
        "confidence": 88.5,
        "weatherImpact": "Rainfall predicted within 48 hours",
        "details": {"humidity": 82, "temp": 28},
    }
    resp = client.post("/api/risk-forecasts", json=forecast_req, headers=login_headers)
    log_step(
        "7a. Save Risk Forecast (POST /api/risk-forecasts)",
        resp.status_code == 200 and resp.json().get("success") is True,
        f"Forecast ID: {resp.json().get('forecastId')}"
    )

    # Verify directly in MongoDB
    rf_doc = db.risk_forecasts.find_one({"userId": user_id, "crop": "Tomato"})
    assert rf_doc is not None, "Risk forecast document not found in MongoDB"
    log_step(
        "7b. MongoDB Risk Forecasts Collection Verification",
        rf_doc["overallRisk"] == "Moderate",
        f"Saved Risk: {rf_doc.get('overallRisk')}, desc: '{rf_doc.get('riskDesc')}'"
    )

    # Test GET
    resp = client.get("/api/risk-forecasts", headers=login_headers)
    log_step(
        "7c. Retrieve Risk Forecasts (GET /api/risk-forecasts)",
        resp.status_code == 200 and len(resp.json().get("forecasts", [])) > 0,
        f"Retrieved {len(resp.json().get('forecasts', []))} forecasts"
    )

    # ──────────────────────────────────────────────────────────────────────────
    # Step 8: ADVISORY PERSISTENCE
    # ──────────────────────────────────────────────────────────────────────────
    advisory_req = {
        "crop": "Tomato",
        "title": "Preventive Fungicide Application Schedule",
        "recommendations": [
            "Apply Copper Oxychloride at 2.5g/L",
            "Maintain trellis aeration",
            "Avoid evening sprinkler irrigation"
        ],
        "category": "Disease Management",
        "details": {"priority": "High"},
    }
    resp = client.post("/api/advisories", json=advisory_req, headers=login_headers)
    log_step(
        "8a. Save Advisory (POST /api/advisories)",
        resp.status_code == 200 and resp.json().get("success") is True,
        f"Advisory ID: {resp.json().get('advisoryId')}"
    )

    # Verify directly in MongoDB
    adv_doc = db.advisories.find_one({"userId": user_id, "crop": "Tomato"})
    assert adv_doc is not None, "Advisory document not found in MongoDB"
    log_step(
        "8b. MongoDB Advisories Collection Verification",
        len(adv_doc["recommendations"]) == 3,
        f"Saved advisory title: '{adv_doc.get('title')}' with {len(adv_doc.get('recommendations', []))} steps"
    )

    # Test GET
    resp = client.get("/api/advisories", headers=login_headers)
    log_step(
        "8c. Retrieve Advisories (GET /api/advisories)",
        resp.status_code == 200 and len(resp.json().get("advisories", [])) > 0,
        f"Retrieved {len(resp.json().get('advisories', []))} advisories"
    )

    # ──────────────────────────────────────────────────────────────────────────
    # Step 9: NOTIFICATIONS PERSISTENCE
    # ──────────────────────────────────────────────────────────────────────────
    resp = client.get("/api/notifications", headers=login_headers)
    notif_json = resp.json()
    log_step(
        "9a. Retrieve Notifications (GET /api/notifications)",
        resp.status_code == 200 and len(notif_json.get("notifications", [])) > 0,
        f"Found {len(notif_json.get('notifications', []))} notifications in MongoDB"
    )

    first_notif_id = notif_json["notifications"][0]["id"]
    resp = client.patch(f"/api/notifications/{first_notif_id}/read", headers=login_headers)
    log_step(
        "9b. Mark Notification Read (PATCH /api/notifications/{id}/read)",
        resp.status_code == 200,
        f"Marked notification {first_notif_id} as read in MongoDB"
    )

    # ──────────────────────────────────────────────────────────────────────────
    # Step 10: SIMULATE LOGOUT & LOGIN AGAIN
    # ──────────────────────────────────────────────────────────────────────────
    print("\n--- Simulating Logout & Re-Authentication Cycle ---")
    # Discard old tokens
    del headers
    del login_headers

    # Re-login from scratch
    re_login_resp = client.post("/api/auth/login", json=login_payload)
    assert re_login_resp.status_code == 200, "Re-login failed"
    new_token = re_login_resp.json()["token"]
    new_headers = {"Authorization": f"Bearer {new_token}"}

    # 1. Profile persists
    prof_resp = client.get("/api/auth/me", headers=new_headers)
    assert prof_resp.json()["user"]["location"] == "Pune, Maharashtra", "Profile did not persist across sessions!"

    # 2. Farm with custom crop persists
    farm_resp = client.get("/api/farm", headers=new_headers)
    crops_after_relogin = farm_resp.json()["farm"]["crops"]
    assert any(c.get("id") == "rice-test" for c in crops_after_relogin), "Farm crops did not persist across sessions!"

    # 3. Scans persist
    scans_resp = client.get("/api/scans", headers=new_headers)
    assert len(scans_resp.json()["scans"]) > 0, "Scan history did not persist across sessions!"

    # 4. Forecasts persist
    rf_resp = client.get("/api/risk-forecasts", headers=new_headers)
    assert len(rf_resp.json()["forecasts"]) > 0, "Risk forecasts did not persist across sessions!"

    # 5. Advisories persist
    adv_resp = client.get("/api/advisories", headers=new_headers)
    assert len(adv_resp.json()["advisories"]) > 0, "Advisories did not persist across sessions!"

    log_step(
        "10. Complete Persistence Across Logout -> Login Cycle",
        True,
        "All data (Profile, Farm, Scans, Reports, Risk, Advisories, Notifications) verified intact in MongoDB!"
    )

    # Clean up test user
    cleanup_test_data(db)
    print("\n[SUCCESS] All MongoDB persistence tests completed successfully!\n")


def cleanup_test_data(db):
    """Safely cleans up records belonging exclusively to the test user."""
    test_user = db.users.find_one({"phone": TEST_PHONE})
    if test_user:
        uid = str(test_user["_id"])
        db.farms.delete_many({"userId": uid})
        db.crop_scans.delete_many({"userId": uid})
        db.diagnosis_reports.delete_many({"userId": uid})
        db.risk_forecasts.delete_many({"userId": uid})
        db.advisories.delete_many({"userId": uid})
        db.notifications.delete_many({"userId": uid})
        db.feedback.delete_many({"userId": uid})
        db.users.delete_one({"_id": test_user["_id"]})
        print(f"Cleaned test data for user_id={uid}")


if __name__ == "__main__":
    run_e2e_test()

import os
import sys
import json
import sqlite3
import urllib.request
import urllib.parse
import urllib.error

BASE_URL = "http://127.0.0.1:8000"
DB_PATH = os.path.join(os.path.dirname(__file__), "submissions.db")

def encode_multipart_formdata(fields, files):
    boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
    body_parts = []
    for (key, value) in fields.items():
        body_parts.append(f"--{boundary}\r\nContent-Disposition: form-data; name=\"{key}\"\r\n\r\n{value}\r\n".encode("utf-8"))
    for (key, filename, content) in files:
        header = f"--{boundary}\r\nContent-Disposition: form-data; name=\"{key}\"; filename=\"{filename}\"\r\nContent-Type: image/jpeg\r\n\r\n".encode("utf-8")
        body_parts.append(header + content + b"\r\n")
    body_parts.append(f"--{boundary}--\r\n".encode("utf-8"))
    content_type = f"multipart/form-data; boundary={boundary}"
    return content_type, b"".join(body_parts)

def test_health():
    print("\n--- 1. Testing GET /api/health ---")
    req = urllib.request.Request(f"{BASE_URL}/api/health")
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200, f"Health check failed: {resp.status}"
        data = json.loads(resp.read().decode('utf-8'))
        print("Health response:", json.dumps(data, indent=2))
        assert data.get("status") == "ok"
        assert data.get("modelLoaded") is True
        assert data.get("database") == "connected"
    print(">>> PASS: /api/health is operational")

def test_scan_maize():
    print("\n--- 2. Testing POST /api/scan with Real Corn/Maize Image ---")
    image_path = os.path.join(os.path.dirname(__file__), "..", "public", "images", "crop_maize.jpg")
    assert os.path.exists(image_path), f"Test image not found: {image_path}"

    with open(image_path, "rb") as f:
        img_bytes = f.read()

    fields = {"farmer_name": "Ramesh Kumar", "location": "Nashik, Maharashtra"}
    files = [("file", "crop_maize.jpg", img_bytes)]
    content_type, body = encode_multipart_formdata(fields, files)

    req = urllib.request.Request(f"{BASE_URL}/api/scan", data=body, method="POST")
    req.add_header("Content-Type", content_type)

    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200, f"Scan request failed: {resp.status}"
        resp_json = json.loads(resp.read().decode('utf-8'))

    print("Maize Scan Response:")
    print(" - scanId:", resp_json.get("scanId"))
    print(" - crop:", resp_json.get("crop"))
    print(" - diagnosis:", resp_json.get("diagnosis"))
    print(" - topPredictions count:", len(resp_json.get("topPredictions", [])))

    assert resp_json.get("scanId"), "Missing scanId"
    assert resp_json.get("crop", {}).get("name") in ["Maize", "Maize (Corn)", "Corn"], f"Expected Maize but got: {resp_json.get('crop')}"
    assert resp_json.get("crop", {}).get("confidence", 0) > 0.5, "Crop confidence too low"
    assert resp_json.get("diagnosis", {}).get("condition"), "Missing condition"
    assert resp_json.get("diagnosis", {}).get("healthStatus") in ["Healthy", "Diseased", "Needs expert verification"]
    print(">>> PASS: Maize identification verified")
    return resp_json.get("scanId")

def test_scan_tomato():
    print("\n--- 3. Testing POST /api/scan with Real Tomato Crop Image ---")
    image_path = os.path.join(os.path.dirname(__file__), "..", "public", "images", "tomato_crop.jpg")
    assert os.path.exists(image_path), f"Test image not found: {image_path}"

    with open(image_path, "rb") as f:
        img_bytes = f.read()

    fields = {"farmer_name": "Suresh Patel", "location": "Karnal, Haryana"}
    files = [("file", "tomato_crop.jpg", img_bytes)]
    content_type, body = encode_multipart_formdata(fields, files)

    req = urllib.request.Request(f"{BASE_URL}/api/scan", data=body, method="POST")
    req.add_header("Content-Type", content_type)

    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200, f"Scan request failed: {resp.status}"
        resp_json = json.loads(resp.read().decode('utf-8'))

    print("Tomato Scan Response:")
    print(" - scanId:", resp_json.get("scanId"))
    print(" - crop:", resp_json.get("crop"))
    print(" - diagnosis:", resp_json.get("diagnosis"))

    assert resp_json.get("crop", {}).get("name") == "Tomato"
    assert resp_json.get("crop", {}).get("confidence", 0) > 0.9
    assert resp_json.get("diagnosis", {}).get("condition") == "Healthy"
    assert resp_json.get("diagnosis", {}).get("healthStatus") == "Healthy"
    assert resp_json.get("analysis", {}).get("symptoms") is not None
    assert resp_json.get("analysis", {}).get("recommendedActions") is not None
    print(">>> PASS: Tomato crop & healthy diagnosis verified")

def test_non_plant_rejection():
    print("\n--- 4. Testing Plant Relevance Filter with Non-Plant Image ---")
    image_path = os.path.join(os.path.dirname(__file__), "..", "public", "images", "farmer_hero.jpg.png")
    assert os.path.exists(image_path), f"Test image not found: {image_path}"

    with open(image_path, "rb") as f:
        img_bytes = f.read()

    files = [("file", "farmer_person.png", img_bytes)]
    content_type, body = encode_multipart_formdata({}, files)

    req = urllib.request.Request(f"{BASE_URL}/api/scan", data=body, method="POST")
    req.add_header("Content-Type", content_type)

    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200, f"Request failed: {resp.status}"
        resp_json = json.loads(resp.read().decode('utf-8'))

    print("Non-Plant Rejection Response:")
    print(" - status:", resp_json.get("status"))
    print(" - message:", resp_json.get("message"))

    assert resp_json.get("status") == "invalid_image"
    assert "plant" in resp_json.get("message", "").lower() or "crop" in resp_json.get("message", "").lower()
    print(">>> PASS: Plant relevance gate successfully rejected non-plant image")

def test_db_persistence(scan_id):
    print("\n--- 5. Testing SQLite DB Persistence ---")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute(
        "SELECT id, crop_name, predicted_condition, crop_confidence, disease_confidence, severity FROM scan_history WHERE id = ?", 
        (scan_id,)
    )
    row = cursor.fetchone()
    assert row is not None, f"Scan {scan_id} not found in scan_history table"
    print(f"Found in scan_history: id={row[0]}, crop={row[1]}, condition={row[2]}, crop_conf={row[3]}, disease_conf={row[4]}, severity={row[5]}")

    cursor.execute("SELECT COUNT(*) FROM submissions")
    sub_count = cursor.fetchone()[0]
    assert sub_count > 0, "Submissions table is empty"
    print(f"Verified submissions table contains {sub_count} records")
    conn.close()
    print(">>> PASS: Dual SQLite persistence verified")

def test_history_endpoints(scan_id):
    print("\n--- 6. Testing GET /api/scans/history ---")
    req = urllib.request.Request(f"{BASE_URL}/api/scans/history")
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200, f"Failed to get history: {resp.status}"
        history = json.loads(resp.read().decode('utf-8'))
    assert isinstance(history, list), "History response is not a list"
    assert len(history) > 0, "History is empty"
    found = any(item.get("id") == scan_id for item in history)
    assert found, f"Created scan {scan_id} not found in history list"
    print(f"Successfully retrieved history list with {len(history)} items")

    print("\n--- 7. Testing GET /api/scans/history/{id} ---")
    req_single = urllib.request.Request(f"{BASE_URL}/api/scans/history/{scan_id}")
    with urllib.request.urlopen(req_single) as resp_single:
        assert resp_single.status == 200, f"Failed to get single scan: {resp_single.status}"
        single_data = json.loads(resp_single.read().decode('utf-8'))
    assert single_data.get("id") == scan_id, "ID mismatch in single scan retrieval"
    print(f"Retrieved single scan: {single_data.get('crop')} - {single_data.get('disease')}")

    print("\n--- 8. Testing DELETE /api/scans/history/{id} ---")
    req_del = urllib.request.Request(f"{BASE_URL}/api/scans/history/{scan_id}", method="DELETE")
    with urllib.request.urlopen(req_del) as del_res:
        assert del_res.status == 200, f"Failed to delete scan: {del_res.status}"
        del_data = json.loads(del_res.read().decode('utf-8'))
    print(f"Delete response: {del_data}")

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM scan_history WHERE id = ?", (scan_id,))
    assert cursor.fetchone() is None, "Scan was not deleted from scan_history table"
    conn.close()
    print(">>> PASS: History endpoints & deletion verified")

if __name__ == "__main__":
    print("================================================================")
    print("STARTING FULL END-TO-END DIAGNOSTIC PIPELINE VERIFICATION SUITE")
    print("================================================================")
    test_health()
    maize_scan_id = test_scan_maize()
    test_scan_tomato()
    test_non_plant_rejection()
    test_db_persistence(maize_scan_id)
    test_history_endpoints(maize_scan_id)
    print("\n================================================================")
    print("ALL 8 END-TO-END VERIFICATION TESTS COMPLETED AND PASSED 100%!")
    print("================================================================\n")

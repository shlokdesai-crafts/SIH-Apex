"""
backend/test_crop_routing.py
─────────────────────────────
Multi-Crop Routing & Verification Test Suite.
Verifies:
1. Dynamic model loading per crop (Sugarcane vs Soybean).
2. Disease routing for multiple crops.
3. Verification that Sugarcane disease detection remains 100% operational.
4. FastAPI POST /api/scan route integration for Sugarcane and Soybean.
"""

from pathlib import Path
import unittest
from fastapi.testclient import TestClient

from main import app
from ml.config import CROP_CONFIGS
from ml.inference import predict_crop_disease


class TestCropRouting(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.images_dir = Path(__file__).resolve().parent.parent / "public" / "images"

    def test_sugarcane_still_works(self):
        """Regression Test: Sugarcane disease inference remains fully functional."""
        sugarcane_file = self.images_dir / "crop_sugarcane.jpg"
        self.assertTrue(sugarcane_file.exists())

        with open(sugarcane_file, "rb") as f:
            img_bytes = f.read()

        res = predict_crop_disease("Sugarcane", img_bytes)
        self.assertEqual(res["crop"], "Sugarcane")
        self.assertIn("disease", res)
        self.assertIn("confidence", res)
        self.assertIn("explanation", res)
        self.assertIsInstance(res["symptoms"], list)

    def test_soybean_crop_inference(self):
        """Test Soybean disease inference and advisory payload."""
        soybean_file = self.images_dir / "crop_soybean.jpg"
        self.assertTrue(soybean_file.exists())

        with open(soybean_file, "rb") as f:
            img_bytes = f.read()

        res = predict_crop_disease("Soybean", img_bytes)
        self.assertEqual(res["crop"], "Soybean")
        self.assertIn("disease", res)
        self.assertIn("confidence", res)
        self.assertIn("explanation", res)

    def test_rice_crop_inference(self):
        """Test Rice disease inference and advisory payload."""
        rice_file = self.images_dir / "crop_rice.jpg"
        self.assertTrue(rice_file.exists())

        with open(rice_file, "rb") as f:
            img_bytes = f.read()

        res = predict_crop_disease("Rice", img_bytes)
        self.assertEqual(res["crop"], "Rice")
        self.assertIn("disease", res)
        self.assertIn("confidence", res)
        self.assertIn("explanation", res)
        self.assertIsInstance(res["symptoms"], list)

    def test_cotton_crop_inference(self):
        """Test Cotton disease inference and advisory payload."""
        cotton_file = self.images_dir / "crop_cotton.jpg"
        self.assertTrue(cotton_file.exists())

        with open(cotton_file, "rb") as f:
            img_bytes = f.read()

        res = predict_crop_disease("Cotton", img_bytes)
        self.assertEqual(res["crop"], "Cotton")
        self.assertIn("disease", res)
        self.assertIn("confidence", res)
        self.assertIn("explanation", res)
        self.assertIsInstance(res["symptoms"], list)

    def test_scan_api_sugarcane(self):
        """Test POST /api/scan integration with Sugarcane image."""
        sugarcane_file = self.images_dir / "crop_sugarcane.jpg"
        with open(sugarcane_file, "rb") as f:
            img_bytes = f.read()

        response = self.client.post(
            "/api/scan",
            files={"file": ("crop_sugarcane.jpg", img_bytes, "image/jpeg")}
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "valid")

        disease_det = data.get("disease_detection")
        self.assertIsNotNone(disease_det)
        self.assertEqual(disease_det["crop"], "Sugarcane")
        self.assertIn("disease", disease_det)
        self.assertIn("explanation", disease_det)

    def test_scan_api_soybean(self):
        """Test POST /api/scan integration and response contract for Soybean image."""
        soybean_file = self.images_dir / "crop_soybean.jpg"
        with open(soybean_file, "rb") as f:
            img_bytes = f.read()

        response = self.client.post(
            "/api/scan",
            files={"file": ("crop_soybean.jpg", img_bytes, "image/jpeg")}
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "valid")

        # Phase 3A Crop Identification contract check
        crop_id = data.get("crop_analysis", {}).get("crop_identification")
        self.assertIsNotNone(crop_id)
        self.assertTrue(crop_id["is_identified"])
        self.assertEqual(crop_id["crop_name"], "Soybean")
        self.assertIsNone(crop_id.get("message"))

        # Phase 3B Disease Model Routing & Response contract check
        disease_det = data.get("disease_detection")
        self.assertIsNotNone(disease_det)
        self.assertEqual(disease_det["crop"], "Soybean")
        self.assertIn("disease", disease_det)
        self.assertIsInstance(disease_det["confidence"], float)
        self.assertIn(disease_det["severity"], ["None", "Mild", "Moderate", "Severe"])
        self.assertNotEqual(disease_det["severity"], "Verified")
        self.assertIn(disease_det["status"], ["Healthy", "Diseased", "Needs expert verification"])
        self.assertIn("explanation", disease_det)
        self.assertIsInstance(disease_det["symptoms"], list)
        self.assertIsInstance(disease_det["recommended_actions"], list)
        self.assertIsInstance(disease_det["prevention"], list)
        self.assertIsInstance(disease_det["expert_verification_required"], bool)

    def test_scan_api_rice(self):
        """Test POST /api/scan integration and response contract for Rice image."""
        rice_file = self.images_dir / "crop_rice.jpg"
        with open(rice_file, "rb") as f:
            img_bytes = f.read()

        response = self.client.post(
            "/api/scan",
            files={"file": ("crop_rice.jpg", img_bytes, "image/jpeg")}
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "valid")

        # Phase 3A Crop Identification contract check
        crop_id = data.get("crop_analysis", {}).get("crop_identification")
        self.assertIsNotNone(crop_id)
        self.assertTrue(crop_id["is_identified"])
        self.assertEqual(crop_id["crop_name"], "Rice")
        self.assertIsNone(crop_id.get("message"))

        # Phase 3B Disease Model Routing & Response contract check
        disease_det = data.get("disease_detection")
        self.assertIsNotNone(disease_det)
        self.assertEqual(disease_det["crop"], "Rice")
        self.assertIn("disease", disease_det)
        self.assertIsInstance(disease_det["confidence"], float)
        self.assertIn(disease_det["severity"], ["None", "Mild", "Moderate", "Severe"])
        self.assertNotEqual(disease_det["severity"], "Verified")
        self.assertIn(disease_det["status"], ["Healthy", "Diseased", "Needs expert verification"])
        self.assertIn("explanation", disease_det)
        self.assertIsInstance(disease_det["symptoms"], list)
        self.assertIsInstance(disease_det["recommended_actions"], list)
        self.assertIsInstance(disease_det["prevention"], list)
        self.assertIsInstance(disease_det["expert_verification_required"], bool)

    def test_wheat_crop_inference(self):
        """Test Wheat disease inference and advisory payload."""
        wheat_file = self.images_dir / "crop_wheat.jpg"
        self.assertTrue(wheat_file.exists())

        with open(wheat_file, "rb") as f:
            img_bytes = f.read()

        res = predict_crop_disease("Wheat", img_bytes)
        self.assertEqual(res["crop"], "Wheat")
        self.assertIn("disease", res)
        self.assertIn("confidence", res)
        self.assertIn("explanation", res)
        self.assertIsInstance(res["symptoms"], list)

    def test_scan_api_cotton(self):
        """Test POST /api/scan integration with Cotton image."""
        cotton_file = self.images_dir / "crop_cotton.jpg"
        with open(cotton_file, "rb") as f:
            img_bytes = f.read()

        response = self.client.post(
            "/api/scan",
            files={"file": ("crop_cotton.jpg", img_bytes, "image/jpeg")}
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "valid")

        disease_det = data.get("disease_detection")
        self.assertIsNotNone(disease_det)
        self.assertEqual(disease_det["crop"], "Cotton")
        self.assertIn("disease", disease_det)
        self.assertIn("explanation", disease_det)

    def test_maize_crop_inference(self):
        """Test Maize disease inference and advisory payload."""
        maize_file = self.images_dir / "crop_maize.jpg"
        self.assertTrue(maize_file.exists())

        with open(maize_file, "rb") as f:
            img_bytes = f.read()

        res = predict_crop_disease("Maize", img_bytes)
        self.assertEqual(res["crop"], "Maize")
        self.assertIn("disease", res)
        self.assertIn("confidence", res)
        self.assertIn("explanation", res)
        self.assertIsInstance(res["symptoms"], list)

    def test_scan_api_wheat(self):
        """Test POST /api/scan integration with Wheat image."""
        wheat_file = self.images_dir / "crop_wheat.jpg"
        with open(wheat_file, "rb") as f:
            img_bytes = f.read()

        response = self.client.post(
            "/api/scan",
            files={"file": ("crop_wheat.jpg", img_bytes, "image/jpeg")}
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "valid")

        disease_det = data.get("disease_detection")
        self.assertIsNotNone(disease_det)
        self.assertEqual(disease_det["crop"], "Wheat")
        self.assertIn("disease", disease_det)
        self.assertIn("explanation", disease_det)

    def test_tomato_crop_inference(self):
        """Test Tomato disease inference and advisory payload."""
        tomato_file = self.images_dir / "crop_tomato.jpg"
        self.assertTrue(tomato_file.exists())

        with open(tomato_file, "rb") as f:
            img_bytes = f.read()

        res = predict_crop_disease("Tomato", img_bytes)
        self.assertEqual(res["crop"], "Tomato")
        self.assertIn("disease", res)
        self.assertIn("confidence", res)
        self.assertIn("explanation", res)
        self.assertIsInstance(res["symptoms"], list)

    def test_scan_api_maize(self):
        """Test POST /api/scan integration and response contract for Maize image."""
        maize_file = self.images_dir / "crop_maize.jpg"
        with open(maize_file, "rb") as f:
            img_bytes = f.read()

        response = self.client.post(
            "/api/scan",
            files={"file": ("crop_maize.jpg", img_bytes, "image/jpeg")}
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "valid")

        # Phase 3A Crop Identification contract check
        crop_id = data.get("crop_analysis", {}).get("crop_identification")
        self.assertIsNotNone(crop_id)
        self.assertTrue(crop_id["is_identified"])
        self.assertEqual(crop_id["crop_name"], "Maize")
        self.assertIsNone(crop_id.get("message"))

        # Phase 3B Disease Model Routing & Response contract check
        disease_det = data.get("disease_detection")
        self.assertIsNotNone(disease_det)
        self.assertEqual(disease_det["crop"], "Maize")
        self.assertIn("disease", disease_det)
        self.assertIsInstance(disease_det["confidence"], float)
        self.assertIn(disease_det["severity"], ["None", "Mild", "Moderate", "Severe"])
        self.assertNotEqual(disease_det["severity"], "Verified")
        self.assertIn(disease_det["status"], ["Healthy", "Diseased", "Needs expert verification"])
        self.assertIn("explanation", disease_det)
        self.assertIsInstance(disease_det["symptoms"], list)
        self.assertIsInstance(disease_det["recommended_actions"], list)
        self.assertIsInstance(disease_det["prevention"], list)
        self.assertIsInstance(disease_det["expert_verification_required"], bool)

    def test_chickpea_crop_inference(self):
        """Test Chickpea disease inference and advisory payload."""
        chickpea_file = self.images_dir / "crop_chickpea.jpg"
        self.assertTrue(chickpea_file.exists())

        with open(chickpea_file, "rb") as f:
            img_bytes = f.read()

        res = predict_crop_disease("Chickpea", img_bytes)
        self.assertEqual(res["crop"], "Chickpea")
        self.assertIn("disease", res)
        self.assertIn("confidence", res)
        self.assertIn("explanation", res)
        self.assertIsInstance(res["symptoms"], list)

    def test_scan_api_tomato(self):
        """Test POST /api/scan integration with Tomato image."""
        tomato_file = self.images_dir / "crop_tomato.jpg"
        with open(tomato_file, "rb") as f:
            img_bytes = f.read()

        response = self.client.post(
            "/api/scan",
            files={"file": ("crop_tomato.jpg", img_bytes, "image/jpeg")}
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "valid")

        disease_det = data.get("disease_detection")
        self.assertIsNotNone(disease_det)
        self.assertEqual(disease_det["crop"], "Tomato")
        self.assertIn("disease", disease_det)
        self.assertIn("explanation", disease_det)

    def test_scan_api_chickpea(self):
        """Test POST /api/scan integration with Chickpea image."""
        chickpea_file = self.images_dir / "crop_chickpea.jpg"
        with open(chickpea_file, "rb") as f:
            img_bytes = f.read()

        response = self.client.post(
            "/api/scan",
            files={"file": ("crop_chickpea.jpg", img_bytes, "image/jpeg")}
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "valid")

        disease_det = data.get("disease_detection")
        self.assertIsNotNone(disease_det)
        self.assertEqual(disease_det["crop"], "Chickpea")
        self.assertIn("disease", disease_det)
        self.assertIn("explanation", disease_det)


if __name__ == "__main__":
    unittest.main()



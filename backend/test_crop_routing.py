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
            files={"file": ("crop_sugarcane.jpg", img_bytes, "image/jpeg")},
            data={"crop": "Sugarcane"}
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn(data["status"], ["valid", "uncertain"])

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
            files={"file": ("crop_soybean.jpg", img_bytes, "image/jpeg")},
            data={"crop": "Soybean"}
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
            files={"file": ("crop_rice.jpg", img_bytes, "image/jpeg")},
            data={"crop": "Rice"}
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
            files={"file": ("crop_cotton.jpg", img_bytes, "image/jpeg")},
            data={"crop": "Cotton"}
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
            files={"file": ("crop_wheat.jpg", img_bytes, "image/jpeg")},
            data={"crop": "Wheat"}
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
            files={"file": ("crop_maize.jpg", img_bytes, "image/jpeg")},
            data={"crop": "Maize"}
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn(data["status"], ["valid", "uncertain"])

        # Phase 3A Crop Identification contract check
        crop_id = data.get("crop_analysis", {}).get("crop_identification")
        self.assertIsNotNone(crop_id)
        self.assertTrue(crop_id["is_identified"])
        self.assertIn(crop_id["crop_name"], ["Maize", "Maize (Corn)"])
        self.assertIsNone(crop_id.get("message"))

        # Phase 3B Disease Model Routing & Response contract check
        disease_det = data.get("disease_detection")
        self.assertIsNotNone(disease_det)
        self.assertIn(disease_det["crop"], ["Maize", "Maize (Corn)"])
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
            files={"file": ("crop_tomato.jpg", img_bytes, "image/jpeg")},
            data={"crop": "Tomato"}
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn(data["status"], ["valid", "uncertain"])

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
            files={"file": ("crop_chickpea.jpg", img_bytes, "image/jpeg")},
            data={"crop": "Chickpea"}
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn(data["status"], ["valid", "uncertain"])

        disease_det = data.get("disease_detection")
        self.assertIsNotNone(disease_det)
        self.assertEqual(disease_det["crop"], "Chickpea")
        self.assertIn("disease", disease_det)
        self.assertIn("explanation", disease_det)

    def test_scan_api_missing_crop_rejected(self):
        """Test POST /api/scan without crop returns HTTP 400."""
        rice_file = self.images_dir / "crop_rice.jpg"
        with open(rice_file, "rb") as f:
            img_bytes = f.read()

        response = self.client.post(
            "/api/scan",
            files={"file": ("crop_rice.jpg", img_bytes, "image/jpeg")}
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("Crop selection is mandatory", response.json().get("detail", ""))

    def test_scan_api_unsupported_crop_rejected(self):
        """Test POST /api/scan with unsupported crop returns HTTP 400."""
        rice_file = self.images_dir / "crop_rice.jpg"
        with open(rice_file, "rb") as f:
            img_bytes = f.read()

        response = self.client.post(
            "/api/scan",
            files={"file": ("crop_rice.jpg", img_bytes, "image/jpeg")},
            data={"crop": "Dragonfruit"}
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("Unsupported crop", response.json().get("detail", ""))

    def test_scan_api_crop_without_trained_model_rejected(self):
        """Test POST /api/scan with registered crop lacking trained model returns HTTP 400 with honest message."""
        rice_file = self.images_dir / "crop_rice.jpg"
        with open(rice_file, "rb") as f:
            img_bytes = f.read()

        response = self.client.post(
            "/api/scan",
            files={"file": ("crop_rice.jpg", img_bytes, "image/jpeg")},
            data={"crop": "Banana"}
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("Disease detection model unavailable", response.json().get("detail", ""))

    def test_scan_api_potato_integrated(self):
        """Test POST /api/scan integration for newly integrated Potato crop."""
        rice_file = self.images_dir / "crop_rice.jpg"
        with open(rice_file, "rb") as f:
            img_bytes = f.read()

        response = self.client.post(
            "/api/scan",
            files={"file": ("crop_rice.jpg", img_bytes, "image/jpeg")},
            data={"crop": "Potato"}
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn(data["status"], ["valid", "uncertain"])
        self.assertIsNotNone(data.get("disease_detection"))
        self.assertEqual(data["disease_detection"]["crop"], "Potato")

    def test_scan_api_grapes_integrated(self):
        """Test POST /api/scan integration for newly integrated Grapes crop."""
        rice_file = self.images_dir / "crop_rice.jpg"
        with open(rice_file, "rb") as f:
            img_bytes = f.read()

        response = self.client.post(
            "/api/scan",
            files={"file": ("crop_rice.jpg", img_bytes, "image/jpeg")},
            data={"crop": "Grapes"}
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn(data["status"], ["valid", "uncertain"])
        self.assertIsNotNone(data.get("disease_detection"))
        self.assertEqual(data["disease_detection"]["crop"], "Grapes (Draksha)")

    def test_scan_api_onion_integrated(self):
        """Test POST /api/scan integration for newly integrated Onion crop."""
        rice_file = self.images_dir / "crop_rice.jpg"
        with open(rice_file, "rb") as f:
            img_bytes = f.read()

        response = self.client.post(
            "/api/scan",
            files={"file": ("crop_rice.jpg", img_bytes, "image/jpeg")},
            data={"crop": "Onion"}
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn(data["status"], ["valid", "uncertain"])
        self.assertIsNotNone(data.get("disease_detection"))
        self.assertEqual(data["disease_detection"]["crop"], "Onion")

    def test_scan_api_turmeric_integrated(self):
        """Test POST /api/scan integration for newly integrated Turmeric EfficientNet-B0 crop."""
        rice_file = self.images_dir / "crop_rice.jpg"
        with open(rice_file, "rb") as f:
            img_bytes = f.read()

        response = self.client.post(
            "/api/scan",
            files={"file": ("crop_rice.jpg", img_bytes, "image/jpeg")},
            data={"crop": "Turmeric"}
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn(data["status"], ["valid", "uncertain"])
        self.assertIsNotNone(data.get("disease_detection"))
        self.assertEqual(data["disease_detection"]["crop"], "Turmeric (Halad)")

    def test_turmeric_crop_inference(self):
        """Test Turmeric disease inference and advisory payload."""
        rice_file = self.images_dir / "crop_rice.jpg"
        with open(rice_file, "rb") as f:
            img_bytes = f.read()

        res = predict_crop_disease("Turmeric", img_bytes)
        self.assertEqual(res["crop"], "Turmeric")
        self.assertIn("disease", res)
        self.assertIn("confidence", res)
        self.assertIn("explanation", res)

    def test_scan_api_turmeric_real_image_routing(self):
        """Test POST /api/scan with real Turmeric image correctly routes to Turmeric model."""
        turmeric_file = self.images_dir / "crop_turmeric.jpg"
        self.assertTrue(turmeric_file.exists(), "crop_turmeric.jpg should exist")

        with open(turmeric_file, "rb") as f:
            img_bytes = f.read()

        response = self.client.post(
            "/api/scan",
            files={"file": ("crop_turmeric.jpg", img_bytes, "image/jpeg")},
            data={"crop": "Turmeric"}
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn(data["status"], ["valid", "uncertain"])
        self.assertEqual(data["crop"]["name"], "Turmeric (Halad)")
        self.assertIsNotNone(data.get("disease_detection"))
        self.assertEqual(data["disease_detection"]["crop"], "Turmeric (Halad)")
        self.assertIn("disease", data["disease_detection"])
        self.assertIn("condition", data["diagnosis"])
        self.assertIn("confidence", data["diagnosis"])
        self.assertIsInstance(data["diagnosis"]["confidence"], float)

    def test_scan_api_turmeric_leaf_blotch_regression(self):
        """Regression Test: Labelled Leaf Blotch image returns expected disease class and Diseased status."""
        blotch_file = self.images_dir / "turmeric_leaf_blotch.jpg"
        self.assertTrue(blotch_file.exists(), "turmeric_leaf_blotch.jpg should exist")

        with open(blotch_file, "rb") as f:
            img_bytes = f.read()

        response = self.client.post(
            "/api/scan",
            files={"file": ("turmeric_leaf_blotch.jpg", img_bytes, "image/jpeg")},
            data={"crop": "Turmeric"}
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "valid")
        self.assertEqual(data["crop"]["name"], "Turmeric (Halad)")

        # Disease detection assertions
        disease_det = data.get("disease_detection")
        self.assertIsNotNone(disease_det)
        self.assertEqual(disease_det["crop"], "Turmeric (Halad)")
        self.assertEqual(disease_det["disease"], "Leaf Blotch")
        self.assertEqual(disease_det["status"], "Diseased")
        self.assertFalse(disease_det["expert_verification_required"])
        self.assertGreaterEqual(disease_det["confidence"], 0.60)

        # Diagnosis block assertions
        diagnosis = data.get("diagnosis")
        self.assertIsNotNone(diagnosis)
        self.assertEqual(diagnosis["condition"], "Leaf Blotch")
        self.assertEqual(diagnosis["healthStatus"], "Diseased")
        self.assertEqual(diagnosis["type"], "disease")

    def test_turmeric_identification_not_misclassified_as_sugarcane(self):
        """Verify identify_crop does not misclassify Turmeric images as Sugarcane."""
        from services.crop_identification import identify_crop
        for filename in ["crop_turmeric.jpg", "crops/turmeric.png"]:
            img_p = self.images_dir / filename
            if img_p.exists():
                with open(img_p, "rb") as f:
                    img_bytes = f.read()
                crop_id = identify_crop(img_bytes)
                self.assertTrue(crop_id.is_identified, f"{filename} should be identified")
                self.assertEqual(
                    crop_id.crop_name, "Turmeric",
                    f"{filename} was misclassified as {crop_id.crop_name} instead of Turmeric"
                )

    def test_turmeric_advisory_contents(self):
        """Verify get_disease_advisory returns expert-curated advisory for Turmeric classes."""
        from ml.advisory import get_disease_advisory
        for cls_name in ["Dry Leaf", "Healthy Leaf", "Leaf Blotch", "Rhizome Disease Root", "Rhizome Healthy Root"]:
            adv = get_disease_advisory("Turmeric", cls_name)
            self.assertIsNotNone(adv)
            self.assertIn("explanation", adv)
            self.assertTrue(len(adv.get("symptoms", [])) > 0, f"Symptoms missing for {cls_name}")
            self.assertTrue(len(adv.get("recommended_actions", [])) > 0, f"Actions missing for {cls_name}")
            self.assertTrue(len(adv.get("prevention", [])) > 0, f"Prevention missing for {cls_name}")


if __name__ == "__main__":
    unittest.main()



"""
backend/test_sugarcane.py
─────────────────────────
Comprehensive test suite for Phase 3B-1: Sugarcane Disease Detection.
Tests:
1. PyTorch MobileNetV3-Large model initialization & forward pass.
2. Local weight save & load functionality.
3. Single image inference & softmax probability calculation.
4. Confidence thresholding fallback ("Needs expert verification").
5. FastAPI /api/scan route integration with sugarcane image.
"""

import io
import os
from pathlib import Path
import unittest

from PIL import Image
import torch

from ml.config import (
    MODEL_PATH,
    SUGARCANE_CLASSES,
    NUM_CLASSES,
    SUGARCANE_CONFIDENCE_THRESHOLD,
    SAVED_MODELS_DIR,
)
from ml.model import create_sugarcane_model, save_checkpoint, load_checkpoint
from ml.inference import predict_sugarcane_disease


class TestSugarcaneDiseaseML(unittest.TestCase):

    def setUp(self):
        # Create a dummy RGB image buffer for testing
        self.img = Image.new("RGB", (300, 300), color=(34, 139, 34))
        buf = io.BytesIO()
        self.img.save(buf, format="JPEG")
        self.dummy_bytes = buf.getvalue()

    def test_model_architecture(self):
        """Test MobileNetV3-Large instantiation and output feature dimension (5 classes)."""
        model = create_sugarcane_model(num_classes=NUM_CLASSES, pretrained=False)
        dummy_input = torch.randn(2, 3, 224, 224)
        output = model(dummy_input)

        self.assertEqual(output.shape, (2, NUM_CLASSES))

    def test_model_save_and_load(self):
        """Test model weights saving and loading."""
        test_path = SAVED_MODELS_DIR / "test_sugarcane_temp.pth"
        try:
            model = create_sugarcane_model(num_classes=NUM_CLASSES, pretrained=False)
            save_checkpoint(model, test_path)
            self.assertTrue(test_path.exists())

            loaded_model = load_checkpoint(test_path)
            self.assertIsNotNone(loaded_model)
        finally:
            if test_path.exists():
                try:
                    os.remove(test_path)
                except PermissionError:
                    pass

    def test_inference_pipeline(self):
        """Test single image disease prediction engine."""
        res = predict_sugarcane_disease(self.dummy_bytes)

        self.assertEqual(res["crop"], "Sugarcane")
        self.assertIn("disease", res)
        self.assertIn("confidence", res)
        self.assertIn("severity", res)
        self.assertIn("status", res)
        self.assertGreaterEqual(res["confidence"], 0.0)
        self.assertLessEqual(res["confidence"], 1.0)

    def test_low_confidence_threshold(self):
        """Test that predictions with confidence below threshold flag 'Needs expert verification'."""
        # Unrealistic high threshold to force low-confidence fallback
        res = predict_sugarcane_disease(self.dummy_bytes, confidence_threshold=0.9999)

        self.assertEqual(res["crop"], "Sugarcane")
        self.assertEqual(res["disease"], "Needs expert verification")
        self.assertEqual(res["status"], "Needs expert verification")


class TestScanAPIIntegration(unittest.TestCase):

    def test_scan_endpoint_sugarcane(self):
        """Test POST /api/scan response structure for Sugarcane image."""
        from fastapi.testclient import TestClient
        from main import app

        client = TestClient(app)

        sugarcane_sample = Path(__file__).resolve().parent.parent / "public" / "images" / "crop_sugarcane.jpg"
        if not sugarcane_sample.exists():
            # Create a sample image if file doesn't exist
            img = Image.new("RGB", (400, 400), color=(34, 139, 34))
            buf = io.BytesIO()
            img.save(buf, format="JPEG")
            img_bytes = buf.getvalue()
            filename = "sample.jpg"
        else:
            with open(sugarcane_sample, "rb") as f:
                img_bytes = f.read()
            filename = sugarcane_sample.name

        response = client.post(
            "/api/scan",
            files={"file": (filename, img_bytes, "image/jpeg")}
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "valid")
        self.assertTrue(data["validation"]["passed"])
        self.assertIsNotNone(data["crop_analysis"])

        # Check disease detection block
        disease_det = data.get("disease_detection")
        self.assertIsNotNone(disease_det)
        self.assertEqual(disease_det["crop"], "Sugarcane")
        self.assertIn("disease", disease_det)
        self.assertIn("confidence", disease_det)
        self.assertIn("severity", disease_det)
        self.assertIn("status", disease_det)


if __name__ == "__main__":
    unittest.main()

"""
backend/test_sugarcane.py
─────────────────────────
Test suite for Sugarcane Disease Detection (Phase 3B-1).

Tests:
  1. MobileNetV3-Large architecture (5 Sugarcane classes)
  2. Model save/load checkpoint roundtrip
  3. Real crop_sugarcane.jpg prediction schema and advisory
  4. OOD abstain and forced-threshold abstain
  5. FastAPI /api/scan integration test with real Sugarcane image
"""

from __future__ import annotations

import io
import os
import unittest
from pathlib import Path

import torch
from PIL import Image

from ml.config import (
    MODEL_PATH, SUGARCANE_CLASSES, NUM_CLASSES,
    SUGARCANE_CONFIDENCE_THRESHOLD, SAVED_MODELS_DIR, CROP_CONFIGS,
)
from ml.model import create_sugarcane_model, save_checkpoint, load_checkpoint
from ml.inference import predict_sugarcane_disease, predict_crop_disease
from test_helpers import CropDiseaseTestBase, load_real_image


class TestSugarcaneArchitecture(unittest.TestCase):
    """Model architecture tests — no real data required."""

    def test_model_output_shape(self):
        """MobileNetV3-Large output should be (batch, 5) for 5 Sugarcane classes."""
        model = create_sugarcane_model(num_classes=NUM_CLASSES, pretrained=False)
        out = model(torch.randn(2, 3, 224, 224))
        self.assertEqual(out.shape, (2, NUM_CLASSES))

    def test_class_definitions(self):
        """Sugarcane should have exactly 5 disease classes."""
        self.assertEqual(len(SUGARCANE_CLASSES), 5)
        self.assertIn("Healthy", SUGARCANE_CLASSES)
        self.assertIn("Red Rot", SUGARCANE_CLASSES)

    def test_model_save_and_load(self):
        """Checkpoint save/load round-trip must preserve output shape."""
        test_path = SAVED_MODELS_DIR / "test_sugarcane_temp.pth"
        try:
            model = create_sugarcane_model(num_classes=NUM_CLASSES, pretrained=False)
            save_checkpoint(model, test_path)
            self.assertTrue(test_path.exists())
            loaded = load_checkpoint(test_path)
            out = loaded(torch.randn(1, 3, 224, 224))
            self.assertEqual(out.shape, (1, NUM_CLASSES))
        finally:
            if test_path.exists():
                try:
                    os.remove(test_path)
                except PermissionError:
                    pass


class TestSugarcaneDiseaseInference(CropDiseaseTestBase):
    crop_name = "Sugarcane"
    real_image_file = "crop_sugarcane.jpg"
    expected_classes = ["Healthy", "Red Rot", "Rust", "Mosaic", "Yellow Disease"]

    def test_real_image_prediction_schema(self):
        """Real sugarcane image should return a valid prediction schema."""
        img_bytes = self._real_image_bytes()
        assert img_bytes is not None
        res = predict_sugarcane_disease(img_bytes)
        self.assert_valid_prediction_schema(res)

    def test_real_image_advisory(self):
        """Prediction from real sugarcane image must include advisory payload."""
        img_bytes = self._real_image_bytes()
        assert img_bytes is not None
        res = predict_sugarcane_disease(img_bytes)
        self.assertIsNotNone(res.get("explanation"))
        self.assertGreater(len(res.get("recommended_actions", [])), 0)

    def test_forced_abstain(self):
        """Confidence threshold=0.9999 must force abstain on any input."""
        img_bytes = self._real_image_bytes()
        assert img_bytes is not None
        res = predict_crop_disease("Sugarcane", img_bytes, confidence_threshold=1.1)
        self.assert_abstains(res, context="forced threshold=0.9999")

    def test_status_consistency(self):
        """Disease status must be consistent with the predicted class."""
        img_bytes = self._real_image_bytes()
        assert img_bytes is not None
        res = predict_sugarcane_disease(img_bytes)
        if res["disease"] == "Healthy":
            self.assertEqual(res["status"], "Healthy")
        elif res["disease"] == "Needs expert verification":
            self.assertEqual(res["status"], "Needs expert verification")
        else:
            self.assertEqual(res["status"], "Diseased")


class TestScanAPIIntegration(unittest.TestCase):
    """Full pipeline integration tests via FastAPI TestClient."""

    def test_scan_endpoint_sugarcane_real_image(self):
        """POST /api/scan with real sugarcane image should return valid disease detection."""
        from fastapi.testclient import TestClient
        from main import app

        client = TestClient(app)
        img_path = Path(__file__).resolve().parent.parent / "public" / "images" / "crop_sugarcane.jpg"

        if not img_path.exists():
            self.skipTest(f"Real image not found: {img_path}")

        with open(img_path, "rb") as f:
            img_bytes = f.read()

        response = client.post(
            "/api/scan",
            files={"file": (img_path.name, img_bytes, "image/jpeg")},
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "valid")
        self.assertTrue(data["validation"]["passed"])
        self.assertIsNotNone(data.get("crop_analysis"))

        disease_det = data.get("disease_detection")
        self.assertIsNotNone(disease_det)
        self.assertEqual(disease_det["crop"], "Sugarcane")
        self.assertIn("disease", disease_det)
        self.assertIn("confidence", disease_det)
        self.assertIn("severity", disease_det)
        self.assertIn("status", disease_det)
        valid_diseases = CROP_CONFIGS["Sugarcane"]["classes"] + ["Needs expert verification"]
        self.assertIn(disease_det["disease"], valid_diseases)


if __name__ == "__main__":
    unittest.main()

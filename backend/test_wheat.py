"""
backend/test_wheat.py
─────────────────────
Test suite for Wheat Disease Detection.

Tests:
  1. Model architecture (5 classes)
  2. Real crop_wheat.jpg prediction schema and advisory
  3. Forced abstain via extreme confidence threshold
  4. Status consistency
"""

import unittest
import torch

from ml.config import CROP_CONFIGS
from ml.model import create_crop_model
from ml.inference import predict_crop_disease
from test_helpers import CropDiseaseTestBase


class TestWheatArchitecture(unittest.TestCase):

    def test_model_output_shape(self):
        """MobileNetV3 should output (batch, 5) for 5 Wheat classes."""
        classes = CROP_CONFIGS["Wheat"]["classes"]
        self.assertEqual(len(classes), 5)
        self.assertIn("Healthy", classes)
        self.assertIn("Brown Rust", classes)
        model = create_crop_model(num_classes=5, pretrained=False)
        out = model(torch.randn(2, 3, 224, 224))
        self.assertEqual(out.shape, (2, 5))


class TestWheatDiseaseInference(CropDiseaseTestBase):
    crop_name = "Wheat"
    real_image_file = "crop_wheat.jpg"
    expected_classes = ["Healthy", "Brown Rust", "Yellow Rust", "Powdery Mildew", "Septoria"]

    def test_real_image_prediction_schema(self):
        """Real wheat image must yield a valid prediction schema."""
        img = self._real_image_bytes()
        assert img is not None
        res = predict_crop_disease("Wheat", img)
        self.assert_valid_prediction_schema(res)

    def test_real_image_advisory_completeness(self):
        """Prediction must include non-empty advisory payload."""
        img = self._real_image_bytes()
        assert img is not None
        res = predict_crop_disease("Wheat", img)
        self.assertIsNotNone(res.get("explanation"))
        self.assertIsInstance(res["symptoms"], list)
        self.assertIsInstance(res["recommended_actions"], list)

    def test_forced_abstain(self):
        """Confidence threshold=0.9999 must always trigger abstain."""
        img = self._real_image_bytes()
        assert img is not None
        res = predict_crop_disease("Wheat", img, confidence_threshold=1.1)
        self.assert_abstains(res, context="forced threshold=0.9999")

    def test_status_consistency(self):
        """Status must be logically consistent with the predicted disease."""
        img = self._real_image_bytes()
        assert img is not None
        res = predict_crop_disease("Wheat", img)
        if res["disease"] == "Healthy":
            self.assertEqual(res["status"], "Healthy")
        elif res["disease"] == "Needs expert verification":
            self.assertEqual(res["status"], "Needs expert verification")
        else:
            self.assertEqual(res["status"], "Diseased")


if __name__ == "__main__":
    unittest.main()

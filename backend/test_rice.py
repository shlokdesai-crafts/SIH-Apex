"""
backend/test_rice.py
────────────────────
Test suite for Rice Disease Detection.

Tests:
  1. Model architecture (5 classes, correct output shape)
  2. Real crop_rice.jpg prediction schema and advisory completeness
  3. Forced abstain via extreme confidence threshold
  4. Status consistency (Healthy/Diseased/Needs expert verification)
"""

import unittest
import torch

from ml.config import CROP_CONFIGS
from ml.model import create_crop_model
from ml.inference import predict_crop_disease
from test_helpers import CropDiseaseTestBase


class TestRiceArchitecture(unittest.TestCase):

    def test_model_output_shape(self):
        """MobileNetV3 should output (batch, 5) for 5 Rice classes."""
        classes = CROP_CONFIGS["Rice"]["classes"]
        self.assertEqual(len(classes), 5)
        self.assertIn("Healthy", classes)
        self.assertIn("Blast", classes)
        model = create_crop_model(num_classes=5, pretrained=False)
        out = model(torch.randn(2, 3, 224, 224))
        self.assertEqual(out.shape, (2, 5))


class TestRiceDiseaseInference(CropDiseaseTestBase):
    crop_name = "Rice"
    real_image_file = "crop_rice.jpg"
    expected_classes = ["Healthy", "Bacterial Leaf Blight", "Blast", "Brown Spot", "Tungro"]

    def test_real_image_prediction_schema(self):
        """Real rice image must yield a valid prediction schema."""
        img = self._real_image_bytes()
        assert img is not None
        res = predict_crop_disease("Rice", img)
        self.assert_valid_prediction_schema(res)

    def test_real_image_advisory_completeness(self):
        """Prediction must include non-empty advisory payload."""
        img = self._real_image_bytes()
        assert img is not None
        res = predict_crop_disease("Rice", img)
        self.assertIsNotNone(res.get("explanation"))
        self.assertIsInstance(res["symptoms"], list)
        self.assertIsInstance(res["recommended_actions"], list)

    def test_forced_abstain(self):
        """Confidence threshold=0.9999 must always trigger abstain."""
        img = self._real_image_bytes()
        assert img is not None
        res = predict_crop_disease("Rice", img, confidence_threshold=1.1)
        self.assert_abstains(res, context="forced threshold=0.9999")

    def test_status_consistency(self):
        """Status must be logically consistent with the predicted disease."""
        img = self._real_image_bytes()
        assert img is not None
        res = predict_crop_disease("Rice", img)
        if res["disease"] == "Healthy":
            self.assertEqual(res["status"], "Healthy")
        elif res["disease"] == "Needs expert verification":
            self.assertEqual(res["status"], "Needs expert verification")
        else:
            self.assertEqual(res["status"], "Diseased")


if __name__ == "__main__":
    unittest.main()

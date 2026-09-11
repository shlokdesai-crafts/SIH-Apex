"""
backend/test_cotton.py
──────────────────────
Test suite for Cotton Disease Detection.
"""

import unittest
import torch

from ml.config import CROP_CONFIGS
from ml.model import create_crop_model
from ml.inference import predict_crop_disease
from test_helpers import CropDiseaseTestBase


class TestCottonArchitecture(unittest.TestCase):

    def test_model_output_shape(self):
        classes = CROP_CONFIGS["Cotton"]["classes"]
        self.assertEqual(len(classes), 5)
        self.assertIn("Healthy", classes)
        model = create_crop_model(num_classes=5, pretrained=False)
        out = model(torch.randn(2, 3, 224, 224))
        self.assertEqual(out.shape, (2, 5))


class TestCottonDiseaseInference(CropDiseaseTestBase):
    crop_name = "Cotton"
    real_image_file = "crop_cotton.jpg"
    expected_classes = ["Healthy", "Bacterial Blight", "Curl Virus", "Fusarium Wilt", "Target Spot"]

    def test_real_image_prediction_schema(self):
        img = self._real_image_bytes()
        assert img is not None
        res = predict_crop_disease("Cotton", img)
        self.assert_valid_prediction_schema(res)

    def test_real_image_advisory_completeness(self):
        img = self._real_image_bytes()
        assert img is not None
        res = predict_crop_disease("Cotton", img)
        self.assertIsNotNone(res.get("explanation"))
        self.assertIsInstance(res["symptoms"], list)
        self.assertIsInstance(res["recommended_actions"], list)

    def test_forced_abstain(self):
        """Confidence threshold above 1.0 must always trigger abstain (catches even confidence=1.0)."""
        img = self._real_image_bytes()
        assert img is not None
        res = predict_crop_disease("Cotton", img, confidence_threshold=1.1)
        self.assert_abstains(res, context="forced threshold=1.1")

    def test_status_consistency(self):
        img = self._real_image_bytes()
        assert img is not None
        res = predict_crop_disease("Cotton", img)
        if res["disease"] == "Healthy":
            self.assertEqual(res["status"], "Healthy")
        elif res["disease"] == "Needs expert verification":
            self.assertEqual(res["status"], "Needs expert verification")
        else:
            self.assertEqual(res["status"], "Diseased")


if __name__ == "__main__":
    unittest.main()

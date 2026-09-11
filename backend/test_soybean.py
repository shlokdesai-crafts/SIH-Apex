"""
backend/test_soybean.py
───────────────────────
Test suite for Soybean Disease Detection.
"""

import unittest
import torch

from ml.config import CROP_CONFIGS
from ml.model import create_crop_model
from ml.inference import predict_crop_disease
from test_helpers import CropDiseaseTestBase


class TestSoybeanArchitecture(unittest.TestCase):

    def test_model_output_shape(self):
        classes = CROP_CONFIGS["Soybean"]["classes"]
        self.assertEqual(len(classes), 5)
        self.assertIn("Healthy", classes)
        model = create_crop_model(num_classes=5, pretrained=False)
        out = model(torch.randn(2, 3, 224, 224))
        self.assertEqual(out.shape, (2, 5))


class TestSoybeanDiseaseInference(CropDiseaseTestBase):
    crop_name = "Soybean"
    real_image_file = "crop_soybean.jpg"
    expected_classes = ["Healthy", "Cercospora Leaf Blight", "Frogeye Leaf Spot", "Rust", "Yellow Mosaic"]

    def test_real_image_prediction_schema(self):
        img = self._real_image_bytes()
        assert img is not None
        res = predict_crop_disease("Soybean", img)
        self.assert_valid_prediction_schema(res)

    def test_real_image_advisory_completeness(self):
        img = self._real_image_bytes()
        assert img is not None
        res = predict_crop_disease("Soybean", img)
        self.assertIsNotNone(res.get("explanation"))
        self.assertIsInstance(res["symptoms"], list)
        self.assertIsInstance(res["recommended_actions"], list)

    def test_forced_abstain(self):
        img = self._real_image_bytes()
        assert img is not None
        res = predict_crop_disease("Soybean", img, confidence_threshold=1.1)
        self.assert_abstains(res, context="forced threshold=0.9999")

    def test_status_consistency(self):
        img = self._real_image_bytes()
        assert img is not None
        res = predict_crop_disease("Soybean", img)
        if res["disease"] == "Healthy":
            self.assertEqual(res["status"], "Healthy")
        elif res["disease"] == "Needs expert verification":
            self.assertEqual(res["status"], "Needs expert verification")
        else:
            self.assertEqual(res["status"], "Diseased")


if __name__ == "__main__":
    unittest.main()

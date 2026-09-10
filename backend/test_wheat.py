"""
backend/test_wheat.py
─────────────────────
Test suite for Wheat Disease Detection (CerealConv benchmark dataset).
Verifies:
1. MobileNetV3-Large model initialization for 5 Wheat classes.
2. Single image inference and softmax probability calculation.
3. Extended advisory payload (explanation, symptoms, recommended_actions, prevention).
4. Configurable thresholding and expert verification flag.
"""

import io
import unittest
from PIL import Image
import torch

from ml.config import CROP_CONFIGS
from ml.model import create_crop_model
from ml.inference import predict_crop_disease


class TestWheatDiseaseML(unittest.TestCase):

    def setUp(self):
        # Create a sample RGB image buffer
        self.img = Image.new("RGB", (300, 300), color=(35, 145, 35))
        buf = io.BytesIO()
        self.img.save(buf, format="JPEG")
        self.dummy_bytes = buf.getvalue()

    def test_wheat_model_architecture(self):
        """Test MobileNetV3 model instantiation for 5 Wheat classes."""
        classes = CROP_CONFIGS["Wheat"]["classes"]
        self.assertEqual(len(classes), 5)
        self.assertEqual(classes, ["Healthy", "Brown Rust", "Yellow Rust", "Powdery Mildew", "Septoria"])

        model = create_crop_model(num_classes=len(classes), pretrained=False)
        dummy_input = torch.randn(2, 3, 224, 224)
        output = model(dummy_input)
        self.assertEqual(output.shape, (2, 5))

    def test_wheat_inference_and_advisory(self):
        """Test single image disease prediction engine and advisory payload for Wheat."""
        res = predict_crop_disease("Wheat", self.dummy_bytes)

        self.assertEqual(res["crop"], "Wheat")
        self.assertIn("disease", res)
        self.assertIn(res["disease"], CROP_CONFIGS["Wheat"]["classes"] + ["Needs expert verification"])
        self.assertIn("confidence", res)
        self.assertIn("severity", res)
        self.assertIn("status", res)
        self.assertIn("explanation", res)
        self.assertIsInstance(res["symptoms"], list)
        self.assertIsInstance(res["recommended_actions"], list)
        self.assertIsInstance(res["prevention"], list)
        self.assertIn("expert_verification_required", res)

    def test_wheat_low_confidence_fallback(self):
        """Test that unconfident wheat predictions trigger expert verification flag."""
        res = predict_crop_disease("Wheat", self.dummy_bytes, confidence_threshold=0.9999)

        self.assertEqual(res["crop"], "Wheat")
        self.assertEqual(res["disease"], "Needs expert verification")
        self.assertEqual(res["status"], "Needs expert verification")
        self.assertTrue(res["expert_verification_required"])


if __name__ == "__main__":
    unittest.main()

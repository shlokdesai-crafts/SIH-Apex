"""
backend/test_tomato.py
──────────────────────
Test suite for Tomato Disease Detection.
Verifies:
1. MobileNetV3-Large model initialization for 5 Tomato classes.
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


class TestTomatoDiseaseML(unittest.TestCase):

    def setUp(self):
        # Create a sample RGB image buffer
        self.img = Image.new("RGB", (300, 300), color=(35, 140, 35))
        buf = io.BytesIO()
        self.img.save(buf, format="JPEG")
        self.dummy_bytes = buf.getvalue()

    def test_tomato_model_architecture(self):
        """Test MobileNetV3 model instantiation for 5 Tomato classes."""
        classes = CROP_CONFIGS["Tomato"]["classes"]
        self.assertEqual(len(classes), 5)
        self.assertEqual(classes, ["Healthy", "Bacterial Spot", "Early Blight", "Late Blight", "Yellow Leaf Curl Virus"])

        model = create_crop_model(num_classes=len(classes), pretrained=False)
        dummy_input = torch.randn(2, 3, 224, 224)
        output = model(dummy_input)
        self.assertEqual(output.shape, (2, 5))

    def test_tomato_inference_and_advisory(self):
        """Test single image disease prediction engine and advisory payload for Tomato."""
        res = predict_crop_disease("Tomato", self.dummy_bytes)

        self.assertEqual(res["crop"], "Tomato")
        self.assertIn("disease", res)
        self.assertIn(res["disease"], CROP_CONFIGS["Tomato"]["classes"] + ["Needs expert verification"])
        self.assertIn("confidence", res)
        self.assertIn("severity", res)
        self.assertIn("status", res)
        self.assertIn("explanation", res)
        self.assertIsInstance(res["symptoms"], list)
        self.assertIsInstance(res["recommended_actions"], list)
        self.assertIsInstance(res["prevention"], list)
        self.assertIn("expert_verification_required", res)

    def test_tomato_low_confidence_fallback(self):
        """Test that unconfident tomato predictions trigger expert verification flag."""
        res = predict_crop_disease("Tomato", self.dummy_bytes, confidence_threshold=1.0001)

        self.assertEqual(res["crop"], "Tomato")
        self.assertEqual(res["disease"], "Needs expert verification")
        self.assertEqual(res["status"], "Needs expert verification")
        self.assertTrue(res["expert_verification_required"])


if __name__ == "__main__":
    unittest.main()

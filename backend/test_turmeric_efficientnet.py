"""
backend/test_turmeric_efficientnet.py
─────────────────────────────────────
Verification test suite for Turmeric EfficientNet-B0 model integration.
Verifies:
1. Turmeric EfficientNet-B0 model loads successfully via load_crop_checkpoint.
2. Model classifier output layer has exactly 5 classes.
3. Provenance metadata is loaded and verified_real is True.
4. Turmeric configuration in CROP_CONFIGS has the exact 5 trained classes in exact order.
5. Turmeric disease prediction and adapter run without crashing.
6. Existing crop models (Sugarcane, Onion, Potato) continue loading with MobileNetV3 architecture.
"""

import io
import sys
import unittest
from pathlib import Path
from PIL import Image
import torch
import torchvision.models as models

# Ensure backend directory is in sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from ml.config import CROP_CONFIGS, SAVED_MODELS_DIR
from ml.model import create_crop_model, load_crop_checkpoint
from ml.inference import predict_crop_disease
from ml.registry import get_model_adapter


class TestTurmericEfficientNetIntegration(unittest.TestCase):

    def setUp(self):
        # Create a sample test image
        self.img = Image.new("RGB", (224, 224), color=(34, 139, 34))
        buf = io.BytesIO()
        self.img.save(buf, format="JPEG")
        self.img_bytes = buf.getvalue()

    def test_turmeric_config_exact_classes_and_order(self):
        """Verifies Turmeric config uses the exact trained class names and exact order."""
        turmeric_cfg = CROP_CONFIGS.get("Turmeric")
        self.assertIsNotNone(turmeric_cfg)

        expected_classes = [
            "Dry Leaf",
            "Healthy Leaf",
            "Leaf Blotch",
            "Rhizome Disease Root",
            "Rhizome Healthy Root",
        ]
        self.assertEqual(turmeric_cfg["classes"], expected_classes)
        self.assertEqual(len(turmeric_cfg["classes"]), 5)
        self.assertEqual(
            turmeric_cfg["model_path"],
            SAVED_MODELS_DIR / "turmeric_efficientnet_b0.pth"
        )
        self.assertEqual(turmeric_cfg.get("architecture"), "EfficientNet-B0")

    def test_turmeric_factory_creates_efficientnet_b0(self):
        """Verifies create_crop_model for Turmeric creates EfficientNet-B0 with 5 output classes."""
        model = create_crop_model(num_classes=5, pretrained=False, architecture="efficientnet_b0")
        self.assertIsInstance(model, models.EfficientNet)
        self.assertIsInstance(model.classifier[1], torch.nn.Linear)
        self.assertEqual(model.classifier[1].out_features, 5)
        self.assertEqual(model.classifier[1].in_features, 1280)

        # Test forward pass with dummy tensor
        dummy_input = torch.randn(1, 3, 224, 224)
        output = model(dummy_input)
        self.assertEqual(output.shape, (1, 5))

    def test_turmeric_model_checkpoint_loading(self):
        """Verifies turmeric_efficientnet_b0.pth loads successfully and preserves 5 classes."""
        model_path = SAVED_MODELS_DIR / "turmeric_efficientnet_b0.pth"
        self.assertTrue(model_path.exists(), f"Model file missing at {model_path}")

        model = load_crop_checkpoint(model_path, num_classes=5)
        self.assertIsInstance(model, models.EfficientNet)
        self.assertEqual(model.classifier[1].out_features, 5)
        self.assertTrue(getattr(model, "is_verified_real", False))

    def test_turmeric_adapter_and_inference(self):
        """Verifies LocalTorchModelAdapter and predict_crop_disease work for Turmeric without crashing."""
        adapter = get_model_adapter("Turmeric")
        self.assertIsNotNone(adapter)
        classes = adapter.get_classes()
        self.assertEqual(len(classes), 5)
        self.assertEqual(classes[0], "Dry Leaf")
        self.assertEqual(classes[1], "Healthy Leaf")
        self.assertEqual(classes[2], "Leaf Blotch")
        self.assertEqual(classes[3], "Rhizome Disease Root")
        self.assertEqual(classes[4], "Rhizome Healthy Root")

        meta = adapter.get_model_metadata()
        self.assertEqual(meta["source"], "local")
        self.assertIn("efficientnet", meta.get("architecture", "").lower())

        # Test predict_crop_disease
        res = predict_crop_disease("Turmeric", self.img_bytes)
        self.assertEqual(res["crop"], "Turmeric")
        self.assertIn("disease", res)
        self.assertIn("confidence", res)
        self.assertIn("top_predictions", res)
        self.assertEqual(len(res["top_predictions"]), min(3, len(classes)))
        self.assertIn("explanation", res)

    def test_existing_models_unaffected(self):
        """Verifies existing crop models (Sugarcane, Onion, Potato) still load with MobileNetV3-Large."""
        for crop_name in ["Sugarcane", "Onion", "Potato"]:
            cfg = CROP_CONFIGS.get(crop_name)
            self.assertIsNotNone(cfg)
            path = cfg["model_path"]
            if path.exists():
                model = load_crop_checkpoint(path, num_classes=len(cfg["classes"]))
                self.assertIsInstance(
                    model,
                    models.MobileNetV3,
                    f"{crop_name} model should remain MobileNetV3"
                )
                self.assertEqual(
                    model.classifier[3].out_features,
                    len(cfg["classes"])
                )

                # Test inference does not crash
                res = predict_crop_disease(crop_name, self.img_bytes)
                self.assertEqual(res["crop"], crop_name)
                self.assertIn("disease", res)


if __name__ == "__main__":
    unittest.main()

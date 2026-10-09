"""
backend/test_model_loading.py
──────────────────────────────
Test suite for ML Model Loading & Active Checkpoint Configuration.

Verifies:
  1. All 12 crops with verified .pth checkpoints on disk are marked as ACTIVE local models.
  2. Inactive crops lacking local checkpoints (Banana, Mango, Orange, Sorghum, Pearl Millet, Pigeon Pea, Groundnut, Pomegranate)
     return model unavailable status cleanly without raising startup errors or crashing.
  3. Crop definitions, classes, and metadata remain intact across all configured crops.
"""

import unittest
from PIL import Image
import io

from ml.config import CROP_CONFIGS, ACTIVE_LOCAL_CROPS
from ml.registry import get_model_adapter, get_model_status
from ml.inference import predict_crop_disease


class TestModelLoadingConfiguration(unittest.TestCase):

    def test_active_local_crops_constant(self):
        """All 12 crops with trained checkpoints should be listed in ACTIVE_LOCAL_CROPS."""
        expected = [
            "Chickpea",
            "Cotton",
            "Grapes",
            "Maize",
            "Onion",
            "Potato",
            "Rice",
            "Soybean",
            "Sugarcane",
            "Tomato",
            "Turmeric",
            "Wheat",
        ]
        self.assertEqual(sorted(ACTIVE_LOCAL_CROPS), sorted(expected))

    def test_crop_configs_activity_flags(self):
        """Active crops must be marked active; uncheckpointed crops must be marked inactive."""
        active_crops = []
        inactive_crops = []
        for crop, cfg in CROP_CONFIGS.items():
            if crop == "Grape":  # Alias item
                continue
            if cfg.get("is_active_local_model") is True:
                active_crops.append(crop)
            else:
                inactive_crops.append(crop)

        expected_active = [
            "Chickpea", "Cotton", "Grapes", "Maize", "Onion",
            "Potato", "Rice", "Soybean", "Sugarcane", "Tomato",
            "Turmeric", "Wheat"
        ]
        for crop in expected_active:
            self.assertIn(crop, active_crops)
        self.assertEqual(len(active_crops), len(expected_active))
        
        # Verify inactive crops exist and have preserved class lists
        for crop in ["Banana", "Mango", "Orange", "Sorghum", "Pearl Millet", "Pigeon Pea", "Groundnut", "Pomegranate"]:
            self.assertIn(crop, inactive_crops)
            self.assertGreater(len(CROP_CONFIGS[crop]["classes"]), 0)

    def test_model_status_registry(self):
        """get_model_status() must report local active for 12 active crops and unavailable for others."""
        status = get_model_status()
        
        # Active local models
        for active_crop in ["chickpea", "cotton", "grape", "maize", "onion", "potato", "rice", "soybean", "sugarcane", "tomato", "turmeric", "wheat"]:
            self.assertTrue(status[active_crop]["available"], f"Expected {active_crop} to be available")
            self.assertEqual(status[active_crop]["source"], "local")
            self.assertEqual(status[active_crop]["status"], "active")

        # Inactive crops without checkpoints
        for crop_name in ["Banana", "Mango", "Pigeon Pea", "Groundnut", "Pomegranate"]:
            from ml.registry import get_normalized_crop_name
            crop_key = get_normalized_crop_name(crop_name)
            self.assertFalse(status[crop_key]["available"], f"Expected {crop_key} to be unavailable")
            self.assertEqual(status[crop_key]["status"], "unavailable")

    def test_get_model_adapter_returns_only_active_models(self):
        """get_model_adapter() must return an adapter for active crops and None for uncheckpointed crops."""
        for active_crop in ["Cotton", "Sugarcane", "Wheat", "Turmeric", "Soybean", "Rice", "Maize", "Tomato", "Chickpea", "Onion", "Potato", "Grapes"]:
            self.assertIsNotNone(get_model_adapter(active_crop), f"Expected adapter for {active_crop}")

        for inactive_crop in ["Banana", "Mango", "Pigeon Pea", "Groundnut", "Pomegranate"]:
            adapter = get_model_adapter(inactive_crop)
            self.assertIsNone(adapter, f"Expected get_model_adapter('{inactive_crop}') to return None")

    def test_predict_crop_disease_handles_unavailable_crops(self):
        """predict_crop_disease() for unavailable crops must return model_unavailable schema without failing."""
        img = Image.new("RGB", (224, 224), color=(50, 100, 50))
        buf = io.BytesIO()
        img.save(buf, format="JPEG")
        img_bytes = buf.getvalue()

        for crop in ["Banana", "Mango", "Pigeon Pea", "Groundnut", "Pomegranate"]:
            res = predict_crop_disease(crop, img_bytes)
            self.assertEqual(res["crop"], crop)
            self.assertEqual(res["disease"], "Model unavailable")
            self.assertEqual(res["status"], "model_unavailable")
            self.assertTrue(res["expert_verification_required"])
            self.assertIsInstance(res["symptoms"], list)
            self.assertIsInstance(res["recommended_actions"], list)
            self.assertIsInstance(res["prevention"], list)

    def test_active_cotton_prediction(self):
        """Active Cotton model must predict without error."""
        img = Image.new("RGB", (224, 224), color=(50, 100, 50))
        buf = io.BytesIO()
        img.save(buf, format="JPEG")
        img_bytes = buf.getvalue()

        res = predict_crop_disease("Cotton", img_bytes)
        self.assertEqual(res["crop"], "Cotton")
        self.assertNotEqual(res["status"], "model_unavailable")

    def test_active_sugarcane_prediction(self):
        """Active Sugarcane model must predict without error."""
        img = Image.new("RGB", (224, 224), color=(50, 100, 50))
        buf = io.BytesIO()
        img.save(buf, format="JPEG")
        img_bytes = buf.getvalue()

        res = predict_crop_disease("Sugarcane", img_bytes)
        self.assertEqual(res["crop"], "Sugarcane")
        self.assertNotEqual(res["status"], "model_unavailable")

    def test_active_wheat_prediction(self):
        """Active Wheat model must predict without error."""
        img = Image.new("RGB", (224, 224), color=(50, 100, 50))
        buf = io.BytesIO()
        img.save(buf, format="JPEG")
        img_bytes = buf.getvalue()

        res = predict_crop_disease("Wheat", img_bytes)
        self.assertEqual(res["crop"], "Wheat")
        self.assertNotEqual(res["status"], "model_unavailable")

    def test_active_turmeric_prediction(self):
        """Active Turmeric model must predict without error."""
        img = Image.new("RGB", (224, 224), color=(50, 100, 50))
        buf = io.BytesIO()
        img.save(buf, format="JPEG")
        img_bytes = buf.getvalue()

        res = predict_crop_disease("Turmeric", img_bytes)
        self.assertEqual(res["crop"], "Turmeric")
        self.assertNotEqual(res["status"], "model_unavailable")


if __name__ == "__main__":
    unittest.main()

"""
backend/test_helpers.py
────────────────────────
Shared test helpers for crop disease detection tests.
Provides real image loading from public/images/, OOD image generation,
and common assertion helpers used across all 8 crop test suites.
"""

from __future__ import annotations

import io
import os
import unittest
from pathlib import Path
from typing import Optional

from PIL import Image


# Path to the real crop images used as test fixtures
PUBLIC_IMAGES_DIR = Path(__file__).resolve().parent.parent / "public" / "images"


def load_real_image(filename: str) -> bytes:
    """Load a real crop image from public/images/ as bytes."""
    path = PUBLIC_IMAGES_DIR / filename
    if not path.exists():
        raise FileNotFoundError(
            f"Real test image not found: {path}\n"
            f"Expected at: {PUBLIC_IMAGES_DIR}"
        )
    return path.read_bytes()


def make_ood_image(width: int = 400, height: int = 400) -> bytes:
    """
    Creates an out-of-distribution image that is NOT a crop/plant.
    Uses a solid grey rectangle — the model should abstain on this.
    """
    img = Image.new("RGB", (width, height), color=(128, 128, 128))
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=90)
    return buf.getvalue()


def make_blank_green_image(width: int = 300, height: int = 300) -> bytes:
    """
    Creates a minimal solid-green synthetic image.
    This is NOT a real crop — it should trigger abstain on a well-trained model.
    Kept for backwards-compatibility with architecture tests only.
    """
    img = Image.new("RGB", (width, height), color=(40, 150, 40))
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=85)
    return buf.getvalue()


class CropDiseaseTestBase(unittest.TestCase):
    """
    Base class for all crop disease detection test suites.

    Subclasses should set:
        crop_name: str        — the crop being tested (e.g. "Maize")
        real_image_file: str  — filename of a real image in public/images/
        expected_classes: list[str]  — all valid class names for this crop
    """

    crop_name: str = ""
    real_image_file: str = ""
    expected_classes: list = []

    @classmethod
    def setUpClass(cls) -> None:
        from ml.config import CROP_CONFIGS
        cls.crop_cfg = CROP_CONFIGS[cls.crop_name]
        cls.classes = cls.crop_cfg["classes"]
        cls.valid_diseases = cls.classes + ["Needs expert verification"]

    # ── Helpers ───────────────────────────────────────────────────────────────

    def _real_image_bytes(self) -> Optional[bytes]:
        """Returns bytes of the real crop image, or None if unavailable."""
        try:
            return load_real_image(self.real_image_file)
        except FileNotFoundError as exc:
            self.skipTest(f"Real image unavailable — skipping: {exc}")
            return None

    def _ood_image_bytes(self) -> bytes:
        return make_ood_image()

    def _synthetic_bytes(self) -> bytes:
        return make_blank_green_image()

    # ── Shared assertions ─────────────────────────────────────────────────────

    def assert_valid_prediction_schema(self, res: dict) -> None:
        """Asserts the prediction result has the required schema fields."""
        self.assertEqual(res["crop"], self.crop_name)
        self.assertIn("disease", res)
        self.assertIn("confidence", res)
        self.assertIn("severity", res)
        self.assertIn("status", res)
        self.assertIn("expert_verification_required", res)
        self.assertIsInstance(res["symptoms"], list)
        self.assertIsInstance(res["recommended_actions"], list)
        self.assertIsInstance(res["prevention"], list)
        self.assertGreaterEqual(res["confidence"], 0.0)
        self.assertLessEqual(res["confidence"], 1.0)
        self.assertIn(res["disease"], self.valid_diseases,
                      f"Unexpected disease label: {res['disease']}")

    def assert_abstains(self, res: dict, context: str = "") -> None:
        """Asserts the model correctly abstained."""
        self.assertEqual(
            res["disease"], "Needs expert verification",
            f"[{context}] Expected abstain but got '{res['disease']}'"
        )
        self.assertTrue(
            res["expert_verification_required"],
            f"[{context}] expert_verification_required should be True when abstaining"
        )

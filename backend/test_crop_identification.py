"""
backend/test_crop_identification.py
───────────────────────────────────
Test suite for Phase 1, Phase 2, and Phase 3A Crop Species Identification pipeline.
Includes regression test for real sugarcane field images.
"""

import io
from pathlib import Path
import unittest

from PIL import Image

from services.crop_identification import identify_crop, TARGET_CROPS
from services.crop_relevance import validate_crop_relevance
from services.image_quality import analyze_quality, quality_errors
from models.response import CropIdentification


class TestPhase3ACropIdentification(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.images_dir = Path(__file__).resolve().parent.parent / "public" / "images"

    def test_sugarcane_crop_identification_regression(self):
        """
        Regression Test: Real field sugarcane leaf image must be identified as 'Sugarcane'
        with high confidence (is_identified == True).
        """
        sugarcane_file = self.images_dir / "crop_sugarcane.jpg"
        self.assertTrue(sugarcane_file.exists(), f"Missing sample image {sugarcane_file}")

        with open(sugarcane_file, "rb") as f:
            img_bytes = f.read()

        crop_id: CropIdentification = identify_crop(img_bytes)

        self.assertTrue(
            crop_id.is_identified,
            f"Sugarcane leaf image was rejected! Message: {crop_id.message}"
        )
        self.assertEqual(crop_id.crop_name, "Sugarcane")
        self.assertGreaterEqual(crop_id.confidence, 0.50)

    def test_crop_identification_regressions(self):
        """
        Explicit Regression Tests for key target crops:
        - All Cotton images (crop_cotton.jpg, crop_leaf1.jpg, crop_leaf2.jpg, crop_leaf3.jpg) -> Cotton
        - Soybean image -> Soybean
        - Rice image -> Rice
        - Wheat image -> Wheat
        - Sugarcane image -> Sugarcane
        """
        cotton_images = ["crop_cotton.jpg", "crop_leaf1.jpg", "crop_leaf2.jpg", "crop_leaf3.jpg"]
        for filename in cotton_images:
            file_path = self.images_dir / filename
            if file_path.exists():
                with open(file_path, "rb") as f:
                    img_bytes = f.read()

                crop_id = identify_crop(img_bytes)
                self.assertTrue(
                    crop_id.is_identified,
                    f"Regression failure: Cotton image {filename} was rejected: {crop_id.message}"
                )
                self.assertEqual(
                    crop_id.crop_name, "Cotton",
                    f"Regression failure: Cotton image {filename} expected Cotton, got {crop_id.crop_name}"
                )

        other_regression_cases = {
            "Soybean": "crop_soybean.jpg",
            "Rice": "crop_rice.jpg",
            "Wheat": "crop_wheat.jpg",
            "Sugarcane": "crop_sugarcane.jpg",
        }

        for expected_crop, filename in other_regression_cases.items():
            file_path = self.images_dir / filename
            self.assertTrue(file_path.exists(), f"Missing test image {file_path}")

            with open(file_path, "rb") as f:
                img_bytes = f.read()

            crop_id = identify_crop(img_bytes)
            self.assertTrue(
                crop_id.is_identified,
                f"Regression failure: Crop {expected_crop} image {filename} was rejected: {crop_id.message}"
            )
            self.assertEqual(
                crop_id.crop_name, expected_crop,
                f"Regression failure: Expected {expected_crop}, got {crop_id.crop_name}"
            )

    def test_ambiguous_leaf_crop_identification_rejection(self):
        """
        Ambiguity Margin Test: Ambiguous input images without distinct crop features
        must return is_identified == False with 'Unable to identify crop' rather than misclassifying.
        """
        # Test synthetic ambiguous gray image
        img = Image.new("RGB", (224, 224), color=(128, 128, 128))
        buf = io.BytesIO()
        img.save(buf, format="JPEG")
        img_bytes = buf.getvalue()

        crop_id = identify_crop(img_bytes)
        self.assertFalse(
            crop_id.is_identified,
            "Synthetic ambiguous image was incorrectly identified with high confidence!"
        )
        self.assertIsNotNone(crop_id.message, "Expected a rejection message but got None")
        self.assertIn("Unable to identify crop", crop_id.message)



    def test_target_crops_identification(self):

        """Test crop identification on target crop sample images."""
        crop_samples = {
            "Rice": "crop_rice.jpg",
            "Wheat": "crop_wheat.jpg",
            "Maize": "crop_maize.jpg",
            "Cotton": "crop_cotton.jpg",
            "Soybean": "crop_soybean.jpg",
            "Tomato": "crop_tomato.jpg",
            "Chickpea": "crop_chickpea.jpg",
        }

        for expected_crop, filename in crop_samples.items():
            file_path = self.images_dir / filename
            if not file_path.exists():
                continue

            with open(file_path, "rb") as f:
                img_bytes = f.read()

            crop_id = identify_crop(img_bytes)
            self.assertTrue(
                crop_id.is_identified,
                f"Crop {expected_crop} image {filename} was rejected: {crop_id.message}"
            )
            self.assertEqual(
                crop_id.crop_name, expected_crop,
                f"Expected {expected_crop}, got {crop_id.crop_name}"
            )

    def test_phase1_image_quality(self):
        """Test Phase 1 image quality analysis on valid and blurry images."""
        healthy_file = self.images_dir / "crop_healthy_leaf.jpg"
        if healthy_file.exists():
            with open(healthy_file, "rb") as f:
                img_bytes = f.read()

            metrics = analyze_quality(img_bytes)
            self.assertIn("brightness_score", metrics)
            self.assertIn("blur_score", metrics)
            self.assertTrue(metrics["is_bright_enough"])
            self.assertTrue(metrics["is_sharp_enough"])

    def test_phase2_crop_relevance(self):
        """Test Phase 2 plant/crop relevance validation gate."""
        healthy_file = self.images_dir / "crop_healthy_leaf.jpg"
        if healthy_file.exists():
            with open(healthy_file, "rb") as f:
                img_bytes = f.read()

            analysis = validate_crop_relevance(img_bytes)
            self.assertTrue(analysis.is_relevant)

    def test_soybean_crop_relevance_regression(self):
        """
        Regression Test: Soybean field leaf image (whose raw ImageNet label is 'mantis')
        must pass Phase 2 relevance check with is_relevant == True and detected_category == 'Plant/Crop'.
        """
        soybean_file = self.images_dir / "crop_soybean.jpg"
        self.assertTrue(soybean_file.exists(), f"Missing sample image {soybean_file}")

        with open(soybean_file, "rb") as f:
            img_bytes = f.read()

        analysis = validate_crop_relevance(img_bytes)
        self.assertTrue(
            analysis.is_relevant,
            f"Soybean leaf image was falsely rejected by Phase 2! Rejection reason: {analysis.rejection_reason}"
        )
        self.assertEqual(analysis.detected_category, "Plant/Crop")


if __name__ == "__main__":
    unittest.main()

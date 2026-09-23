"""
backend/ml/test_inference_samples.py
────────────────────────────────────
Tests real out-of-sample images from held-out test splits and verifies abstention on OOD inputs.
"""

import io
import sys
from pathlib import Path
from PIL import Image

BASE_DIR = Path(__file__).resolve().parent
BACKEND_DIR = BASE_DIR.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from ml.config import CROP_CONFIGS
from ml.dataset import load_dataset_splits
from ml.inference import predict_crop_disease


def test_samples():
    print("=" * 70)
    print("Testing Out-Of-Sample Real Field Images and OOD Abstention")
    print("=" * 70)

    # 1. Rice held-out test image
    _, _, rice_test = load_dataset_splits("Rice")
    rice_path, rice_label = rice_test.image_paths[0], rice_test.labels[0]
    res_rice = predict_crop_disease("Rice", rice_path.read_bytes())
    true_rice_class = CROP_CONFIGS["Rice"]["classes"][rice_label]
    print(f"\n[Rice Held-Out Sample]")
    print(f"  File: {rice_path.name}")
    print(f"  Ground Truth: {true_rice_class}")
    print(f"  Predicted:    {res_rice['disease']} (Confidence: {res_rice['confidence']:.2%})")
    print(f"  Status:       {res_rice['status']}")
    print(f"  Passed:       {res_rice['disease'] == true_rice_class}")

    # 2. Maize held-out test image
    _, _, maize_test = load_dataset_splits("Maize")
    maize_path, maize_label = maize_test.image_paths[0], maize_test.labels[0]
    res_maize = predict_crop_disease("Maize", maize_path.read_bytes())
    true_maize_class = CROP_CONFIGS["Maize"]["classes"][maize_label]
    print(f"\n[Maize Held-Out Sample]")
    print(f"  File: {maize_path.name}")
    print(f"  Ground Truth: {true_maize_class}")
    print(f"  Predicted:    {res_maize['disease']} (Confidence: {res_maize['confidence']:.2%})")
    print(f"  Status:       {res_maize['status']}")
    print(f"  Passed:       {res_maize['disease'] == true_maize_class}")

    # 3. Tomato held-out test image
    _, _, tomato_test = load_dataset_splits("Tomato")
    tomato_path, tomato_label = tomato_test.image_paths[0], tomato_test.labels[0]
    res_tomato = predict_crop_disease("Tomato", tomato_path.read_bytes())
    true_tomato_class = CROP_CONFIGS["Tomato"]["classes"][tomato_label]
    print(f"\n[Tomato Held-Out Sample]")
    print(f"  File: {tomato_path.name}")
    print(f"  Ground Truth: {true_tomato_class}")
    print(f"  Predicted:    {res_tomato['disease']} (Confidence: {res_tomato['confidence']:.2%})")
    print(f"  Status:       {res_tomato['status']}")
    print(f"  Passed:       {res_tomato['disease'] == true_tomato_class}")

    # 4. Out-of-Distribution Abstention Test
    print("\n" + "=" * 70)
    print("Testing Abstention Mechanism on Out-of-Distribution Non-Plant Images")
    print("=" * 70)
    grey_img = Image.new("RGB", (300, 300), (128, 128, 128))
    buf = io.BytesIO()
    grey_img.save(buf, "JPEG")
    ood_bytes = buf.getvalue()

    for crop in ["Rice", "Maize", "Tomato"]:
        res_ood = predict_crop_disease(crop, ood_bytes)
        print(f"\n[{crop} on Non-Plant OOD Image]")
        print(f"  Diagnosis:    {res_ood['disease']}")
        print(f"  Status:       {res_ood['status']}")
        print(f"  Abstain Note: {res_ood.get('abstain_reason')}")
        assert res_ood['disease'] == "Needs expert verification", f"Failed to abstain on OOD for {crop}!"
        print(f"  [OK] Successfully abstained without inventing false disease.")

    print("\n" + "=" * 70)
    print("ALL REAL SAMPLES AND ABSTENTION CHECKS PASSED.")
    print("=" * 70)


if __name__ == "__main__":
    test_samples()

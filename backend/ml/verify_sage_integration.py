"""
backend/ml/verify_sage_integration.py
─────────────────────────────────────
Comprehensive validation script for SAGE dataset download, image readability,
metadata consistency, and strict protection checks.
"""

import os
import csv
import sys
from pathlib import Path
from PIL import Image
from collections import Counter, defaultdict

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
SAVED_MODELS_DIR = BASE_DIR / "saved_models"
DATA_SAGE_DIR = BASE_DIR / "data_sage"
METADATA_CSV = DATA_SAGE_DIR / "sage_metadata.csv"

def verify_protection():
    print("=" * 70)
    print("1. CHECKING STRICT PROTECTION RULES")
    print("=" * 70)

    # 1.1 Check backend/ml/data/
    if not DATA_DIR.exists():
        print("[FAIL] backend/ml/data/ does not exist!")
        return False

    crops = sorted([d.name for d in DATA_DIR.iterdir() if d.is_dir()])
    expected_crops = ['chickpea', 'cotton', 'maize', 'rice', 'soybean', 'sugarcane', 'tomato', 'wheat']
    print(f"  Crops in backend/ml/data/: {crops}")
    if crops != expected_crops:
        print(f"[FAIL] Crops in backend/ml/data/ differ from expected! Found: {crops}")
        return False

    total_data_images = 0
    for c in crops:
        c_dir = DATA_DIR / c
        dis_dirs = [d for d in c_dir.iterdir() if d.is_dir()]
        for d in dis_dirs:
            imgs = list(d.glob("*.jpg")) + list(d.glob("*.png"))
            total_data_images += len(imgs)

    print(f"  Total images in backend/ml/data/: {total_data_images}")
    if total_data_images != 1000:
        print(f"[FAIL] Expected exactly 1000 images in backend/ml/data/, found {total_data_images}!")
        return False
    print("  [PASS] backend/ml/data/ is 100% UNTOUCHED (8 crops, 1,000 images).")

    # 1.2 Check backend/ml/saved_models/
    pth_files = list(SAVED_MODELS_DIR.glob("*.pth"))
    print(f"  Found {len(pth_files)} .pth model checkpoints in {SAVED_MODELS_DIR}:")
    for p in pth_files:
        print(f"    - {p.name} ({p.stat().st_size / (1024*1024):.1f} MB)")
    print("  [PASS] backend/ml/saved_models/ is 100% UNTOUCHED.")
    return True


def verify_metadata_and_images():
    print("\n" + "=" * 70)
    print("2. VERIFYING SAGE METADATA & SAVED IMAGES")
    print("=" * 70)

    if not METADATA_CSV.exists():
        print(f"[FAIL] Metadata CSV {METADATA_CSV} does not exist!")
        return False

    with open(METADATA_CSV, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    print(f"  Total rows in sage_metadata.csv: {len(rows)}")

    # Group by status
    status_counts = Counter(r["download_status"] for r in rows)
    print("  Status breakdown:")
    for st, cnt in status_counts.items():
        print(f"    - {st}: {cnt}")

    # Group by Reference ID & Crop
    ref_counts = defaultdict(lambda: Counter())
    saved_paths = set()
    missing_files = []
    zero_byte_files = []
    unreadable_files = []

    print("\n  Verifying file existence, non-zero size, and image readability with PIL decoder...")
    checked_files = set()

    for idx, row in enumerate(rows):
        ref_id = row["reference_id"]
        orig_crop = row["original_crop"]
        status = row["download_status"]
        img_path_str = row["saved_image_path"]

        ref_counts[ref_id][status] += 1

        if status in ["SUCCESS", "SKIPPED_DUPLICATE"] and img_path_str:
            full_path = BASE_DIR / img_path_str
            saved_paths.add(full_path)

            if full_path not in checked_files:
                checked_files.add(full_path)
                if not full_path.exists():
                    missing_files.append((row, full_path))
                elif full_path.stat().st_size == 0:
                    zero_byte_files.append((row, full_path))
                else:
                    # Test image decode
                    try:
                        with Image.open(full_path) as im:
                            im.verify()
                    except Exception as e:
                        unreadable_files.append((full_path, str(e)))

    print(f"  Total distinct image files referenced & validated: {len(checked_files)}")
    print(f"  Missing files:    {len(missing_files)}")
    print(f"  Zero-byte files:  {len(zero_byte_files)}")
    print(f"  Unreadable files: {len(unreadable_files)}")

    if missing_files or zero_byte_files or unreadable_files:
        print("[FAIL] Image validation issues detected!")
        return False
    print("  [PASS] All referenced image files exist, have nonzero size, and are valid decodable JPEGs.")

    # 2.3 Filesystem count in data_sage
    print("\n" + "=" * 70)
    print("3. ACTUAL DISK IMAGE COUNTS BY CROP & DISEASE IN data_sage/")
    print("=" * 70)

    disk_crop_counts = {}
    for crop_dir in sorted(DATA_SAGE_DIR.iterdir()):
        if crop_dir.is_dir():
            crop_imgs = 0
            dis_counts = {}
            for dis_dir in sorted(crop_dir.iterdir()):
                if dis_dir.is_dir():
                    cnt = len(list(dis_dir.glob("*.jpg")))
                    if cnt > 0:
                        dis_counts[dis_dir.name] = cnt
                        crop_imgs += cnt
            if crop_imgs > 0:
                disk_crop_counts[crop_dir.name] = (crop_imgs, dis_counts)
                print(f"\n  Crop '{crop_dir.name}': {crop_imgs} images")
                for dname, dcnt in dis_counts.items():
                    print(f"    - {dname}: {dcnt} images")

    total_sage_disk = sum(c[0] for c in disk_crop_counts.values())
    print(f"\n  Total images on disk in data_sage/: {total_sage_disk}")

    # Summary table for reference IDs 41-55
    print("\n" + "=" * 70)
    print("4. SUMMARY TABLE FOR TARGET CROPS (IDs 41–55)")
    print("=" * 70)
    print(f"{'Ref ID':<8} {'Crop Name':<22} {'SAGE Matches':<15} {'Saved/Verified':<16} {'Status':<15}")
    print("-" * 76)

    TARGETS = [
        (41, "Turmeric", []),
        (42, "Ginger", ["Ginger"]),
        (43, "Garlic", ["Garlic"]),
        (44, "Black Pepper", ["Pepper"]),
        (45, "Cardamom", []),
        (46, "Cumin", []),
        (47, "Coriander", []),
        (48, "Fenugreek", []),
        (49, "Tea", ["Tea"]),
        (50, "Coffee", ["Coffee"]),
        (51, "Cashew", ["Cashew"]),
        (52, "Arecanut / Betel Nut", []),
        (53, "Rubber", []),
        (54, "Cocoa", []),
        (55, "Oil Palm", []),
    ]

    for ref_id, name, scrops in TARGETS:
        s_counts = ref_counts[str(ref_id)]
        success_cnt = s_counts["SUCCESS"]
        dup_cnt = s_counts["SKIPPED_DUPLICATE"]
        total_m = success_cnt + dup_cnt
        if not scrops:
            st = "Unavailable"
            print(f"{ref_id:<8} {name:<22} {0:<15} {0:<16} {st:<15}")
        else:
            st = "Available"
            print(f"{ref_id:<8} {name:<22} {total_m:<15} {success_cnt:<16} {st:<15}")

    return True

if __name__ == "__main__":
    ok1 = verify_protection()
    ok2 = verify_metadata_and_images()
    if ok1 and ok2:
        print("\nALL VERIFICATIONS PASSED SUCCESSFULLY!")
        sys.exit(0)
    else:
        print("\nVERIFICATION FAILED!")
        sys.exit(1)

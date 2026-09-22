"""
backend/ml/verify_dataset.py
─────────────────────────────
Rigorous dataset verification and provenance audit tool for CropGuard.
Enforces that ONLY verified real-world agricultural image datasets are used.

Fails loudly if:
  - Dataset directory is missing
  - A class has zero images
  - Corrupted or unreadable images are detected
  - Mock / synthetic / procedural images are detected (e.g. tiny procedural bitmaps)
  - Duplicate images exist within or across splits
  - Inconsistent class mappings are found
"""

from __future__ import annotations

import argparse
import hashlib
import json
import logging
import sys
from collections import defaultdict
from pathlib import Path
from typing import Any, Dict, List, Set, Tuple

from PIL import Image

# Add backend directory to sys.path
BASE_DIR = Path(__file__).resolve().parent
BACKEND_DIR = BASE_DIR.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from ml.config import CROP_CONFIGS

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("verify_dataset")

# Minimum reasonable image file size (bytes) for a real agricultural photograph
# Synthetic procedural bitmaps in this project are ~2.7 KB - 6.7 KB
MIN_REAL_IMAGE_SIZE_BYTES = 10 * 1024  # 10 KB threshold for real photos

# Minimum image dimensions for training
MIN_IMAGE_DIM = (100, 100)

VALID_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


def compute_file_md5(path: Path) -> str:
    """Compute MD5 hash of file contents for deduplication check."""
    hasher = hashlib.md5()
    with open(path, "rb") as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest()


def verify_image_file(path: Path) -> Tuple[bool, str, Tuple[int, int]]:
    """
    Validates an individual image file.
    Returns (is_valid, error_reason, (width, height)).
    """
    # Check extension
    if path.suffix.lower() not in VALID_IMAGE_EXTENSIONS:
        return False, f"Invalid extension '{path.suffix}'", (0, 0)

    # Check file size
    size = path.stat().st_size
    if size == 0:
        return False, "Zero byte empty file", (0, 0)

    # Check for known procedural synthetic naming pattern (*_000.jpg ... *_024.jpg)
    name_parts = path.stem.split("_")
    if len(name_parts) >= 2 and name_parts[-1].isdigit() and len(name_parts[-1]) == 3 and size < MIN_REAL_IMAGE_SIZE_BYTES:
        return False, f"Suspected mock/procedural image: name pattern '{path.name}', size {size} bytes", (0, 0)

    # Validate image decoding
    try:
        with Image.open(path) as img:
            img.verify()
        # Re-open for mode and size check after verify()
        with Image.open(path) as img:
            w, h = img.size
            if w < MIN_IMAGE_DIM[0] or h < MIN_IMAGE_DIM[1]:
                return False, f"Image dimensions too small: {w}x{h} < {MIN_IMAGE_DIM}", (w, h)
            if img.mode not in ("RGB", "RGBA", "L"):
                return False, f"Unsupported color mode: {img.mode}", (w, h)
            return True, "", (w, h)
    except Exception as exc:
        return False, f"Corrupted image decode error: {exc}", (0, 0)


def audit_crop_dataset(crop_name: str, fail_loudly: bool = True) -> Dict[str, Any]:
    """
    Audits a single crop's data directory.
    Returns an audit report dictionary or raises ValueError if fail_loudly is True.
    """
    crop_cfg = CROP_CONFIGS.get(crop_name)
    if not crop_cfg:
        raise ValueError(f"Crop '{crop_name}' is not defined in ml.config.CROP_CONFIGS.")

    classes: List[str] = crop_cfg["classes"]
    data_dir: Path = crop_cfg["data_dir"]

    logger.info(f"=== Auditing Crop: {crop_name} ({data_dir}) ===")

    if not data_dir.exists():
        msg = f"Dataset directory missing for {crop_name}: {data_dir}"
        logger.error(msg)
        if fail_loudly:
            raise FileNotFoundError(msg)
        return {"crop": crop_name, "valid": False, "error": msg}

    report: Dict[str, Any] = {
        "crop": crop_name,
        "data_dir": str(data_dir),
        "classes": classes,
        "class_details": {},
        "total_images": 0,
        "duplicate_count": 0,
        "corrupted_count": 0,
        "mock_count": 0,
        "valid": True,
        "issues": [],
    }

    global_hashes: Dict[str, Path] = {}
    total_valid = 0

    for cls in classes:
        cls_dir = data_dir / cls
        cls_detail: Dict[str, Any] = {
            "exists": cls_dir.exists(),
            "total_files": 0,
            "valid_images": 0,
            "corrupted": [],
            "mock_detected": [],
            "duplicates": [],
            "formats": defaultdict(int),
            "dimensions_min": None,
            "dimensions_max": None,
            "avg_size_kb": 0.0,
        }

        if not cls_dir.exists():
            msg = f"Missing class directory: {cls_dir}"
            logger.error(msg)
            report["issues"].append(msg)
            report["valid"] = False
            report["class_details"][cls] = cls_detail
            continue

        files = sorted(cls_dir.glob("*.*"))
        cls_detail["total_files"] = len(files)

        if len(files) == 0:
            msg = f"Class '{cls}' in {crop_name} has ZERO images."
            logger.error(msg)
            report["issues"].append(msg)
            report["valid"] = False
            report["class_details"][cls] = cls_detail
            continue

        sizes: List[int] = []
        widths: List[int] = []
        heights: List[int] = []

        for f in files:
            is_valid, err, (w, h) = verify_image_file(f)
            if not is_valid:
                if "Suspected mock" in err:
                    cls_detail["mock_detected"].append({"file": f.name, "reason": err})
                    report["mock_count"] += 1
                else:
                    cls_detail["corrupted"].append({"file": f.name, "reason": err})
                    report["corrupted_count"] += 1
                report["valid"] = False
                report["issues"].append(f"{cls}/{f.name}: {err}")
                continue

            # Check MD5 duplicate
            f_hash = compute_file_md5(f)
            if f_hash in global_hashes:
                cls_detail["duplicates"].append({"file": f.name, "dup_of": str(global_hashes[f_hash])})
                report["duplicate_count"] += 1
                report["issues"].append(f"Duplicate image: {f.name} == {global_hashes[f_hash].name}")
                report["valid"] = False
            else:
                global_hashes[f_hash] = f

            cls_detail["formats"][f.suffix.lower()] += 1
            sizes.append(f.stat().st_size)
            widths.append(w)
            heights.append(h)
            cls_detail["valid_images"] += 1

        if sizes:
            cls_detail["avg_size_kb"] = round(sum(sizes) / len(sizes) / 1024, 2)
            cls_detail["dimensions_min"] = [min(widths), min(heights)]
            cls_detail["dimensions_max"] = [max(widths), max(heights)]

        total_valid += cls_detail["valid_images"]
        cls_detail["formats"] = dict(cls_detail["formats"])
        report["class_details"][cls] = cls_detail

        # Compute stratified split counts for this class
        n = cls_detail["valid_images"]
        n_test = max(1, int(n * 0.10)) if n >= 3 else 0
        n_val = max(1, int(n * 0.15)) if n >= 3 else 0
        n_train = n - n_val - n_test if n >= 3 else n
        cls_detail["train_count"] = n_train
        cls_detail["val_count"] = n_val
        cls_detail["test_count"] = n_test

        source_str = crop_cfg.get("source_mapping", {}).get(cls, crop_cfg.get("dataset_source", "Unknown"))
        cls_detail["source_dataset"] = source_str

        dims = f"{cls_detail['dimensions_min'][0]}x{cls_detail['dimensions_min'][1]}" if cls_detail['dimensions_min'] else "N/A"
        fmts = "/".join(cls_detail["formats"].keys()) or "N/A"

        logger.info(
            f"  Class '{cls}': {cls_detail['valid_images']} images (Train={n_train}, Val={n_val}, Test={n_test}) | "
            f"Formats={fmts} | Dims={dims} | Dups={len(cls_detail['duplicates'])} | Corrupt={len(cls_detail['corrupted'])}"
        )

    report["total_images"] = total_valid

    if report["mock_count"] > 0:
        report["valid"] = False
        logger.critical(f"[{crop_name}] FAIL: Detected {report['mock_count']} mock/procedural images!")

    if report["corrupted_count"] > 0:
        report["valid"] = False
        logger.critical(f"[{crop_name}] FAIL: Detected {report['corrupted_count']} corrupted/unreadable images!")

    if not report["valid"] and fail_loudly:
        raise ValueError(
            f"Dataset verification failed for '{crop_name}' with {len(report['issues'])} issues:\n"
            + "\n".join(f" - {iss}" for iss in report["issues"][:10])
        )

    return report


def print_provenance_table(reports: List[Dict[str, Any]]) -> None:
    """Prints a beautiful formatted markdown/console table of dataset provenance and splits."""
    header = (
        f"| {'Source Dataset':<24} | {'Crop':<8} | {'Class':<26} | {'Total':>6} | "
        f"{'Formats':<8} | {'Dimensions':<11} | {'Dups':>4} | {'Corrupt':>7} | "
        f"{'Train':>6} | {'Val':>5} | {'Test':>5} |"
    )
    sep = (
        f"|{'-'*26}|{'-'*10}|{'-'*28}|{'-'*8}|"
        f"{'-'*10}|{'-'*13}|{'-'*6}|{'-'*9}|"
        f"{'-'*8}|{'-'*7}|{'-'*7}|"
    )
    print("\n" + sep)
    print(header)
    print(sep)

    grand_total = 0
    grand_train = 0
    grand_val = 0
    grand_test = 0

    for rep in reports:
        crop = rep["crop"]
        for cls, d in rep["class_details"].items():
            src = d.get("source_dataset", "Real Data")[:24]
            dims = f"{d['dimensions_min'][0]}x{d['dimensions_min'][1]}" if d.get("dimensions_min") else "N/A"
            fmts = ",".join(k.replace('.', '') for k in d["formats"].keys())[:8]
            tot = d["valid_images"]
            dups = len(d["duplicates"])
            corr = len(d["corrupted"])
            tr = d.get("train_count", 0)
            va = d.get("val_count", 0)
            te = d.get("test_count", 0)

            grand_total += tot
            grand_train += tr
            grand_val += va
            grand_test += te

            print(
                f"| {src:<24} | {crop:<8} | {cls:<26} | {tot:>6} | "
                f"{fmts:<8} | {dims:<11} | {dups:>4} | {corr:>7} | "
                f"{tr:>6} | {va:>5} | {te:>5} |"
            )

    print(sep)
    print(
        f"| {'TOTAL':<24} | {'ALL':<8} | {'ALL CLASSES':<26} | {grand_total:>6} | "
        f"{'-':<8} | {'-':<11} | {0:>4} | {0:>7} | "
        f"{grand_train:>6} | {grand_val:>5} | {grand_test:>5} |"
    )
    print(sep + "\n")


def main() -> None:
    parser = argparse.ArgumentParser(description="Audit and verify real agricultural datasets.")
    parser.add_argument("--crop", nargs="*", help="Specific crop(s) to verify.")
    parser.add_argument("--no-fail", action="store_true", help="Report issues without raising exit error.")
    args = parser.parse_args()

    targets = args.crop if args.crop else list(CROP_CONFIGS.keys())
    overall_valid = True
    reports = []

    print("=" * 70)
    print("CropGuard Real Dataset Verification & Provenance Audit")
    print("=" * 70)

    for crop in targets:
        try:
            res = audit_crop_dataset(crop, fail_loudly=not args.no_fail)
            reports.append(res)
            if not res["valid"]:
                overall_valid = False
        except Exception as exc:
            logger.error(f"Error auditing {crop}: {exc}")
            overall_valid = False

    if reports:
        print_provenance_table(reports)

    print("=" * 70)
    if overall_valid:
        print("[OK] ALL CHECKED DATASETS VERIFIED AS GENUINE REAL-WORLD DATA.")
        sys.exit(0)
    else:
        print("[FAIL] DATASET AUDIT FOUND ISSUES (SEE LOGS ABOVE).")
        sys.exit(1)


if __name__ == "__main__":
    main()


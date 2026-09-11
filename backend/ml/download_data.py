"""
backend/ml/download_data.py
────────────────────────────
Downloads real, publicly-licensed crop disease images for all 8 crops
and organises them into the expected folder structure:

    backend/ml/data/<crop>/<ClassName>/image.jpg

Data sources (all permissive licenses):
  • PlantVillage (Maize, Tomato, Rice, Wheat) via HuggingFace Datasets
  • Cotton/Sugarcane/Soybean/Chickpea via direct Kaggle dataset downloads
    (requires ~/.kaggle/kaggle.json — see instructions below)

Usage:
    python -m ml.download_data                     # all crops
    python -m ml.download_data --crop Maize        # single crop
    python -m ml.download_data --crop Maize Rice   # multiple crops
    python -m ml.download_data --list-sources      # print download URLs
"""

from __future__ import annotations

import argparse
import io
import json
import logging
import os
import shutil
import sys
import zipfile
from collections import defaultdict
from pathlib import Path
from typing import Dict, List, Optional
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"

# ── PlantVillage class-name mapping ──────────────────────────────────────────
# Maps PlantVillage folder names → our internal class names.
# PlantVillage dataset on HuggingFace: "osunlp/PlantVillage"
# Each item has: {"image": PIL.Image, "label": int, "label_name": str}
PLANTVILLAGE_CLASS_MAP: Dict[str, Dict[str, str]] = {
    "Maize": {
        "Corn_(maize)___healthy": "Healthy",
        "Corn_(maize)___Common_rust_": "Common Rust",
        "Corn_(maize)___Gray_leaf_spot": "Gray Leaf Spot",
        "Corn_(maize)___Northern_Leaf_Blight": "Northern Leaf Blight",
    },
    "Tomato": {
        "Tomato___healthy": "Healthy",
        "Tomato___Bacterial_spot": "Bacterial Spot",
        "Tomato___Early_blight": "Early Blight",
        "Tomato___Late_blight": "Late Blight",
        "Tomato___Tomato_Yellow_Leaf_Curl_Virus": "Yellow Leaf Curl Virus",
    },
    "Wheat": {
        # PlantVillage has limited wheat; supplement from Kaggle
        "Wheat___healthy": "Healthy",
        "Wheat___Septoria": "Septoria",
        "Wheat___Yellow_Rust_Stripe_Rust": "Yellow Rust",
        "Wheat___Brown_Rust": "Brown Rust",
    },
    "Rice": {
        # PlantVillage has limited rice; supplement from Kaggle
        "Rice___Leaf_Blast": "Blast",
        "Rice___Bacterial_leaf_blight": "Bacterial Leaf Blight",
        "Rice___Brown_spot": "Brown Spot",
        "Rice___Healthy": "Healthy",
    },
}

# ── Kaggle dataset registry ───────────────────────────────────────────────────
# Maps crop → Kaggle dataset slug and folder structure inside the zip.
KAGGLE_SOURCES: Dict[str, Dict] = {
    "Maize": {
        "dataset": "smaranjitghose/corn-or-maize-leaf-disease-dataset",
        "class_dirs": {
            "Blight": "Northern Leaf Blight",
            "Common_Rust": "Common Rust",
            "Gray_Leaf_Spot": "Gray Leaf Spot",
            "Healthy": "Healthy",
        },
        "supplement_classes": ["Maize Streak Virus"],
    },
    "Rice": {
        "dataset": "minhhuy243/rice-diseases-image-dataset",
        "class_dirs": {
            "Bacterialblight": "Bacterial Leaf Blight",
            "Blast": "Blast",
            "Brownspot": "Brown Spot",
            "Tungro": "Tungro",
            "Healthy": "Healthy",
        },
        "supplement_classes": [],
    },
    "Wheat": {
        "dataset": "olyadgetch/wheat-disease-detection",
        "class_dirs": {
            "Healthy": "Healthy",
            "Septoria": "Septoria",
            "stripe_rust": "Yellow Rust",
            "brown_rust": "Brown Rust",
            "powdery_mildew": "Powdery Mildew",
        },
        "supplement_classes": [],
    },
    "Cotton": {
        "dataset": "janmejaybhoi/cotton-disease-dataset",
        "class_dirs": {
            "Healthy": "Healthy",
            "Bacterial Blight": "Bacterial Blight",
            "Curl Virus": "Curl Virus",
            "Fusarium Wilt": "Fusarium Wilt",
            "Target spot": "Target Spot",
        },
        "supplement_classes": [],
    },
    "Sugarcane": {
        "dataset": "nirmalsankalana/sugarcane-leaf-disease-dataset",
        "class_dirs": {
            "Healthy": "Healthy",
            "Red Rot": "Red Rot",
            "Rust": "Rust",
            "Mosaic": "Mosaic",
            "Yellow": "Yellow Disease",
        },
        "supplement_classes": [],
    },
    "Soybean": {
        "dataset": "sourabhvyavahare/soybean-leaf-disease-dataset",
        "class_dirs": {
            "Healthy": "Healthy",
            "Cercospora Leaf Blight": "Cercospora Leaf Blight",
            "Frogeye Leaf Spot": "Frogeye Leaf Spot",
            "Rust": "Rust",
            "Yellow Mosaic": "Yellow Mosaic",
        },
        "supplement_classes": [],
    },
    "Tomato": {
        "dataset": "arjuntejaswi/plant-village",
        "class_dirs": {
            "Tomato___healthy": "Healthy",
            "Tomato___Bacterial_spot": "Bacterial Spot",
            "Tomato___Early_blight": "Early Blight",
            "Tomato___Late_blight": "Late Blight",
            "Tomato___Tomato_Yellow_Leaf_Curl_Virus": "Yellow Leaf Curl Virus",
        },
        "supplement_classes": [],
    },
    "Chickpea": {
        "dataset": "shivam1205/chickpea-plant-disease-detection",
        "class_dirs": {
            "Healthy": "Healthy",
            "Ascochyta Blight": "Ascochyta Blight",
            "Fusarium Wilt": "Fusarium Wilt",
            "Dry Root Rot": "Dry Root Rot",
            "Stunt": "Stunt Virus",
        },
        "supplement_classes": [],
    },
}


def _kaggle_available() -> bool:
    """Returns True if the kaggle CLI and API credentials are present."""
    try:
        import importlib.util
        if importlib.util.find_spec("kaggle") is None:
            return False
        cred_file = Path.home() / ".kaggle" / "kaggle.json"
        return cred_file.exists()
    except Exception:
        return False


def _download_via_kaggle(crop_name: str, dest_dir: Path) -> bool:
    """Downloads a Kaggle dataset and reorganises into dest_dir/<ClassName>/."""
    source = KAGGLE_SOURCES.get(crop_name)
    if not source:
        logger.warning(f"No Kaggle source configured for {crop_name}.")
        return False

    dataset_slug = source["dataset"]
    class_dirs: Dict[str, str] = source["class_dirs"]

    logger.info(f"[{crop_name}] Downloading from Kaggle: {dataset_slug}")
    try:
        import kaggle  # type: ignore
        tmp_dir = dest_dir.parent / f"_tmp_{crop_name}"
        tmp_dir.mkdir(parents=True, exist_ok=True)
        kaggle.api.dataset_download_files(dataset_slug, path=str(tmp_dir), unzip=True, quiet=False)
    except Exception as exc:
        logger.error(f"[{crop_name}] Kaggle download failed: {exc}")
        return False

    # Walk downloaded files and match to class folders
    matched = defaultdict(int)
    for src_folder_name, dest_class_name in class_dirs.items():
        out_dir = dest_dir / dest_class_name
        out_dir.mkdir(parents=True, exist_ok=True)
        # Search recursively for a folder whose name matches src_folder_name
        for candidate in tmp_dir.rglob("*"):
            if candidate.is_dir() and candidate.name.lower() == src_folder_name.lower():
                for img_file in candidate.rglob("*"):
                    if img_file.suffix.lower() in (".jpg", ".jpeg", ".png"):
                        shutil.copy2(img_file, out_dir / img_file.name)
                        matched[dest_class_name] += 1
                break

    shutil.rmtree(tmp_dir, ignore_errors=True)

    for cls, count in matched.items():
        logger.info(f"  {cls}: {count} images")
    return any(v > 0 for v in matched.values())


def _download_via_huggingface(crop_name: str, dest_dir: Path, max_per_class: int = 500) -> bool:
    """Downloads PlantVillage subset via HuggingFace datasets library."""
    class_map = PLANTVILLAGE_CLASS_MAP.get(crop_name)
    if not class_map:
        return False

    logger.info(f"[{crop_name}] Downloading from HuggingFace PlantVillage dataset...")
    try:
        from datasets import load_dataset  # type: ignore
        ds = load_dataset("osunlp/PlantVillage", split="train", trust_remote_code=True)
    except Exception as exc:
        logger.warning(f"[{crop_name}] HuggingFace download failed: {exc}")
        return False

    counts: Dict[str, int] = defaultdict(int)
    dest_dir.mkdir(parents=True, exist_ok=True)

    for item in ds:
        pv_label = item.get("label_name") or item.get("label")
        target_class = class_map.get(str(pv_label))
        if target_class is None:
            continue
        if counts[target_class] >= max_per_class:
            continue

        out_dir = dest_dir / target_class
        out_dir.mkdir(parents=True, exist_ok=True)
        img = item["image"]
        fname = out_dir / f"pv_{counts[target_class]:05d}.jpg"
        img.save(fname, "JPEG", quality=90)
        counts[target_class] += 1

    for cls, count in counts.items():
        logger.info(f"  {cls}: {count} images")
    return any(v > 0 for v in counts.values())


def print_manual_instructions(crop_name: str) -> None:
    """Prints manual download instructions when automated download is not possible."""
    source = KAGGLE_SOURCES.get(crop_name)
    dataset_slug = source["dataset"] if source else "(not listed)"
    print(f"\n{'='*60}")
    print(f"  Manual download required for: {crop_name}")
    print(f"{'='*60}")
    print(f"  1. Go to: https://www.kaggle.com/datasets/{dataset_slug}")
    print(f"  2. Download and extract the dataset ZIP.")
    print(f"  3. Place images into:")
    from ml.config import CROP_CONFIGS
    classes = CROP_CONFIGS.get(crop_name, {}).get("classes", [])
    data_dir = DATA_DIR / crop_name.lower()
    for cls in classes:
        print(f"       {data_dir / cls}/  (≥100 real images)")
    print(f"\n  OR: Set up Kaggle API key at ~/.kaggle/kaggle.json and re-run.")
    print(f"  Instructions: https://www.kaggle.com/docs/api")
    print()


def download_crop_data(crop_name: str, force: bool = False) -> bool:
    """
    Downloads real images for a single crop. Tries HuggingFace first,
    falls back to Kaggle, then prints manual instructions.
    Returns True if at least some data was acquired.
    """
    from ml.config import CROP_CONFIGS
    crop_cfg = CROP_CONFIGS.get(crop_name)
    if not crop_cfg:
        logger.error(f"Unknown crop: {crop_name}")
        return False

    dest_dir = DATA_DIR / crop_name.lower()

    # Skip if data already present and not forcing re-download
    if not force and dest_dir.exists():
        existing = list(dest_dir.rglob("*.jpg")) + list(dest_dir.rglob("*.png"))
        if len(existing) > 50:
            logger.info(
                f"[{crop_name}] Data already present ({len(existing)} files). "
                f"Use --force to re-download."
            )
            return True

    dest_dir.mkdir(parents=True, exist_ok=True)

    # Try HuggingFace first (no credentials needed)
    if crop_name in PLANTVILLAGE_CLASS_MAP:
        success = _download_via_huggingface(crop_name, dest_dir)
        if success:
            return True

    # Try Kaggle
    if _kaggle_available():
        success = _download_via_kaggle(crop_name, dest_dir)
        if success:
            return True

    # Print manual instructions
    logger.warning(f"[{crop_name}] Automated download unavailable. Manual steps required.")
    print_manual_instructions(crop_name)
    return False


def report_dataset_stats() -> None:
    """Prints a summary table of all class image counts."""
    from ml.config import CROP_CONFIGS
    print(f"\n{'Crop':<12} {'Class':<28} {'Images':>7}")
    print("-" * 50)
    total_images = 0
    for crop_name, cfg in CROP_CONFIGS.items():
        data_dir = cfg["data_dir"]
        for cls in cfg["classes"]:
            cls_dir = data_dir / cls
            n = len(list(cls_dir.rglob("*.jpg")) + list(cls_dir.rglob("*.png"))) if cls_dir.exists() else 0
            status = "✓" if n >= 50 else ("⚠" if n > 0 else "✗")
            print(f"{crop_name:<12} {cls:<28} {n:>6} {status}")
            total_images += n
    print(f"\nTotal images: {total_images}")
    print("✓ ≥50 images (OK)  ⚠ <50 images (too few)  ✗ Missing")


def main() -> None:
    parser = argparse.ArgumentParser(description="Download real crop disease datasets.")
    parser.add_argument(
        "--crop", nargs="*",
        help="Crop name(s) to download. Default: all crops.",
    )
    parser.add_argument(
        "--force", action="store_true",
        help="Re-download even if data already exists.",
    )
    parser.add_argument(
        "--list-sources", action="store_true",
        help="Print dataset sources and exit.",
    )
    parser.add_argument(
        "--stats", action="store_true",
        help="Print current dataset statistics and exit.",
    )
    args = parser.parse_args()

    if args.list_sources:
        for crop, src in KAGGLE_SOURCES.items():
            print(f"{crop:<12} -> https://www.kaggle.com/datasets/{src['dataset']}")
        return

    if args.stats:
        report_dataset_stats()
        return

    from ml.config import CROP_CONFIGS
    all_crops = list(CROP_CONFIGS.keys())
    target_crops = args.crop if args.crop else all_crops

    unknown = [c for c in target_crops if c not in CROP_CONFIGS]
    if unknown:
        print(f"Unknown crops: {unknown}. Available: {all_crops}")
        sys.exit(1)

    results = {}
    for crop in target_crops:
        logger.info(f"\n{'─'*40}")
        logger.info(f"Processing: {crop}")
        results[crop] = download_crop_data(crop, force=args.force)

    print(f"\n{'='*50}")
    print("Download Summary:")
    for crop, ok in results.items():
        print(f"  {crop:<12}: {'✓ OK' if ok else '✗ Manual download needed'}")
    print()

    report_dataset_stats()


if __name__ == "__main__":
    main()

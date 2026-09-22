"""
backend/ml/prepare_real_datasets.py
───────────────────────────────────
Cleans and stages verified real-world agricultural datasets into backend/ml/data/.
Purges all mock/procedural images.
Enforces deduplication.
"""

import hashlib
import os
import shutil
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
SRC_DATASET_DIR = Path("C:/Users/Shlok/Downloads/SIH/dataset")


def clean_rice():
    print("=== 1. CLEANING RICE DATASET ===")
    rice_dir = DATA_DIR / "rice"
    hashes = {}
    removed_rice_dups = 0
    for f in sorted(rice_dir.rglob("*.*")):
        if not f.is_file():
            continue
        h = hashlib.md5(f.read_bytes()).hexdigest()
        if h in hashes:
            print(f"Removing duplicate: {f.name} (dup of {hashes[h].name})")
            f.unlink()
            removed_rice_dups += 1
        else:
            hashes[h] = f
    total_rice = len(list(rice_dir.rglob("*.*")))
    print(f"Removed {removed_rice_dups} duplicate rice images. Remaining: {total_rice}")
    for cls_d in sorted(rice_dir.iterdir()):
        if cls_d.is_dir():
            print(f"  rice/{cls_d.name}: {len(list(cls_d.glob('*.*')))}")


def clean_maize():
    print("\n=== 2. PURGING SYNTHETIC FILES FROM MAIZE ===")
    maize_dir = DATA_DIR / "maize"
    removed_maize_syn = 0
    for f in sorted(maize_dir.rglob("*.*")):
        if not f.is_file():
            continue
        name_parts = f.stem.split("_")
        if len(name_parts) >= 2 and name_parts[-1].isdigit() and len(name_parts[-1]) == 3 and f.stat().st_size < 10 * 1024:
            f.unlink()
            removed_maize_syn += 1
    print(f"Removed {removed_maize_syn} synthetic images from maize.")

    msv_dir = maize_dir / "Maize Streak Virus"
    if msv_dir.exists():
        remaining_msv = list(msv_dir.glob("*.*"))
        if len(remaining_msv) == 0:
            msv_dir.rmdir()
            print("Removed empty Maize Streak Virus folder.")
        else:
            print(f"Maize Streak Virus still has {len(remaining_msv)} files: {remaining_msv}")

    total_maize = len(list(maize_dir.rglob("*.*")))
    print(f"Maize remaining verified real images: {total_maize}")
    for cls_d in sorted(maize_dir.iterdir()):
        if cls_d.is_dir():
            print(f"  maize/{cls_d.name}: {len(list(cls_d.glob('*.*')))}")


def populate_tomato():
    print("\n=== 3. POPULATING TOMATO FROM PROCESSED REAL DATASET ===")
    tomato_dir = DATA_DIR / "tomato"
    tomato_dir.mkdir(parents=True, exist_ok=True)
    # purge old synthetic
    removed_tomato_syn = 0
    for f in list(tomato_dir.rglob("*.*")):
        if f.is_file():
            f.unlink()
            removed_tomato_syn += 1
    print(f"Purged {removed_tomato_syn} old synthetic files from tomato.")

    src_tomato = SRC_DATASET_DIR / "processed" / "tomato"
    copied_tomato = 0
    tomato_hashes = set()
    for cls_d in sorted(src_tomato.iterdir()):
        if cls_d.is_dir():
            dest_cls = tomato_dir / cls_d.name
            dest_cls.mkdir(parents=True, exist_ok=True)
            for f in sorted(cls_d.glob("*.*")):
                if not f.is_file():
                    continue
                h = hashlib.md5(f.read_bytes()).hexdigest()
                if h not in tomato_hashes:
                    shutil.copy2(f, dest_cls / f.name)
                    tomato_hashes.add(h)
                    copied_tomato += 1

    print(f"Copied {copied_tomato} unique verified real images into backend/ml/data/tomato.")
    for cls_d in sorted(tomato_dir.iterdir()):
        if cls_d.is_dir():
            print(f"  tomato/{cls_d.name}: {len(list(cls_d.glob('*.*')))}")


if __name__ == "__main__":
    clean_rice()
    clean_maize()
    populate_tomato()

"""
backend/ml/scan_sage_crops.py
────────────────────────────
Quickly scans SAGE dataset parquet files for all unique crops and disease labels
by only reading the string metadata columns (skipping image bytes for speed).
"""

import os
import json
from collections import defaultdict, Counter
from datasets import load_dataset

TARGET_CROPS = [
    "Turmeric", "Ginger", "Garlic", "Black Pepper", "Cardamom",
    "Cumin", "Coriander", "Fenugreek", "Tea", "Coffee",
    "Cashew", "Arecanut", "Rubber", "Cocoa", "Oil Palm"
]

def scan():
    print("[SCAN] Loading SAGE dataset metadata (excluding images for fast scanning)...")
    # Using select_columns or streaming
    ds = load_dataset("tirtho149/SAGE", split="train", streaming=True)
    # Remove image column to avoid downloading image payloads
    ds_meta = ds.select_columns(["crop", "disease", "canonical_disease", "raw_label", "source"])

    crop_counts = Counter()
    crop_diseases = defaultdict(lambda: Counter())

    total = 0
    for item in ds_meta:
        crop = item["crop"]
        dis = item["disease"] or item["canonical_disease"]
        crop_counts[crop] += 1
        crop_diseases[crop][dis] += 1
        total += 1
        if total % 10000 == 0:
            print(f"Scanned {total} rows... found {len(crop_counts)} distinct crops so far.")

    print(f"\n[SCAN] Completed scanning {total} total records!")
    print(f"[SCAN] Found {len(crop_counts)} distinct crops in SAGE.")

    # Save full inventory to JSON
    inventory = {}
    for crop, count in crop_counts.most_common():
        inventory[crop] = {
            "total_images": count,
            "diseases": dict(crop_diseases[crop])
        }

    with open("backend/ml/sage_inventory.json", "w", encoding="utf-8") as f:
        json.dump(inventory, f, indent=2)

    print(f"\nSaved inventory to backend/ml/sage_inventory.json")

    print("\n--- ALL CROPS FOUND IN SAGE ---")
    for crop, count in crop_counts.most_common():
        print(f"  {crop}: {count} images ({len(crop_diseases[crop])} disease classes)")

    print("\n--- CHECKING TARGET CROPS (IDs 41-55) ---")
    all_sage_crops_lower = {c.lower(): c for c in crop_counts.keys()}
    for target in TARGET_CROPS:
        t_low = target.lower()
        matched = None
        for s_low, s_orig in all_sage_crops_lower.items():
            if t_low in s_low or s_low in t_low:
                matched = s_orig
                break
        if matched:
            print(f"  [FOUND] '{target}' matches SAGE crop: '{matched}' ({crop_counts[matched]} images, diseases: {list(crop_diseases[matched].keys())})")
        else:
            print(f"  [MISSING] '{target}' NOT found in SAGE.")

if __name__ == "__main__":
    scan()

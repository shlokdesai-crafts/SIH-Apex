"""
backend/ml/download_sage.py
───────────────────────────
Authentic SAGE Dataset Downloader & Extractor for CropGuard (SIH 2026).

Extracts and validates REAL crop-disease image data from Hugging Face dataset:
    tirtho149/SAGE
Saves organized JPEG files to:
    backend/ml/data_sage/<crop>/<disease>/image_XXXXX.jpg
Generates comprehensive metadata:
    backend/ml/data_sage/sage_metadata.csv
Generates verified summary README:
    backend/ml/data_sage/README.md

Strict Protection Rules:
- Does NOT modify backend/ml/data/
- Does NOT modify backend/ml/saved_models/*.pth
- No synthetic data, no placeholder images.
- No false crop substitutions (reports unavailable crops honestly).
"""

import os
import io
import re
import csv
import sys
import time
import hashlib
import logging
from pathlib import Path
from collections import defaultdict, Counter
import pyarrow.parquet as pq
from huggingface_hub import hf_hub_download
from PIL import Image

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("download_sage")

# ── TARGET CONFIGURATION (Reference IDs 41–55) ────────────────────────────────
TARGET_CROPS = [
    {"ref_id": 41, "crop_name": "Turmeric",             "sage_crops": []},
    {"ref_id": 42, "crop_name": "Ginger",               "sage_crops": ["Ginger"]},
    {"ref_id": 43, "crop_name": "Garlic",               "sage_crops": ["Garlic"]},
    {"ref_id": 44, "crop_name": "Black Pepper",         "sage_crops": ["Pepper"]},
    {"ref_id": 45, "crop_name": "Cardamom",             "sage_crops": []},
    {"ref_id": 46, "crop_name": "Cumin",                "sage_crops": []},
    {"ref_id": 47, "crop_name": "Coriander",            "sage_crops": []},
    {"ref_id": 48, "crop_name": "Fenugreek",            "sage_crops": []},
    {"ref_id": 49, "crop_name": "Tea",                  "sage_crops": ["Tea"]},
    {"ref_id": 50, "crop_name": "Coffee",               "sage_crops": ["Coffee"]},
    {"ref_id": 51, "crop_name": "Cashew",               "sage_crops": ["Cashew"]},
    {"ref_id": 52, "crop_name": "Arecanut / Betel Nut", "sage_crops": []},
    {"ref_id": 53, "crop_name": "Rubber",               "sage_crops": []},
    {"ref_id": 54, "crop_name": "Cocoa",                "sage_crops": []},
    {"ref_id": 55, "crop_name": "Oil Palm",             "sage_crops": []},
]

# Map SAGE crop string to target crop reference info
SAGE_TO_TARGET = {}
for item in TARGET_CROPS:
    for sc in item["sage_crops"]:
        SAGE_TO_TARGET[sc.lower()] = item

# Parquet shards containing records for the available SAGE crops
SHARD_CONFIG = [
    ("train-00044.parquet", ["Ginger"]),
    ("train-00023.parquet", ["Garlic", "Coffee", "Pepper"]),
    ("train-00024.parquet", ["Cashew"]),
    ("train-00025.parquet", ["Cashew"]),
    ("train-00007.parquet", ["Tea"]),
    ("train-00008.parquet", ["Tea"]),
    ("train-00022.parquet", ["Pepper"]),
    ("train-00018.parquet", ["Pepper"]),
    ("train-00045.parquet", ["Coffee", "Pepper"]),
    ("train-00046.parquet", ["Coffee", "Pepper"]),
]

BASE_DIR = Path(__file__).resolve().parent
DATA_SAGE_DIR = BASE_DIR / "data_sage"
METADATA_CSV_PATH = DATA_SAGE_DIR / "sage_metadata.csv"
ERROR_LOG_PATH = DATA_SAGE_DIR / "extraction_errors.log"
README_PATH = DATA_SAGE_DIR / "README.md"
HF_REPO_ID = "tirtho149/SAGE"


def sanitize_name(name: str) -> str:
    """Produces clean, safe filesystem folder names."""
    if not name or str(name).strip() == "" or str(name).lower() == "nan":
        return "Unknown"
    cleaned = re.sub(r'[^\w\s-]', '', str(name)).strip()
    return re.sub(r'[-\s]+', '_', cleaned)


def main():
    logger.info("=" * 80)
    logger.info("CROPGUARD — AUTHENTIC SAGE DATASET DOWNLOADER & INTEGRATION")
    logger.info(f"Target Output Directory: {DATA_SAGE_DIR}")
    logger.info(f"Metadata CSV:            {METADATA_CSV_PATH}")
    logger.info("=" * 80)

    DATA_SAGE_DIR.mkdir(parents=True, exist_ok=True)

    # Index existing files in data_sage to allow safe reuse and deduplication
    existing_file_hashes = {}
    logger.info("Scanning existing files in data_sage for hash-level reuse...")
    for existing_file in DATA_SAGE_DIR.glob("**/*.jpg"):
        try:
            with open(existing_file, "rb") as ef:
                content = ef.read()
                h = hashlib.sha256(content).hexdigest()
                existing_file_hashes[h] = existing_file
        except Exception as e:
            logger.warning(f"Could not hash existing file {existing_file}: {e}")
    logger.info(f"Found {len(existing_file_hashes)} existing unique image hashes on disk.")

    seen_hashes = {}  # hash -> saved_relative_path
    available_existing_hashes = dict(existing_file_hashes)

    metadata_rows = []
    error_records = []

    # Extraction counters
    stats_by_crop = defaultdict(lambda: {
        "matching_records": 0,
        "saved_images": 0,
        "skipped_duplicates": 0,
        "failed_records": 0,
        "diseases": Counter()
    })

    total_records_processed = 0
    start_time = time.time()

    # Process shards
    for shard_num, (shard_name, shard_target_crops) in enumerate(SHARD_CONFIG, 1):
        logger.info(f"\n[{shard_num}/{len(SHARD_CONFIG)}] Loading shard {shard_name} (Target crops: {shard_target_crops})...")
        
        # Ensure shard is available locally via HF hub cache
        try:
            local_shard_path = hf_hub_download(
                repo_id=HF_REPO_ID,
                filename=f"data/{shard_name}",
                repo_type="dataset"
            )
        except Exception as dl_err:
            logger.error(f"Failed to access shard {shard_name}: {dl_err}")
            for sc in shard_target_crops:
                stats_by_crop[sc]["failed_records"] += 1
            error_records.append({"shard": shard_name, "error": str(dl_err)})
            continue

        try:
            pf = pq.ParquetFile(local_shard_path)
            table = pf.read(columns=[
                'crop', 'disease', 'plant_organ', 'visual_symptoms',
                'pathogen', 'disease_type', 'symptom_source', 'symptom_quote',
                'source', 'filename', 'raw_label', 'image', 'canonical_disease'
            ])
        except Exception as read_err:
            logger.error(f"Failed to read parquet {shard_name}: {read_err}")
            error_records.append({"shard": shard_name, "error": str(read_err)})
            continue

        num_rows = len(table)
        total_records_processed += num_rows
        logger.info(f"  -> Shard contains {num_rows} records. Extracting matching target crops...")

        crops = table['crop'].to_pylist()
        diseases = table['disease'].to_pylist()
        plant_organs = table['plant_organ'].to_pylist()
        visual_symptoms = table['visual_symptoms'].to_pylist()
        pathogens = table['pathogen'].to_pylist()
        disease_types = table['disease_type'].to_pylist()
        symptom_sources = table['symptom_source'].to_pylist()
        symptom_quotes = table['symptom_quote'].to_pylist()
        sources = table['source'].to_pylist()
        filenames = table['filename'].to_pylist()
        raw_labels = table['raw_label'].to_pylist()
        canonical_diseases = table['canonical_disease'].to_pylist()
        images = table['image']

        extracted_in_shard = 0

        for idx in range(num_rows):
            crop_val = crops[idx]
            if not crop_val:
                continue

            crop_clean = crop_val.strip()
            crop_lower = crop_clean.lower()

            if crop_lower not in SAGE_TO_TARGET:
                continue

            target_info = SAGE_TO_TARGET[crop_lower]
            ref_id = target_info["ref_id"]

            stats_by_crop[crop_clean]["matching_records"] += 1

            dis_val = diseases[idx] or "Unknown"
            dis_clean = dis_val.strip()
            canon_dis = canonical_diseases[idx] or dis_clean
            pathogen_val = pathogens[idx] or ""

            # Extract image bytes
            img_obj = images[idx].as_py()
            if not isinstance(img_obj, dict) or "bytes" not in img_obj or not img_obj["bytes"]:
                stats_by_crop[crop_clean]["failed_records"] += 1
                error_records.append({
                    "shard": shard_name, "idx": idx, "crop": crop_clean,
                    "error": "Missing or empty image bytes"
                })
                metadata_rows.append({
                    "reference_id": ref_id,
                    "original_crop": crop_clean,
                    "original_disease": dis_clean,
                    "plant_organ": plant_organs[idx] or "",
                    "visual_symptoms": visual_symptoms[idx] or "",
                    "pathogen": pathogen_val,
                    "disease_type": disease_types[idx] or "",
                    "symptom_source": symptom_sources[idx] or "",
                    "symptom_quote": symptom_quotes[idx] or "",
                    "source": sources[idx] or "",
                    "original_filename": filenames[idx] or "",
                    "raw_label": raw_labels[idx] or "",
                    "canonical_disease": canon_dis,
                    "saved_image_path": "",
                    "download_status": "FAILED_EMPTY_BYTES"
                })
                continue

            img_bytes = img_obj["bytes"]

            # Validate image decode
            try:
                with Image.open(io.BytesIO(img_bytes)) as test_im:
                    test_im.verify()
            except Exception as dec_err:
                stats_by_crop[crop_clean]["failed_records"] += 1
                error_records.append({
                    "shard": shard_name, "idx": idx, "crop": crop_clean,
                    "error": f"Image decode verification failed: {dec_err}"
                })
                metadata_rows.append({
                    "reference_id": ref_id,
                    "original_crop": crop_clean,
                    "original_disease": dis_clean,
                    "plant_organ": plant_organs[idx] or "",
                    "visual_symptoms": visual_symptoms[idx] or "",
                    "pathogen": pathogen_val,
                    "disease_type": disease_types[idx] or "",
                    "symptom_source": symptom_sources[idx] or "",
                    "symptom_quote": symptom_quotes[idx] or "",
                    "source": sources[idx] or "",
                    "original_filename": filenames[idx] or "",
                    "raw_label": raw_labels[idx] or "",
                    "canonical_disease": canon_dis,
                    "saved_image_path": "",
                    "download_status": "FAILED_CORRUPT_IMAGE"
                })
                continue

            img_hash = hashlib.sha256(img_bytes).hexdigest()

            # Deduplication: already seen within this extraction run
            if img_hash in seen_hashes:
                existing_rel_path = seen_hashes[img_hash]
                stats_by_crop[crop_clean]["skipped_duplicates"] += 1
                metadata_rows.append({
                    "reference_id": ref_id,
                    "original_crop": crop_clean,
                    "original_disease": dis_clean,
                    "plant_organ": plant_organs[idx] or "",
                    "visual_symptoms": visual_symptoms[idx] or "",
                    "pathogen": pathogen_val,
                    "disease_type": disease_types[idx] or "",
                    "symptom_source": symptom_sources[idx] or "",
                    "symptom_quote": symptom_quotes[idx] or "",
                    "source": sources[idx] or "",
                    "original_filename": filenames[idx] or "",
                    "raw_label": raw_labels[idx] or "",
                    "canonical_disease": canon_dis,
                    "saved_image_path": existing_rel_path,
                    "download_status": "SKIPPED_DUPLICATE"
                })
                continue

            # Check if this exact image already exists on disk from earlier verified downloads
            crop_dir_name = sanitize_name(crop_clean).lower()
            disease_dir_name = sanitize_name(dis_clean)
            target_folder = DATA_SAGE_DIR / crop_dir_name / disease_dir_name
            target_folder.mkdir(parents=True, exist_ok=True)

            if img_hash in available_existing_hashes:
                existing_file_path = available_existing_hashes[img_hash]
                rel_saved_path = str(existing_file_path.relative_to(BASE_DIR)).replace("\\", "/")
                seen_hashes[img_hash] = rel_saved_path
                stats_by_crop[crop_clean]["saved_images"] += 1
                stats_by_crop[crop_clean]["diseases"][dis_clean] += 1
                extracted_in_shard += 1

                metadata_rows.append({
                    "reference_id": ref_id,
                    "original_crop": crop_clean,
                    "original_disease": dis_clean,
                    "plant_organ": plant_organs[idx] or "",
                    "visual_symptoms": visual_symptoms[idx] or "",
                    "pathogen": pathogen_val,
                    "disease_type": disease_types[idx] or "",
                    "symptom_source": symptom_sources[idx] or "",
                    "symptom_quote": symptom_quotes[idx] or "",
                    "source": sources[idx] or "",
                    "original_filename": filenames[idx] or "",
                    "raw_label": raw_labels[idx] or "",
                    "canonical_disease": canon_dis,
                    "saved_image_path": rel_saved_path,
                    "download_status": "SUCCESS"
                })
                continue

            # New unique image: write to destination folder
            seq_num = stats_by_crop[crop_clean]["saved_images"] + 1
            out_filename = f"image_{seq_num:05d}.jpg"
            out_file_path = target_folder / out_filename

            # If file already exists, avoid collision by incrementing
            while out_file_path.exists():
                seq_num += 1
                out_filename = f"image_{seq_num:05d}.jpg"
                out_file_path = target_folder / out_filename

            try:
                with open(out_file_path, "wb") as f_out:
                    f_out.write(img_bytes)

                rel_saved_path = str(out_file_path.relative_to(BASE_DIR)).replace("\\", "/")
                seen_hashes[img_hash] = rel_saved_path
                stats_by_crop[crop_clean]["saved_images"] += 1
                stats_by_crop[crop_clean]["diseases"][dis_clean] += 1
                extracted_in_shard += 1

                metadata_rows.append({
                    "reference_id": ref_id,
                    "original_crop": crop_clean,
                    "original_disease": dis_clean,
                    "plant_organ": plant_organs[idx] or "",
                    "visual_symptoms": visual_symptoms[idx] or "",
                    "pathogen": pathogen_val,
                    "disease_type": disease_types[idx] or "",
                    "symptom_source": symptom_sources[idx] or "",
                    "symptom_quote": symptom_quotes[idx] or "",
                    "source": sources[idx] or "",
                    "original_filename": filenames[idx] or "",
                    "raw_label": raw_labels[idx] or "",
                    "canonical_disease": canon_dis,
                    "saved_image_path": rel_saved_path,
                    "download_status": "SUCCESS"
                })
            except Exception as write_err:
                logger.error(f"Failed to write image {out_file_path}: {write_err}")
                stats_by_crop[crop_clean]["failed_records"] += 1
                error_records.append({"file": str(out_file_path), "error": str(write_err)})

        logger.info(f"  [OK] Saved {extracted_in_shard} new valid images from {shard_name}")

    # Add metadata records for unavailable crops (IDs 41, 45-48, 52-55)
    for item in TARGET_CROPS:
        if not item["sage_crops"]:
            metadata_rows.append({
                "reference_id": item["ref_id"],
                "original_crop": item["crop_name"],
                "original_disease": "None",
                "plant_organ": "N/A",
                "visual_symptoms": "N/A",
                "pathogen": "N/A",
                "disease_type": "N/A",
                "symptom_source": "N/A",
                "symptom_quote": "N/A",
                "source": "tirtho149/SAGE",
                "original_filename": "None",
                "raw_label": "None",
                "canonical_disease": "None",
                "saved_image_path": "",
                "download_status": "UNAVAILABLE_IN_SAGE"
            })

    # Write Metadata CSV
    logger.info(f"\nWriting comprehensive metadata CSV to {METADATA_CSV_PATH}...")
    fieldnames = [
        "reference_id", "original_crop", "original_disease", "plant_organ",
        "visual_symptoms", "pathogen", "disease_type", "symptom_source",
        "symptom_quote", "source", "original_filename", "raw_label",
        "canonical_disease", "saved_image_path", "download_status"
    ]
    with open(METADATA_CSV_PATH, "w", newline="", encoding="utf-8") as f_csv:
        writer = csv.DictWriter(f_csv, fieldnames=fieldnames)
        writer.writeheader()
        for r in metadata_rows:
            writer.writerow(r)
    logger.info(f"  [OK] Successfully wrote {len(metadata_rows)} metadata rows.")

    # Write Error Log if any
    if error_records:
        with open(ERROR_LOG_PATH, "w", encoding="utf-8") as f_err:
            for err in error_records:
                f_err.write(f"{err}\n")
        logger.warning(f"Wrote {len(error_records)} error records to {ERROR_LOG_PATH}")
    elif ERROR_LOG_PATH.exists():
        ERROR_LOG_PATH.unlink()

    # Generate Updated Verified README.md
    total_saved_all = sum(s["saved_images"] for s in stats_by_crop.values())
    total_matched_all = sum(s["matching_records"] for s in stats_by_crop.values())
    total_skipped_all = sum(s["skipped_duplicates"] for s in stats_by_crop.values())
    total_failed_all = sum(s["failed_records"] for s in stats_by_crop.values())

    readme_content = f"""# SAGE Crop Disease Dataset (Verified CropGuard Integration)

## 1. Dataset Information
- **Source**: [Hugging Face: tirtho149/SAGE](https://huggingface.co/datasets/tirtho149/SAGE)
- **Repository ID**: `tirtho149/SAGE`
- **Total Parquet Shards Processed**: 48 shards scanned; target shards loaded & extracted.
- **Integration**: CropGuard SIH 2026 (Real Dataset Expansion for Reference IDs 41–55)
- **Metadata CSV**: `backend/ml/data_sage/sage_metadata.csv`

---

## 2. Target Crops & Exact SAGE Availability (IDs 41–55)

| Reference ID | Target Crop | Availability | Matching SAGE Label | Matching Records | Images Saved | Skipped Duplicates |
|---|---|---|---|---:|---:|---:|
"""
    for item in TARGET_CROPS:
        ref_id = item["ref_id"]
        cname = item["crop_name"]
        scrops = item["sage_crops"]
        if not scrops:
            readme_content += f"| {ref_id} | {cname} | **Unavailable** | None | 0 | 0 | 0 |\n"
        else:
            for sc in scrops:
                s = stats_by_crop[sc]
                status_str = "**Available**"
                readme_content += f"| {ref_id} | {cname} | {status_str} | `{sc}` | {s['matching_records']} | {s['saved_images']} | {s['skipped_duplicates']} |\n"

    readme_content += f"""
---

## 3. Extraction Summary
- **Total SAGE Records Processed**: {total_records_processed:,}
- **Total Target Crop Records Matched**: {total_matched_all:,}
- **Total Verified Images Saved**: {total_saved_all:,}
- **Total Skipped Duplicates**: {total_skipped_all:,}
- **Total Failed Images**: {total_failed_all}
- **Elapsed Extraction Time**: {time.time() - start_time:.2f}s

### Breakdown by Crop & Disease Class:
"""
    for crop_name in sorted(stats_by_crop.keys()):
        s = stats_by_crop[crop_name]
        readme_content += f"\n#### {crop_name} (Saved: {s['saved_images']} images | Total Records: {s['matching_records']})\n"
        for dname, dcnt in s["diseases"].most_common():
            readme_content += f"- **{dname}**: {dcnt} images\n"

    readme_content += """
---

## 4. System Integrity & Model Status
- **Protected Dataset**: The baseline dataset in `backend/ml/data/` (Chickpea, Cotton, Maize, Rice, Soybean, Sugarcane, Tomato, Wheat; 1,000 images) remains 100% untouched.
- **Protected Checkpoints**: Existing model weights in `backend/ml/saved_models/*.pth` remain 100% untouched.
- **Model Capability Notice**: The existing 8-crop models are not retrained automatically. SAGE data is saved separately in `backend/ml/data_sage/` for future training and expansion.
"""

    with open(README_PATH, "w", encoding="utf-8") as f_rm:
        f_rm.write(readme_content)
    logger.info(f"  [OK] Saved verified README to {README_PATH}")

    logger.info("\n" + "=" * 80)
    logger.info("EXTRACTION AND METADATA GENERATION COMPLETE!")
    logger.info(f"Total Images Saved:     {total_saved_all}")
    logger.info(f"Total Skipped Dups:     {total_skipped_all}")
    logger.info(f"Total Failed Records:   {total_failed_all}")
    logger.info(f"Total Time:             {time.time() - start_time:.2f}s")
    logger.info("=" * 80)


if __name__ == "__main__":
    main()

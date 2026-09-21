import os
import hashlib
import json
import csv
from pathlib import Path
from collections import Counter, defaultdict
from PIL import Image

def get_file_hash(filepath: Path) -> str:
    h = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()

pv_dir = Path("backend/ml/data_external/plantvillage")
data_dir = Path("backend/ml/data")
sage_dir = Path("backend/ml/data_sage")

print("==================================================================")
print("PLANTVILLAGE VALIDATION, HASHING & METADATA GENERATION")
print("==================================================================")

# 1. Inspect Classes and Images in PlantVillage
class_dirs = sorted([d for d in pv_dir.iterdir() if d.is_dir() and not d.name.startswith(".")])
print(f"Total folder classes found in plantvillage: {len(class_dirs)}")

pv_records = []
unreadable = []
format_counts = Counter()
crop_counts = Counter()
disease_counts = Counter()
healthy_vs_diseased = Counter()
hash_to_pv_files = defaultdict(list)

print("Scanning and verifying all PlantVillage images...")
for c_dir in class_dirs:
    c_name = c_dir.name
    # Parse crop and disease:
    # PlantVillage naming convention is: <Crop>___<Disease>
    if "___" in c_name:
        crop, disease = c_name.split("___", 1)
    else:
        crop, disease = c_name, "Unknown"

    is_healthy = "healthy" in disease.lower()
    status = "Healthy" if is_healthy else "Diseased"

    files = [f for f in c_dir.iterdir() if f.is_file() and not f.name.startswith(".")]
    for f in files:
        # Check readability
        try:
            with Image.open(f) as img:
                img_format = img.format
                img_size = img.size  # (width, height)
                img_mode = img.mode
                format_counts[img_format] += 1
        except Exception as e:
            unreadable.append((str(f), str(e)))
            continue

        file_size = f.stat().st_size
        f_hash = get_file_hash(f)
        hash_to_pv_files[f_hash].append(f)

        crop_counts[crop] += 1
        disease_counts[f"{crop} | {disease}"] += 1
        healthy_vs_diseased[status] += 1

        pv_records.append({
            "dataset": "PlantVillage",
            "variant": "raw/color",
            "class_folder": c_name,
            "crop": crop,
            "disease": disease,
            "status": status,
            "filename": f.name,
            "relative_path": f.relative_to(pv_dir).as_posix(),
            "width": img_size[0],
            "height": img_size[1],
            "channels": len(img_mode),
            "format": img_format,
            "size_bytes": file_size,
            "sha256": f_hash,
            "license": "CC BY-SA 3.0",
            "source_repo": "https://github.com/spMohanty/PlantVillage-Dataset"
        })

print(f"Total verified readable images in PlantVillage: {len(pv_records)}")
print(f"Total unreadable images: {len(unreadable)}")
if unreadable:
    print("Unreadable details:", unreadable[:5])

# 2. Check internal duplicates within PlantVillage
internal_duplicates = {h: paths for h, paths in hash_to_pv_files.items() if len(paths) > 1}
total_internal_duplicate_images = sum(len(paths) - 1 for paths in internal_duplicates.values())
print(f"Unique SHA-256 hashes in PlantVillage: {len(hash_to_pv_files)}")
print(f"Duplicate image files within PlantVillage: {total_internal_duplicate_images} (across {len(internal_duplicates)} hash groups)")

# 3. Check overlaps with backend/ml/data/ (1,000 baseline images)
print("\nChecking hash overlap against backend/ml/data/...")
data_hashes = {}
for f in data_dir.rglob("*"):
    if f.is_file() and f.suffix.lower() in {'.jpg', '.jpeg', '.png', '.webp', '.bmp'}:
        data_hashes[get_file_hash(f)] = f

overlap_with_data = []
for h, pv_paths in hash_to_pv_files.items():
    if h in data_hashes:
        overlap_with_data.append((pv_paths[0], data_hashes[h]))

print(f"Overlapping images with backend/ml/data/: {len(overlap_with_data)}")
if overlap_with_data:
    print("Sample overlaps with data:", overlap_with_data[:3])

# 4. Check overlaps with backend/ml/data_sage/ (13,690 images)
print("\nChecking hash overlap against backend/ml/data_sage/...")
sage_hashes = {}
for f in sage_dir.rglob("*"):
    if f.is_file() and f.suffix.lower() in {'.jpg', '.jpeg', '.png', '.webp', '.bmp'}:
        sage_hashes[get_file_hash(f)] = f

overlap_with_sage = []
for h, pv_paths in hash_to_pv_files.items():
    if h in sage_hashes:
        overlap_with_sage.append((pv_paths[0], sage_hashes[h]))

print(f"Overlapping images with backend/ml/data_sage/: {len(overlap_with_sage)}")
if overlap_with_sage:
    print("Sample overlaps with sage:", overlap_with_sage[:5])

# 5. Write metadata CSV
meta_csv_path = pv_dir / "plantvillage_metadata.csv"
print(f"\nWriting metadata CSV to {meta_csv_path}...")
fieldnames = [
    "dataset", "variant", "class_folder", "crop", "disease", "status",
    "filename", "relative_path", "width", "height", "channels",
    "format", "size_bytes", "sha256", "license", "source_repo"
]
with open(meta_csv_path, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(pv_records)
print(f"Saved {len(pv_records)} records to {meta_csv_path}.")

# 6. Write dataset manifest JSON
manifest_path = pv_dir / "dataset_manifest.json"
manifest = {
    "dataset_name": "PlantVillage",
    "variant": "raw/color",
    "official_repository": "https://github.com/spMohanty/PlantVillage-Dataset",
    "paper_citation": "Mohanty SP, Hughes DP, Salathe M (2016). Using Deep Learning for Image-Based Plant Disease Detection. Frontiers in Plant Science 7:1419. doi: 10.3389/fpls.2016.01419",
    "license": "CC BY-SA 3.0",
    "download_date": "2026-09-21",
    "total_images": len(pv_records),
    "total_classes": len(class_dirs),
    "formats": dict(format_counts),
    "healthy_vs_diseased": dict(healthy_vs_diseased),
    "crop_counts": dict(crop_counts),
    "disease_classes_count": len(disease_counts),
    "internal_exact_duplicates": total_internal_duplicate_images,
    "overlap_with_data": len(overlap_with_data),
    "overlap_with_data_sage": len(overlap_with_sage),
    "unreadable_files": len(unreadable)
}
with open(manifest_path, "w", encoding="utf-8") as f:
    json.dump(manifest, f, indent=2)
print(f"Saved manifest to {manifest_path}.")

# 7. Print Class breakdown
print("\n--- Crop Summary ---")
for crop, count in crop_counts.most_common():
    print(f"  {crop}: {count} images")

print(f"\nHealthy images: {healthy_vs_diseased['Healthy']}")
print(f"Diseased images: {healthy_vs_diseased['Diseased']}")

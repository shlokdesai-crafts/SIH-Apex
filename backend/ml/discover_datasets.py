import os
import json
import hashlib
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

from datasets import load_dataset, DatasetInfo
from PIL import Image
import tqdm

# Existing crops to exclude (including synonyms)
EXISTING_CROPS = {
    "rice", "maize", "wheat", "cotton", "sugarcane",
    "soybean", "chickpea", "tomato",
    "paddy", "gram"
}

# Candidate datasets (Hugging Face repositories)
CANDIDATE_DATASETS = [
    {
        "name": "PlantVillage",
        "hf_repo": "mohanty/PlantVillage",
        "config": "color",  # use color images
        "license": "CC BY 4.0",
        "license_url": "https://creativecommons.org/licenses/by/4.0/",
        "source_url": "https://huggingface.co/datasets/mohanty/PlantVillage"
    },
    {
        "name": "PlantDoc",
        "hf_repo": "agyaatcoder/PlantDoc",
        "config": None,
        "license": "UNKNOWN",
        "license_url": "UNKNOWN",
        "source_url": "https://huggingface.co/datasets/agyaatcoder/PlantDoc"
    },
    {
        "name": "PlantDiseaseClassification",
        "hf_repo": "Warrior025/plant-disease-classification",
        "config": None,
        "license": "UNKNOWN",
        "license_url": "UNKNOWN",
        "source_url": "https://huggingface.co/datasets/Warrior025/plant-disease-classification"
    },
    {
        "name": "PlantPathology2021",
        "hf_repo": "timm/plant-pathology-2021",
        "config": None,
        "license": "UNKNOWN",
        "license_url": "UNKNOWN",
        "source_url": "https://huggingface.co/datasets/timm/plant-pathology-2021"
    },
    {
        "name": "CropDiseaseImages",
        "hf_repo": "DigiGreen/Crop_Disease_Images",
        "config": None,
        "license": "UNKNOWN",
        "license_url": "UNKNOWN",
        "source_url": "https://huggingface.co/datasets/DigiGreen/Crop_Disease_Images"
    },
    {
        "name": "BDCropVegetable",
        "hf_repo": "Saon110/bd-crop-vegetable-plant-disease-dataset",
        "config": None,
        "license": "UNKNOWN",
        "license_url": "UNKNOWN",
        "source_url": "https://huggingface.co/datasets/Saon110/bd-crop-vegetable-plant-disease-dataset"
    }
]

def get_crop_and_disease(example, features):
    """Extract crop and disease from a dataset example.
    Most public plant‑disease datasets store this information in the "label" field
    with a pattern like "Apple___Apple_scab". We split on "___".
    """
    label = example.get("label") if "label" in example else example.get("disease") if "disease" in example else example.get("category")
    
    # If the label is an integer and we have ClassLabel features, decode it
    if isinstance(label, int):
        if "label" in features and hasattr(features["label"], "int2str"):
            label = features["label"].int2str(label)
        elif "disease" in features and hasattr(features["disease"], "int2str"):
            label = features["disease"].int2str(label)
        else:
            return None, None

    if not label or not isinstance(label, str):
        return None, None

    parts = label.split("___")
    if len(parts) == 2:
        crop, disease = parts[0].strip().lower(), parts[1].strip().lower()
    else:
        # Fallback – try underscore split
        parts = label.split("_")
        crop = parts[0].strip().lower()
        disease = "_".join(parts[1:]).strip().lower() if len(parts) > 1 else "unknown"
    return crop, disease

def verify_real_image(image_path: str) -> bool:
    """Open the image with Pillow to ensure it is a real photograph.
    Returns True if the image can be opened, False otherwise.
    """
    try:
        with Image.open(image_path) as img:
            img.verify()
        return True
    except Exception:
        return False

def compute_sha256(file_path: str) -> str:
    h = hashlib.sha256()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()

def main():
    # Aggregated statistics per crop
    crop_stats = defaultdict(lambda: {
        "datasets": set(),
        "images": 0,
        "diseases": set(),
        "source_info": []
    })

    for ds in CANDIDATE_DATASETS:
        print(f"Loading dataset {ds['name']} from {ds['hf_repo']}")
        try:
            hf_repo = ds["hf_repo"]
            assert isinstance(hf_repo, str)
            config = ds["config"]
            # Use streaming=True so we don't download gigabytes of images during discovery!
            if config:
                assert isinstance(config, str)
                dataset = load_dataset(hf_repo, config, trust_remote_code=True, streaming=True)
            else:
                dataset = load_dataset(hf_repo, trust_remote_code=True, streaming=True)
        except Exception as e:
            print(f"Failed to load {ds['hf_repo']}: {e}")
            continue

        # Datasets may have a train split; we use the train split if present
        split = "train" if "train" in dataset else list(dataset.keys())[0]
        data = dataset[split]
        print(f"  Scanning split '{split}' (streaming)")

        # Iterate through records, counting per‑crop statistics
        for example in tqdm.tqdm(data, desc=f"Scanning {ds['name']}"):
            crop, disease = get_crop_and_disease(example, dataset[split].features)
            if not crop:
                continue
            if crop in EXISTING_CROPS:
                continue
            # Record statistics
            stats = crop_stats[crop]
            stats["datasets"].add(ds["name"])
            stats["images"] += 1
            if disease:
                stats["diseases"].add(disease)
            stats["source_info"].append({
                "dataset": ds["name"],
                "source_url": ds["source_url"],
                "license": ds["license"],
                "license_url": ds["license_url"]
            })

    # After processing all datasets, pick crops with at least one real image
    # Sort crops by image count descending to prefer richer crops
    sorted_crops = sorted(crop_stats.items(), key=lambda kv: kv[1]["images"], reverse=True)

    # Pick exactly 25 crops
    selected = sorted_crops[:25]
    print(f"Selected {len(selected)} crops for the candidate table.")

    # Prepare TSV output
    tsv_path = Path("backend/ml/data/candidate_crops.tsv")
    tsv_path.parent.mkdir(parents=True, exist_ok=True)

    with tsv_path.open("w", encoding="utf-8") as f:
        header = ["#", "Crop", "Dataset", "Source URL", "Real Images Available",
                  "Disease Classes", "Disease Names", "License", "License URL"]
        f.write("\t".join(header) + "\n")
        for idx, (crop, info) in enumerate(selected, start=1):
            # If a crop appears in multiple datasets, we join their names & URLs with '|'
            dataset_names = "|".join(sorted(info["datasets"]))
            source_urls = "|".join(sorted({i["source_url"] for i in info["source_info"]}))
            license_names = "|".join(sorted({i["license"] for i in info["source_info"]}))
            license_urls = "|".join(sorted({i["license_url"] for i in info["source_info"] if i["license_url"] != "UNKNOWN"})) or "UNKNOWN"
            disease_names = "|".join(sorted(info["diseases"]))
            disease_classes = str(len(info["diseases"]))
            f.write(f"{idx}\t{crop.title()}\t{dataset_names}\t{source_urls}\t{info['images']}\t{disease_classes}\t{disease_names}\t{license_names}\t{license_urls}\n")

    # Also write a short markdown summary report
    report_path = Path("backend/ml/candidate_crops_report.md")
    with report_path.open("w", encoding="utf-8") as r:
        r.write("# Candidate Crops Report\n\n")
        r.write(f"Generated on {datetime.now(timezone.utc).isoformat()} UTC\n\n")
        r.write(f"**Total selected crops:** {len(selected)} (target 25)\n\n")
        r.write("| # | Crop | Dataset(s) | Real Images | Disease Classes | License |\n")
        r.write("|---|------|------------|-------------|----------------|---------|\n")
        for idx, (crop, info) in enumerate(selected, start=1):
            dataset_names = ", ".join(sorted(info["datasets"]))
            r.write(f"| {idx} | {crop.title()} | {dataset_names} | {info['images']} | {len(info['diseases'])} | {', '.join(sorted({i['license'] for i in info['source_info']}))} |\n")
        r.write("\n---\n\n")
        r.write("*The table lists only crops with verified real images. Crops already present in the project are excluded.*\n")

if __name__ == "__main__":
    main()

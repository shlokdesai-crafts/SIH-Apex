"""
backend/ml/inspect_sage.py
─────────────────────────
Inspects tirtho149/SAGE dataset schema, splits, features, and available crops/diseases.
Safely checks Hugging Face auth without printing tokens.
"""

import sys
import json
from datasets import load_dataset, get_dataset_config_names, get_dataset_split_names

def check_auth():
    try:
        from huggingface_hub import HfApi, whoami
        user_info = whoami()
        username = user_info.get("name") or user_info.get("fullname") or "Authenticated User"
        print(f"[AUTH] Logged in to Hugging Face as: {username}")
        return True
    except Exception as e:
        print(f"[AUTH] Hugging Face whoami check: {e}")
        return False

def inspect_dataset():
    repo_id = "tirtho149/SAGE"
    print(f"\n[SAGE] Inspecting repository: {repo_id}")
    
    # 1. Configs & Splits
    try:
        configs = get_dataset_config_names(repo_id)
        print(f"[SAGE] Configurations available: {configs}")
    except Exception as e:
        print(f"[SAGE] Could not get config names: {e}")
        configs = ["default"]

    for cfg in configs[:3]:
        try:
            splits = get_dataset_split_names(repo_id, config_name=cfg)
            print(f"[SAGE] Config '{cfg}' splits: {splits}")
        except Exception as e:
            print(f"[SAGE] Could not get split names for {cfg}: {e}")

    # 2. Inspect streaming dataset
    print("\n[SAGE] Loading streaming dataset...")
    try:
        ds = load_dataset(repo_id, split="train", streaming=True)
        # Inspect features
        print("[SAGE] Features schema:")
        for feat_name, feat_type in ds.features.items():
            print(f"  - {feat_name}: {feat_type}")
            
        # Sample first 20 records
        print("\n[SAGE] Sampling first 20 records to understand fields and structure...")
        samples = []
        for i, item in enumerate(ds):
            # Exclude raw image data from printing
            sample_meta = {k: v for k, v in item.items() if k != "image"}
            samples.append(sample_meta)
            if i >= 19:
                break
        print(json.dumps(samples[:5], indent=2))
        return ds.features
    except Exception as e:
        print(f"[SAGE] Error loading streaming dataset: {e}")
        return None

if __name__ == "__main__":
    check_auth()
    inspect_dataset()

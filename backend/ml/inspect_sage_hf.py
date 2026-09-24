"""
backend/ml/inspect_sage_hf.py
────────────────────────────
Inspects tirtho149/SAGE using huggingface_hub directly.
Lists dataset info, files, README / dataset card, and structure.
"""

from huggingface_hub import HfApi, whoami, hf_hub_download
import json

def run():
    # 1. Auth check
    print("--- Hugging Face Auth Check ---")
    try:
        user = whoami()
        # Do not print access token
        user_name = user.get("name", "Unknown")
        user_type = user.get("type", "user")
        print(f"Auth Status: SUCCESS (User: {user_name}, Type: {user_type})")
    except Exception as e:
        print(f"Auth Status: Unauthenticated or Error ({e}) - SAGE may be public or gated")

    # 2. Dataset Info
    api = HfApi()
    repo_id = "tirtho149/SAGE"
    print(f"\n--- Fetching Dataset Info for '{repo_id}' ---")
    try:
        info = api.dataset_info(repo_id)
        print(f"Dataset ID: {info.id}")
        print(f"Private: {info.private}")
        print(f"Gated: {info.gated}")
        print(f"Downloads: {info.downloads}")
        print(f"Tags: {info.tags}")
        print(f"Card Data / Metadata: {json.dumps(info.card_data, indent=2, default=str) if info.card_data else 'None'}")
    except Exception as e:
        print(f"Failed to fetch dataset info: {e}")

    # 3. List Repo Files
    print(f"\n--- Listing Files in '{repo_id}' ---")
    try:
        files = api.list_repo_files(repo_id, repo_type="dataset")
        print(f"Total files in repo: {len(files)}")
        for f in files[:30]:
            print(f"  {f}")
        if len(files) > 30:
            print(f"  ... and {len(files) - 30} more files")
    except Exception as e:
        print(f"Failed to list files: {e}")

if __name__ == "__main__":
    run()

import os
from huggingface_hub import hf_hub_download, list_repo_files
import zipfile

print("=== Checking pt-sk/Cashew_Dataset ===")
try:
    cashew_zip = hf_hub_download(repo_id="pt-sk/Cashew_Dataset", filename="Cashew.zip", repo_type="dataset")
    print(f"Downloaded Cashew.zip: {os.path.getsize(cashew_zip)} bytes")
    with zipfile.ZipFile(cashew_zip, 'r') as z:
        names = z.namelist()
        print(f"Total entries in Cashew.zip: {len(names)}")
        folders = set(n.split('/')[1] if '/' in n else n for n in names if '/' in n)
        print(f"Top folders/classes: {folders}")
except Exception as e:
    print(f"Cashew error: {e}")

print("\n=== Checking sauriber/cocoa_diseases ===")
try:
    cocoa_zip = hf_hub_download(repo_id="sauriber/cocoa_diseases", filename="COCOA_DATASET_CLEAN.zip", repo_type="dataset")
    print(f"Downloaded COCOA_DATASET_CLEAN.zip: {os.path.getsize(cocoa_zip)} bytes")
    with zipfile.ZipFile(cocoa_zip, 'r') as z:
        names = z.namelist()
        print(f"Total entries in COCOA_DATASET_CLEAN.zip: {len(names)}")
        folders = set(n.split('/')[1] if '/' in n else n for n in names if '/' in n)
        print(f"Top folders/classes: {folders}")
except Exception as e:
    print(f"Cocoa error: {e}")

print("\n=== Checking dffesalbon/rubber-tree-leaf-disease-ph-labeled ===")
try:
    files = list_repo_files("dffesalbon/rubber-tree-leaf-disease-ph-labeled", repo_type="dataset")
    classes = set(f.split('/')[0] for f in files if '/' in f)
    print(f"Rubber classes: {classes}")
    print(f"Total files: {len(files)}")
except Exception as e:
    print(f"Rubber error: {e}")

print("\n=== Checking Project-AgML/arabica_coffee_leaf_disease_classification ===")
try:
    files = list_repo_files("Project-AgML/arabica_coffee_leaf_disease_classification", repo_type="dataset")
    print(f"Coffee files: {files}")
except Exception as e:
    print(f"Coffee error: {e}")

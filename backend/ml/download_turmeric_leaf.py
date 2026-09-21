from huggingface_hub import HfApi, hf_hub_download
import pandas as pd
import os

api = HfApi()
files = list(api.list_repo_files("Project-AgML/turmeric_leaf_disease_classification", repo_type="dataset"))
raw_parquets = [f for f in files if f.startswith("raw/")]
print("Raw parquets in turmeric_leaf:", raw_parquets)

total_rows = 0
for rp in raw_parquets:
    loc = hf_hub_download("Project-AgML/turmeric_leaf_disease_classification", rp, repo_type="dataset")
    df = pd.read_parquet(loc)
    total_rows += len(df)
    print(f"  {rp}: {len(df)} rows, labels: {df['label'].value_counts().to_dict()}")

print(f"Total raw images in turmeric_leaf: {total_rows}")

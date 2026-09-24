import pandas as pd
import io
from PIL import Image
from huggingface_hub import hf_hub_download

print("Downloading parquet shard for Project-AgML/turmeric_disease_classification...")
local_path = hf_hub_download(
    repo_id="Project-AgML/turmeric_disease_classification",
    filename="raw/train-00000-of-00001.parquet",
    repo_type="dataset"
)
print("Downloaded to:", local_path)

df = pd.read_parquet(local_path)
print("Shape:", df.shape)
print("Columns:", df.columns.tolist())
print("Label counts:\n", df['label'].value_counts())
sample_img = df.iloc[0]['image']
if isinstance(sample_img, dict) and 'bytes' in sample_img:
    img = Image.open(io.BytesIO(sample_img['bytes']))
    print("Sample image format/size:", img.format, img.size)

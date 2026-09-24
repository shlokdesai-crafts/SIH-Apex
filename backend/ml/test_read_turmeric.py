import pandas as pd
import io
from PIL import Image

for ds_name, parquet_file in [
    ("turmeric_leaf", "hf://datasets/Project-AgML/turmeric_leaf_disease_classification/raw/train-00000-of-00007.parquet"),
    ("turmeric_disease", "hf://datasets/Project-AgML/turmeric_disease_classification/raw/train-00000-of-00001.parquet"),
    ("rubber", "hf://datasets/dffesalbon/rubber-tree-leaf-disease-ph-labeled")
]:
    print(f"\nTesting {ds_name}...")
    try:
        if "parquet" in parquet_file:
            df = pd.read_parquet(parquet_file)
            print("Columns:", df.columns.tolist())
            print("Shape:", df.shape)
            sample = df.iloc[0]
            print("Label:", sample.get('label'))
            img_data = sample.get('image')
            print("Image type:", type(img_data))
            if isinstance(img_data, dict) and 'bytes' in img_data:
                img = Image.open(io.BytesIO(img_data['bytes']))
                print("Decoded image size:", img.size, img.format)
    except Exception as e:
        print("Error:", e)

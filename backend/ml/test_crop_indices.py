from huggingface_hub import hf_hub_download
import pyarrow.parquet as pq
import numpy as np

path = hf_hub_download(repo_id='tirtho149/SAGE', filename='sage_metadata.parquet', repo_type='dataset')
table = pq.read_table(path, columns=['crop', 'disease', 'filename', 'source'])
print("Total rows:", len(table))

# Find row indices for our target crops
crops_of_interest = ['Ginger', 'Garlic', 'Tea', 'Coffee', 'Cashew', 'Pepper', 'Banana', 'Mango', 'Pomegranate', 'Coconut', 'Onion', 'Chili', 'Grape', 'Papaya', 'Guava']

crop_arr = table['crop'].to_numpy(zero_copy_only=False)
for c in crops_of_interest:
    idx = np.where(crop_arr == c)[0]
    if len(idx) > 0:
        print(f"Crop {c}: {len(idx)} rows, first row index = {idx[0]}, last = {idx[-1]}")
    else:
        print(f"Crop {c}: 0 rows")

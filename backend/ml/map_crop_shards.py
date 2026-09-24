import pyarrow.parquet as pq
from huggingface_hub import HfFileSystem, hf_hub_download
from collections import defaultdict
import json

fs = HfFileSystem()
items = fs.ls("datasets/tirtho149/SAGE/data")
files = sorted([item['name'] if isinstance(item, dict) else item for item in items if (item['name'] if isinstance(item, dict) else item).endswith(".parquet")])

# 1. Get row boundaries for all 48 parquet files
print("Reading row counts for 48 parquet files...")
shard_bounds = []
curr_start = 0
for f in files:
    with fs.open(f, "rb") as s:
        pf = pq.ParquetFile(s)
        n = pf.metadata.num_rows
        shard_bounds.append((f, curr_start, curr_start + n))
        curr_start += n

print(f"Total rows mapped across all shards: {curr_start}")

# 2. Load metadata
path = hf_hub_download(repo_id='tirtho149/SAGE', filename='sage_metadata.parquet', repo_type='dataset')
table = pq.read_table(path, columns=['crop', 'disease', 'filename'])
crops = table['crop'].to_pylist()

def find_shard(global_row_idx):
    for f, start, end in shard_bounds:
        if start <= global_row_idx < end:
            return f, global_row_idx - start
    return None, None

# 3. Check for our target crops and selected crops
selected_crops = [
    'Ginger', 'Garlic', 'Pepper', 'Tea', 'Coffee', 'Cashew',
    'Banana', 'Mango', 'Onion', 'Grape', 'Papaya', 'Cauliflower',
    'Eggplant', 'Cucumber', 'Melon'
]

crop_shard_map = defaultdict(lambda: defaultdict(list))
for idx, c in enumerate(crops):
    if c in selected_crops:
        shard_file, local_idx = find_shard(idx)
        crop_shard_map[c][shard_file].append(local_idx)

print("\n--- SHARD DISTRIBUTION FOR SELECTED 15 CROPS ---")
all_needed_shards = set()
for c in selected_crops:
    shards = crop_shard_map[c]
    total_imgs = sum(len(indices) for indices in shards.values())
    print(f"Crop '{c}': {total_imgs} images across {len(shards)} shards")
    for s, indices in shards.items():
        shard_name = s.split('/')[-1]
        all_needed_shards.add(s)
        # print(f"   {shard_name}: {len(indices)} images")

print(f"\nTotal unique parquet shards needed: {len(all_needed_shards)} out of 48")
for s in sorted(all_needed_shards):
    print("  ", s.split('/')[-1])

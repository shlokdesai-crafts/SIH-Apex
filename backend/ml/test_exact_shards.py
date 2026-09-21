import pyarrow.parquet as pq
from huggingface_hub import HfFileSystem, hf_hub_download

fs = HfFileSystem()
items = fs.ls("datasets/tirtho149/SAGE/data")
files = sorted([item['name'] if isinstance(item, dict) else item for item in items if (item['name'] if isinstance(item, dict) else item).endswith(".parquet")])

shard_bounds = []
curr_start = 0
for f in files:
    with fs.open(f, "rb") as s:
        pf = pq.ParquetFile(s)
        n = pf.metadata.num_rows
        shard_bounds.append((f.split('/')[-1], curr_start, curr_start + n))
        curr_start += n

path = hf_hub_download(repo_id='tirtho149/SAGE', filename='sage_metadata.parquet', repo_type='dataset')
table = pq.read_table(path, columns=['crop', 'disease'])
crops = table['crop'].to_pylist()

selected_crops = [
    'Ginger', 'Garlic', 'Pepper', 'Tea', 'Coffee', 'Cashew',
    'Banana', 'Mango', 'Onion', 'Grape', 'Papaya', 'Cauliflower',
    'Eggplant', 'Cucumber', 'Melon'
]

print("=== EXACT SHARD ASSIGNMENTS ===")
for sc in selected_crops:
    crop_indices = [i for i, c in enumerate(crops) if c == sc]
    if not crop_indices:
        print(f"Crop {sc}: NOT FOUND")
        continue
    # find shards
    shards_found = {}
    for idx in crop_indices:
        for fname, s_start, s_end in shard_bounds:
            if s_start <= idx < s_end:
                shards_found[fname] = shards_found.get(fname, 0) + 1
                break
    print(f"Crop '{sc}' (Total {len(crop_indices)}): {shards_found}")

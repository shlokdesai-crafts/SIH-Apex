import pyarrow.parquet as pq
from huggingface_hub import HfFileSystem
from concurrent.futures import ThreadPoolExecutor
from collections import Counter
import json
import time

fs = HfFileSystem()
items = fs.ls("datasets/tirtho149/SAGE/data")
filenames = sorted([item['name'] for item in items if item['name'].endswith('.parquet')])

print(f"Scanning {len(filenames)} parquet files for crop contents in parallel...")

shard_crops = {}

def scan_file(f):
    try:
        with fs.open(f, "rb") as s:
            pf = pq.ParquetFile(s)
            meta = pf.read(columns=['crop'])
            counts = Counter(meta['crop'].to_pylist())
            fname = f.split('/')[-1]
            return fname, counts
    except Exception as e:
        return f.split('/')[-1], str(e)

t0 = time.time()
with ThreadPoolExecutor(max_workers=8) as ex:
    results = list(ex.map(scan_file, filenames))

for fname, res in results:
    if isinstance(res, Counter):
        shard_crops[fname] = res
    else:
        print(f"Error on {fname}: {res}")

print(f"Finished scanning all 48 shards in {time.time() - t0:.2f}s!")

# Save to json for reference
with open("backend/ml/shard_crop_map.json", "w", encoding="utf-8") as f:
    json.dump({k: dict(v) for k, v in shard_crops.items()}, f, indent=2)

# Now check where our target crops live
targets = ['Ginger', 'Garlic', 'Tea', 'Coffee', 'Cashew', 'Pepper', 'Banana', 'Mango', 'Onion', 'Grape', 'Papaya', 'Cauliflower', 'Eggplant', 'Cucumber', 'Melon', 'Chili', 'Pomegranate']

print("\n=== ACCURATE SHARD LOCATIONS FOR CROPS ===")
for t in targets:
    shards_with_t = {fname: counts[t] for fname, counts in shard_crops.items() if t in counts and counts[t] > 0}
    print(f"Crop '{t}': {shards_with_t}")

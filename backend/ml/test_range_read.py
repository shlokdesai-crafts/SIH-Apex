import pyarrow.parquet as pq
from huggingface_hub import HfFileSystem
import time

fs = HfFileSystem()
f = "datasets/tirtho149/SAGE/data/train-00041.parquet"

print(f"Opening {f} with range requests...")
t0 = time.time()
with fs.open(f, "rb") as s:
    pf = pq.ParquetFile(s)
    print(f"Num row groups: {pf.num_row_groups}, rows: {pf.metadata.num_rows}")
    # Read just the 'crop', 'disease' columns first
    meta = pf.read(columns=['crop', 'disease'])
    print(f"Read metadata in {time.time() - t0:.2f}s")
    crops = meta['crop'].to_pylist()
    ginger_indices = [i for i, c in enumerate(crops) if c == 'Ginger']
    print(f"Found {len(ginger_indices)} Ginger rows in this shard!")

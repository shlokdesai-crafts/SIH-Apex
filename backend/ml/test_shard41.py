import pyarrow.parquet as pq
from huggingface_hub import HfFileSystem
from collections import Counter

fs = HfFileSystem()
f = "datasets/tirtho149/SAGE/data/train-00041.parquet"
with fs.open(f, "rb") as s:
    pf = pq.ParquetFile(s)
    meta = pf.read(columns=['crop', 'disease'])
    crops = Counter(meta['crop'].to_pylist())
    print("Crops in train-00041.parquet:", crops)

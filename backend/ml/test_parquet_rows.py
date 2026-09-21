import fsspec
import pyarrow.parquet as pq
from huggingface_hub import HfFileSystem

fs = HfFileSystem()
items = fs.ls("datasets/tirtho149/SAGE/data")
files = sorted([item['name'] if isinstance(item, dict) else item for item in items if (item['name'] if isinstance(item, dict) else item).endswith(".parquet")])
print(f"Found {len(files)} parquet files.")

for f in files[:5]:
    with fs.open(f, "rb") as s:
        pf = pq.ParquetFile(s)
        print(f"{f}: {pf.metadata.num_rows} rows")

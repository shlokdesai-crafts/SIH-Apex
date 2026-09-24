import pyarrow.parquet as pq
from huggingface_hub import HfFileSystem
import io
from PIL import Image

fs = HfFileSystem()
f = "datasets/tirtho149/SAGE/data/train-00044.parquet"
with fs.open(f, "rb") as s:
    pf = pq.ParquetFile(s)
    table = pf.read(columns=['crop', 'disease', 'filename', 'image'])
    crops = table['crop'].to_pylist()
    idx = crops.index('Ginger')
    print(f"Row {idx}: crop={crops[idx]}, disease={table['disease'][idx]}")
    img_data = table['image'][idx].as_py()
    print("img_data type:", type(img_data), "keys:", img_data.keys() if isinstance(img_data, dict) else "not dict")
    raw_bytes = img_data['bytes']
    print(f"Raw bytes len: {len(raw_bytes)}")
    # Verify image opens with PIL
    im = Image.open(io.BytesIO(raw_bytes))
    print(f"Image format: {im.format}, size: {im.size}, mode: {im.mode}")

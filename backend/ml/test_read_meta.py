from huggingface_hub import hf_hub_download
import pyarrow.parquet as pq

path = hf_hub_download(repo_id='tirtho149/SAGE', filename='sage_metadata.parquet', repo_type='dataset')
table = pq.read_table(path)
print('Columns:', table.column_names)
print('Row count:', table.num_rows)
print('Sample row 0:', {col: table[col][0].as_py() for col in table.column_names})

import urllib.request
import json

file_id = "8c60201f-d78b-417b-acdf-be74e3764685"
ds_id = "g46dvrcvwn"

u = f"https://data.mendeley.com/public-api/datasets/{ds_id}/files/{file_id}/file"
req = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
with urllib.request.urlopen(req) as resp:
    text = resp.read().decode('utf-8')
    print("Response JSON:")
    print(text)

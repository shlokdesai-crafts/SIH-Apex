import urllib.request
import json

datasets = ["g46dvrcvwn", "jtttfbx342", "cp65skff89"]

for ds_id in datasets:
    url = f"https://data.mendeley.com/public-api/datasets/{ds_id}"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            print(f"\n==================== {ds_id} ====================")
            print("Name:", data.get("name"))
            print("Version:", data.get("version"))
            print("License:", data.get("licence", {}).get("name"))
            files = data.get("files", [])
            print(f"Files count: {len(files)}")
            for f in files:
                print(f"  - File ID: {f.get('id')}, name: {f.get('filename')}, size: {f.get('size')} bytes, mime: {f.get('content_type')}")
                print(f"    download_url: {f.get('download_url')}")
    except Exception as e:
        print(f"Error {ds_id}: {e}")

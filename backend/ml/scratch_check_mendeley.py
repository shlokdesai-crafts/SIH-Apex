import urllib.request
import json

datasets = [
    ("g46dvrcvwn/2", "https://data.mendeley.com/api/datasets/g46dvrcvwn/2"),
    ("jtttfbx342/1", "https://data.mendeley.com/api/datasets/jtttfbx342/1"),
]

for did, url in datasets:
    print(f"\n=== Querying Mendeley {did} ===")
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode())
            print(f"Name: {data.get('name')}")
            print(f"Description snippet: {str(data.get('description'))[:200]}")
            print(f"Categories: {data.get('categories')}")
            print(f"Licence: {data.get('licence')}")
            files = data.get('files', [])
            print(f"Files count: {len(files)}")
            for f in files:
                print(f"  - {f.get('filename')} ({f.get('size')} bytes): {f.get('download_url')}")
    except Exception as e:
        print(f"Error querying {did}: {e}")

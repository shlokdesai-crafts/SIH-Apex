import urllib.request
import json

urls = [
    ("g46dvrcvwn/2", "https://data.mendeley.com/api/datasets/g46dvrcvwn/2/download"),
    ("jtttfbx342/1", "https://data.mendeley.com/api/datasets/jtttfbx342/1/download"),
]

for did, u in urls:
    print(f"\n=== Inspecting {did} download JSON ===")
    req = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode())
        print(f"Type: {type(data)}")
        if isinstance(data, dict):
            print("Keys:", list(data.keys()))
            for k in list(data.keys())[:5]:
                print(f"  {k}: {str(data[k])[:100]}")
        elif isinstance(data, list):
            print(f"List length: {len(data)}")
            for item in data[:3]:
                print("  Item:", item)

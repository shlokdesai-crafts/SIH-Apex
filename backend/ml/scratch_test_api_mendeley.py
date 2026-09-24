import urllib.request
import json

urls = [
    "https://api.data.mendeley.com/datasets/g46dvrcvwn/2",
    "https://api.data.mendeley.com/datasets/g46dvrcvwn/2/files",
    "https://api.data.mendeley.com/datasets/jtttfbx342/1",
    "https://api.data.mendeley.com/datasets/jtttfbx342/1/files",
]

for u in urls:
    print(f"\nFetching {u}...")
    req = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode())
            print(f"Success! Keys: {list(data.keys()) if isinstance(data, dict) else len(data)}")
            if isinstance(data, dict):
                print("Name:", data.get("name"))
                if "files" in data:
                    print("Files in dict:", len(data["files"]))
                    for f in data["files"][:3]:
                        print(" ", f)
            elif isinstance(data, list):
                print("List items:", len(data))
                for item in data[:3]:
                    print(" ", item)
    except Exception as e:
        print(f"Failed: {e}")

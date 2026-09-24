import urllib.request
import json

urls = [
    "https://data.mendeley.com/api/docs",
    "https://api.data.mendeley.com/api/docs",
    "https://data.mendeley.com/api/swagger.json",
    "https://api.data.mendeley.com/swagger.json"
]

for u in urls:
    req = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req) as resp:
            print(f"{u} -> {resp.status}, {resp.headers.get('Content-Type')}")
            content = resp.read()
            print(f"   Length: {len(content)}")
    except Exception as e:
        print(f"{u} -> Error: {e}")

import urllib.request
import json

req = urllib.request.Request("https://data.mendeley.com/api/swagger.json", headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as resp:
    text = resp.read().decode('utf-8')
    spec = json.loads(text)

print("Swagger base path:", spec.get("basePath"))
paths = spec.get("paths", {})
print(f"Total paths in swagger: {len(paths)}")
for p in sorted(paths.keys()):
    if any(k in p for k in ["dataset", "file", "download"]):
        print(f"  {p} -> {list(paths[p].keys())}")

import urllib.request
import re
import json

u = "https://data.mendeley.com/datasets/g46dvrcvwn/2"
req = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
with urllib.request.urlopen(req) as resp:
    html = resp.read().decode('utf-8', errors='ignore')

# Search for window.__PRELOADED_STATE__ or json-ld
json_ld = re.findall(r'<script type="application/ld\+json">(.*?)</script>', html, re.S)
print(f"JSON-LD count: {len(json_ld)}")
for j in json_ld:
    try:
        d = json.loads(j)
        print("JSON-LD keys:", list(d.keys()))
        if 'distribution' in d:
            print("Distribution:", d['distribution'])
    except Exception as e:
        print("JSON-LD parse error:", e)

# Search for any data URLs or s3 URLs in html
urls = set(re.findall(r'https://[a-zA-Z0-9.\-_/]+\b', html))
relevant = [x for x in urls if any(k in x for k in ['s3', 'mendeley', 'download', 'file', 'content'])]
print("Relevant URLs in page:")
for r in sorted(relevant)[:20]:
    print(" ", r)

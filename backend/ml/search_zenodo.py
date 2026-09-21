import urllib.request
import json

def search_zenodo(query):
    url = f"https://zenodo.org/api/records?q={urllib.parse.quote(query)}&size=5"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            hits = data.get('hits', {}).get('hits', [])
            print(f"\n[Zenodo: '{query}'] -> {len(hits)} hits")
            for h in hits:
                meta = h.get('metadata', {})
                print(f"  - Title: {meta.get('title')}")
                print(f"    DOI: {meta.get('doi')}")
                print(f"    URL: {h.get('links', {}).get('html')}")
                files = h.get('files', [])
                print(f"    Files: {[f.get('key') for f in files[:3]]}")
    except Exception as e:
        print(f"\n[Zenodo: '{query}'] error: {e}")

zenodo_queries = [
    "arecanut disease",
    "oil palm leaf disease",
    "black pepper disease",
    "cardamom disease",
    "cumin disease",
    "coriander disease",
    "fenugreek disease"
]

for q in zenodo_queries:
    search_zenodo(q)

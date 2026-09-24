import urllib.request
import json

endpoints = [
    "https://data.mendeley.com/public-api/datasets/g46dvrcvwn/2",
    "https://data.mendeley.com/public-api/datasets/g46dvrcvwn",
    "https://data.mendeley.com/api/datasets/g46dvrcvwn/2",
    "https://data.mendeley.com/api/datasets/g46dvrcvwn",
    "https://data.mendeley.com/datasets/g46dvrcvwn/2/files",
    "https://data.mendeley.com/public-api/datasets/g46dvrcvwn/2/files",
    "https://api.mendeley.com/datasets/g46dvrcvwn/2",
    "https://data.mendeley.com/datasets/g46dvrcvwn/2/download"
]

for ep in endpoints:
    req = urllib.request.Request(ep, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Accept': 'application/json'})
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            print(f"SUCCESS {ep} -> {resp.status}, Content-Type: {resp.headers.get('Content-Type')}")
            sample = resp.read()[:200]
            print(" ", sample)
    except urllib.error.HTTPError as e:
        print(f"HTTP {e.code} {ep}")
    except Exception as e:
        print(f"Error {ep}: {e}")

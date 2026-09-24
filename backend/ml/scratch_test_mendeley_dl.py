import urllib.request

patterns = [
    "https://data.mendeley.com/datasets/g46dvrcvwn/2/download",
    "https://data.mendeley.com/datasets/g46dvrcvwn/2/files",
    "https://data.mendeley.com/public-files/datasets/g46dvrcvwn/2",
    "https://data.mendeley.com/api/datasets/g46dvrcvwn/2/download",
    "https://data.mendeley.com/datasets/jtttfbx342/1/download",
]

for url in patterns:
    print(f"Testing {url} ...")
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    try:
        with urllib.request.urlopen(req) as resp:
            print(f" -> Status: {resp.status}, Content-Type: {resp.headers.get('Content-Type')}, Content-Length: {resp.headers.get('Content-Length')}")
            print(f"    Final URL: {resp.url}")
    except Exception as e:
        print(f" -> Error: {e}")

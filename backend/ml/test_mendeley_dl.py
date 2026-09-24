import urllib.request
import re

urls = [
    "https://data.mendeley.com/datasets/g46dvrcvwn/2",
    "https://data.mendeley.com/datasets/jtttfbx342/1",
    "https://data.mendeley.com/datasets/cp65skff89/1"
]

for u in urls:
    print(f"\n--- Checking {u} ---")
    req = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
            print(f"Status: {resp.status}, length: {len(html)}")
            # look for download links or s3 links or zip links
            matches = re.findall(r'href="([^"]*(?:download|zip|files|s3)[^"]*)"', html, re.I)
            print(f"Matches for download/zip: {matches[:5]}")
            # look for json embedded data
            scripts = re.findall(r'<script[^>]*>(.*?)</script>', html, re.S)
            for s in scripts:
                if 'directDownloadUrl' in s or 'downloadUrl' in s or 'download_url' in s or 'files' in s:
                    # find urls
                    dl_urls = re.findall(r'https?://[^\s",]+\.zip[^\s",]*', s)
                    if dl_urls:
                        print(f"Found zip urls in script: {dl_urls}")
    except Exception as e:
        print(f"Error: {e}")

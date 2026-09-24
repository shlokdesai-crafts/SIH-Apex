import urllib.request
import re

url = "https://static.data.mendeley.com/scripts/script-v2.0.5.min.js"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as resp:
        js = resp.read().decode('utf-8')
        print(f"JS length: {len(js)}")
        # Look for url patterns or api paths
        endpoints = re.findall(r'["\'](/api/[^"\']+)["\']', js)
        print("API endpoints in JS:", set(endpoints[:20]))

        # Look for s3 or download urls
        s3 = re.findall(r'["\'](https?://[^"\']*(?:s3|amazonaws|dcd|download)[^"\']*)["\']', js)
        print("S3/Download URLs in JS:", set(s3[:10]))
except Exception as e:
    print(f"Error: {e}")

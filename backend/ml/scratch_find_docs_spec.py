import urllib.request
import re

req = urllib.request.Request("https://data.mendeley.com/api/docs", headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as resp:
    html = resp.read().decode('utf-8')

urls = re.findall(r'(https?://[^\s"\'<>]+|\/[^\s"\'<>]+\.json)', html)
print("URLs found in api/docs:", len(urls))
for u in set(urls):
    if any(k in u for k in ["json", "yaml", "api", "v1", "v2"]):
        print(" ", u)

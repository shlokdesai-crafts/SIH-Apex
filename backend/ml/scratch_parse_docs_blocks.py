import urllib.request
import re

req = urllib.request.Request("https://data.mendeley.com/api/docs", headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as resp:
    html = resp.read().decode('utf-8')

# Search for markdown sections or code blocks in api/docs
code_blocks = re.findall(r'```(?:[\s\S]*?)```', html)
print(f"Code blocks found: {len(code_blocks)}")
for b in code_blocks[:15]:
    print("--- BLOCK ---")
    print(b)

import re

path = r"C:\Users\KRUTIKA\.gemini\antigravity-ide\brain\fdbb9871-9fca-4de4-a257-ed8340d8e283\.system_generated\steps\261\content.md"
with open(path, encoding="utf-8", errors="ignore") as f:
    html = f.read()

# Look for direct links or data attributes or JSON blobs
matches = re.findall(r'(https?://[^\s"\'<>]+)', html)
print(f"Total urls in content: {len(matches)}")
for u in set(matches):
    if any(k in u.lower() for k in ['zip', 'download', 'file', 'data.mendeley.com/public-files', 'prod-dcd-datasets-cache']):
        print("Candidate URL:", u)

# Also search for "download" or "files" in json structures in the html
json_blobs = re.findall(r'(\{[^{}]*"download_url"[^{}]*\})', html)
print(f"JSON blobs with download_url: {len(json_blobs)}")
for j in json_blobs[:5]:
    print(j)

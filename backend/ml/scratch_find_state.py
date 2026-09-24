import re
import json

path = r"C:\Users\KRUTIKA\.gemini\antigravity-ide\brain\fdbb9871-9fca-4de4-a257-ed8340d8e283\.system_generated\steps\261\content.md"
with open(path, encoding="utf-8", errors="ignore") as f:
    html = f.read()

# Look for script tags with JSON or state
scripts = re.findall(r'<script[^>]*>([\s\S]*?)<\/script>', html)
print(f"Total script tags: {len(scripts)}")
for i, s in enumerate(scripts):
    if len(s.strip()) > 0 and ("state" in s.lower() or "dataset" in s.lower() or "files" in s.lower()):
        print(f"Script {i} snippet ({len(s)} chars):", s.strip()[:300])
        print("---")

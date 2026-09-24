import re
import json

path = r"C:\Users\KRUTIKA\.gemini\antigravity-ide\brain\fdbb9871-9fca-4de4-a257-ed8340d8e283\.system_generated\steps\261\content.md"
with open(path, encoding="utf-8", errors="ignore") as f:
    html = f.read()

m = re.search(r'window\.INITIAL_STATE\s*=\s*(\{.*?\});', html, re.DOTALL)
if m:
    data = json.loads(m.group(1))
    print("INITIAL_STATE keys:", list(data.keys()))
    # Pretty print dataset info
    for k in ["archive", "dataset", "files", "version"]:
        if k in data:
            print(f"\n--- {k} ---")
            print(json.dumps(data[k], indent=2)[:1000])

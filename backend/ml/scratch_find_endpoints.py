import re

path = r"C:\Users\KRUTIKA\.gemini\antigravity-ide\brain\fdbb9871-9fca-4de4-a257-ed8340d8e283\.system_generated\steps\261\content.md"
with open(path, encoding="utf-8", errors="ignore") as f:
    text = f.read()

# Look for mentions of g46dvrcvwn or direct download zip
matches = re.findall(r'(\/[^\s"\'<>]*(?:g46dvrcvwn|download|files|zip)[^\s"\'<>]*)', text, re.IGNORECASE)
print(f"Matches for relative endpoints: {len(matches)}")
for m in set(matches):
    print(" ", m)

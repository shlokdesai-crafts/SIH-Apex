from pathlib import Path
from backend.services.crop_identification import identify_crop

img_path = Path("C:/Users/Shlok/.gemini/antigravity-ide/brain/3b8fd303-6397-48ee-982c-d1695e277e39/.user_uploaded/media_1789121747757.png")
with open(img_path, "rb") as f:
    img_bytes = f.read()

try:
    result = identify_crop(img_bytes)
    print(result)
except Exception as e:
    print("EXCEPTION:", e)

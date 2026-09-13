import sys
from pathlib import Path

# Add backend to path so imports work
sys.path.append(str(Path(__file__).parent / "backend"))

from services.crop_identification import identify_crop
from ml.config import BASE_DIR

images_dir = BASE_DIR.parent.parent / "public" / "images"
test_image = images_dir / "crop_maize.jpg"

if not test_image.exists():
    print(f"Test image not found at {test_image}")
    sys.exit(1)

with open(test_image, "rb") as f:
    image_bytes = f.read()

print("Testing identify_crop...")
result = identify_crop(image_bytes)
print(result)

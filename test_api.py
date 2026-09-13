import sys
from pathlib import Path
from fastapi.testclient import TestClient

# Add backend to path
sys.path.append(str(Path(__file__).parent / "backend"))

from main import app
from ml.config import BASE_DIR

client = TestClient(app)

images_dir = BASE_DIR.parent.parent / "public" / "images"
test_image = images_dir / "crop_maize.jpg"

if not test_image.exists():
    print(f"Test image not found at {test_image}")
    sys.exit(1)

with open(test_image, "rb") as f:
    response = client.post("/api/scan", files={"file": ("crop_maize.jpg", f, "image/jpeg")})

print(response.status_code)
print(response.json())

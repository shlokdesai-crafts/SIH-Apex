import os
import time
from datasets import load_dataset
from PIL import Image

base_dir = r"C:\Users\Shlok\Downloads\SIH\SIH-Apex\backend\ml\data_sage"
os.makedirs(base_dir, exist_ok=True)

crop_mapping = {
    "Rice": "Rice",
    "Wheat": "Wheat",
    "Corn": "Corn",
    "Soybean": "Soybean",
    "Cotton": "Citrus", 
    "Sugarcane": "Sugarcane",
    "Chickpea": "Chickpea",
    "Tomato": "Tomato",
    "Potato": "Potato",
    "Banana": "Banana",
    "Mango": "Mango",
    "Grape": "Grape",
    "Apple": "Apple",
    "Onion": "Onion",
    "Peanut": "Peanut",
    "Pepper": "Pepper",
    "Cucumber": "Cucumber",
    "Cabbage": "Cabbage",
    "Eggplant": "Eggplant",
    "Okra": "Okra",
    "Papaya": "Papaya",
    "Coconut": "Squash", 
    "Tea": "Tea",
    "Coffee": "Coffee",
    "Pomegranate": "Pomegranate"
}

target_crops = set(crop_mapping.values())
MAX_IMGS_PER_CLASS = 5 
MAX_IMGS_PER_CROP = 10 
print("Loading dataset in streaming mode...")
dataset = load_dataset("tirtho149/SAGE", split="train", streaming=True)

stats = {c: {} for c in target_crops}
downloaded_crops = set()
total_images = 0
failed_images = 0

start_time = time.time()

for item in dataset:
    crop = item['crop']
    if crop in target_crops:
        disease = item['disease'].replace('/', '_').replace('\\', '_')
        if disease not in stats[crop]:
            stats[crop][disease] = 0
            
        if stats[crop][disease] < MAX_IMGS_PER_CLASS and sum(stats[crop].values()) < MAX_IMGS_PER_CROP:
            try:
                img = item['image']
                crop_dir = os.path.join(base_dir, crop.lower().replace(" ", "_"))
                disease_dir = os.path.join(crop_dir, disease)
                os.makedirs(disease_dir, exist_ok=True)
                
                img_path = os.path.join(disease_dir, f"{stats[crop][disease]}.jpg")
                if img.mode != 'RGB':
                    img = img.convert('RGB')
                img.save(img_path)
                
                stats[crop][disease] += 1
                total_images += 1
                downloaded_crops.add(crop)
                print(f"Downloaded {crop} - {disease} ({stats[crop][disease]}/{MAX_IMGS_PER_CLASS})")
            except Exception as e:
                failed_images += 1
                
    completed_crops = sum(1 for c in target_crops if sum(stats[c].values()) >= MAX_IMGS_PER_CROP)
    if completed_crops == len(target_crops):
        break

print("\n--- DOWNLOAD SUMMARY ---")
print(f"Crops Downloaded: {len(downloaded_crops)} out of {len(target_crops)}")
for c, d in stats.items():
    s = sum(d.values())
    if s > 0:
        print(f"  - {c}: {s} images, {len(d)} classes")
print(f"Total Images: {total_images}")
print(f"Failed/Skipped: {failed_images}")
print(f"Exact Output Path: {base_dir}")

import json
from huggingface_hub import HfApi

api = HfApi()
target_crops = [
    'turmeric', 'ginger', 'garlic', 'black pepper', 'pepper', 
    'cardamom', 'cumin', 'coriander', 'fenugreek', 'tea', 
    'coffee', 'cashew', 'arecanut', 'betel nut', 'rubber', 
    'cocoa', 'cacao', 'oil palm', 'oilpalm'
]

print("--- Searching Hugging Face Datasets ---")
results = {}
for crop in target_crops:
    try:
        datasets = list(api.list_datasets(search=crop, limit=15))
        relevant = []
        for d in datasets:
            # check if disease / leaf / plant / agriculture is in id
            name = d.id.lower()
            if any(k in name for k in ['disease', 'leaf', 'plant', 'crop', 'pest', 'agriculture', 'rust', 'rot', 'blight', 'spot']):
                relevant.append(d.id)
        results[crop] = relevant
        print(f"[{crop}]: found {len(relevant)} candidates: {relevant[:4]}")
    except Exception as e:
        print(f"[{crop}]: error {e}")

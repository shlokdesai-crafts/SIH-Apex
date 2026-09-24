"""
backend/ml/check_sage_mapping.py
────────────────────────────────
Inspects canonical_mapping.json from tirtho149/SAGE.
Checks the exact presence and image counts of target crops.
"""

from huggingface_hub import hf_hub_download
import json
from collections import defaultdict

def main():
    path = hf_hub_download(repo_id='tirtho149/SAGE', filename='canonical_mapping.json', repo_type='dataset')
    mapping = json.load(open(path, encoding='utf-8'))

    targets = [
        'Turmeric', 'Ginger', 'Garlic', 'Black Pepper', 'Cardamom',
        'Cumin', 'Coriander', 'Fenugreek', 'Tea', 'Coffee',
        'Cashew', 'Arecanut', 'Betel Nut', 'Rubber', 'Cocoa', 'Oil Palm'
    ]

    crops = defaultdict(lambda: {'images': 0, 'diseases': defaultdict(int), 'raw_labels': []})
    
    for key, val in mapping.items():
        raw_crop = key.split('/')[0] if '/' in key else key
        canonical_crop = val.get('crop') or raw_crop
        disease = val.get('disease') or (key.split('/')[1] if '/' in key else 'Unknown')
        imgs = val.get('images', 0)
        crops[canonical_crop]['images'] += imgs
        crops[canonical_crop]['diseases'][disease] += imgs
        crops[canonical_crop]['raw_labels'].append((key, imgs))

    print('=== TARGET CROPS MATCHING IN SAGE ===')
    found_targets = []
    missing_targets = []

    for t in targets:
        matches = {c: d for c, d in crops.items() if t.lower() in c.lower() or c.lower() in t.lower()}
        if matches:
            found_targets.append(t)
            print(f'[FOUND] {t}:')
            for mc, md in matches.items():
                print(f'   -> SAGE Crop: {mc} (Total Images: {md["images"]})')
                for dis, cnt in md["diseases"].items():
                    print(f'      - {dis}: {cnt} images')
        else:
            missing_targets.append(t)
            print(f'[NOT FOUND] {t}')

    print('\n=== SUMMARY OF TARGETS ===')
    print(f'Found ({len(found_targets)}): {found_targets}')
    print(f'Missing ({len(missing_targets)}): {missing_targets}')

    print('\n=== ALL CROPS IN SAGE RELEVANT TO INDIAN AGRICULTURE / CROPGUARD ===')
    sorted_crops = sorted(crops.items(), key=lambda x: x[1]['images'], reverse=True)
    for c, d in sorted_crops:
        if d['images'] >= 50 and c not in [None, 'no-canonical-crop']:
            print(f'  {c}: {d["images"]} images ({len(d["diseases"])} disease classes)')

if __name__ == '__main__':
    main()

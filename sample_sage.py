from datasets import load_dataset

print("Opening SAGE in streaming mode...", flush=True)
ds = load_dataset("tirtho149/SAGE", split="train", streaming=True)

print("Reading first 10 records...", flush=True)

for i, item in enumerate(ds, start=1):
    print(f"\nRecord {i}")
    for field in ["crop", "disease", "plant_organ", "canonical_disease", "filename"]:
        print(f"  {field}: {item.get(field)}")
    print(f"  image type: {type(item.get('image')).__name__}", flush=True)

    if i >= 10:
        break

print("\nSample inspection complete.", flush=True)

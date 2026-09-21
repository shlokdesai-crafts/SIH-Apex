from huggingface_hub import HfFileSystem

fs = HfFileSystem()
items = fs.ls("datasets/tirtho149/SAGE/data")
filenames = [item['name'].split('/')[-1] for item in items]
print("Filenames:", sorted(filenames)[:10])
print("Are there other splits or patterns?", set(f.split('-')[0] for f in filenames))

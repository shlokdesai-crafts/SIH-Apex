from huggingface_hub import HfApi

api = HfApi()

queries = [
    'tea disease', 'tea leaf disease', 'tea leaf', 
    'coffee leaf', 'coffee disease', 'coffee rust',
    'cashew disease', 'cashew leaf', 
    'turmeric disease', 'turmeric leaf',
    'cocoa disease', 'cacao disease', 'cocoa pod',
    'ginger disease', 'garlic disease',
    'black pepper disease', 'piper nigrum',
    'cardamom disease', 'rubber disease', 'hevea disease',
    'oil palm disease', 'oil palm leaf', 'arecanut disease'
]

print("=== Targeted HF Dataset Query ===")
for q in queries:
    try:
        ds = list(api.list_datasets(search=q, limit=10))
        if ds:
            print(f"[{q}]: {[d.id for d in ds]}")
    except Exception as e:
        print(f"[{q}] err: {e}")

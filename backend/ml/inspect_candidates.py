from huggingface_hub import HfApi

api = HfApi()

print("=== AgML datasets ===")
agml = list(api.list_datasets(author='Project-AgML'))
for d in agml:
    print(d.id)

print("\n=== Tea datasets ===")
tea = list(api.list_datasets(search='tea', limit=20))
for d in tea:
    print(d.id)

print("\n=== Coffee datasets ===")
coffee = list(api.list_datasets(search='coffee', limit=20))
for d in coffee:
    print(d.id)

print("\n=== Cashew datasets ===")
cashew = list(api.list_datasets(search='cashew', limit=20))
for d in cashew:
    print(d.id)

print("\n=== Oil Palm datasets ===")
oilpalm = list(api.list_datasets(search='oil palm', limit=20))
for d in oilpalm:
    print(d.id)

print("\n=== Rubber datasets ===")
rubber = list(api.list_datasets(search='rubber', limit=20))
for d in rubber:
    print(d.id)

print("\n=== Betel / Arecanut datasets ===")
areca = list(api.list_datasets(search='arecanut', limit=20))
for d in areca:
    print(d.id)
betel = list(api.list_datasets(search='betel', limit=20))
for d in betel:
    print(d.id)

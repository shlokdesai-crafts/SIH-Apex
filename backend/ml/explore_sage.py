from datasets import load_dataset_builder
builder = load_dataset_builder('tirtho149/SAGE')
print("Features:", builder.info.features)
print("Splits:", builder.info.splits)

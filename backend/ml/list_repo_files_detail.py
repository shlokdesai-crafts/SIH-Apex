from huggingface_hub import HfApi

api = HfApi()

def list_repo_info(repo_id):
    print(f"\n--- {repo_id} ---")
    try:
        files = list(api.list_repo_files(repo_id, repo_type="dataset"))
        print(f"Total files: {len(files)}")
        # print first 10 non-hidden files
        visible = [f for f in files if not f.startswith('.')]
        print(f"Sample files ({min(10, len(visible))} of {len(visible)}): {visible[:10]}")
    except Exception as e:
        print(f"Error: {e}")

datasets_to_check = [
    "Project-AgML/turmeric_leaf_disease_classification",
    "Project-AgML/turmeric_disease_classification",
    "dffesalbon/rubber-tree-leaf-disease-ph-labeled",
    "sauriber/cocoa_diseases",
    "julianz1/cocoa-disease-detection",
    "Project-AgML/arabica_coffee_leaf_disease_classification",
    "Project-AgML/tea_leaf_disease_classification",
    "Project-AgML/CS-D_tea_leaf_disease_classification",
    "saifullah03/tea-leaf-disease-dataset",
    "pt-sk/Cashew_Dataset",
    "pt-sk/cashew_augmented"
]

for d in datasets_to_check:
    list_repo_info(d)

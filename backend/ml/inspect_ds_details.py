from huggingface_hub import HfApi, dataset_info

api = HfApi()

def inspect_ds(ds_id):
    print(f"\n==================== {ds_id} ====================")
    try:
        info = dataset_info(ds_id)
        print("Description / Card snippet:")
        print(info.description[:400] if info.description else "No description")
        if info.card_data:
            print("Card data keys:", list(info.card_data.keys()))
            if 'license' in info.card_data:
                print("License:", info.card_data.get('license'))
        # check files
        files = list(api.list_repo_files(ds_id, repo_type="dataset"))
        print(f"Files count: {len(files)} -> {files[:10]}")
    except Exception as e:
        print(f"Error inspecting {ds_id}: {e}")

inspect_ds("Project-AgML/turmeric_leaf_disease_classification")
inspect_ds("Project-AgML/turmeric_disease_classification")
inspect_ds("dffesalbon/rubber-tree-leaf-disease-ph-labeled")
inspect_ds("julianz1/cocoa-disease-detection")
inspect_ds("sauriber/cocoa_diseases")

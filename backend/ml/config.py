"""
backend/ml/config.py
────────────────────
Multi-Crop Machine Learning Configuration Registry.
Provides dedicated model settings, dataset directories, class definitions,
and severity/status mappings for Sugarcane, Soybean, and future crops.
"""

from pathlib import Path
from typing import Dict, Any, List

# Base directory for ML artifacts
BASE_DIR = Path(__file__).resolve().parent
SAVED_MODELS_DIR = BASE_DIR / "saved_models"
SAVED_MODELS_DIR.mkdir(parents=True, exist_ok=True)

# Image preprocessing defaults
IMAGE_SIZE = (224, 224)
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]

# ── Multi-Crop Registry ───────────────────────────────────────────────────────
CROP_CONFIGS: Dict[str, Dict[str, Any]] = {
    "Sugarcane": {
        "classes": [
            "Healthy",
            "Red Rot",
            "Rust",
            "Mosaic",
            "Yellow Disease"
        ],
        "model_path": SAVED_MODELS_DIR / "sugarcane_mobilenetv3.pth",
        "data_dir": BASE_DIR / "data" / "sugarcane",
        "confidence_threshold": 0.60,
        "severity_map": {
            "Healthy": "None",
            "Red Rot": "Severe",
            "Rust": "Moderate",
            "Mosaic": "Moderate",
            "Yellow Disease": "Mild",
        },
        "status_map": {
            "Healthy": "Healthy",
            "Red Rot": "Diseased",
            "Rust": "Diseased",
            "Mosaic": "Diseased",
            "Yellow Disease": "Diseased",
        },
    },
    "Soybean": {
        "classes": [
            "Healthy",
            "Cercospora Leaf Blight",
            "Frogeye Leaf Spot",
            "Rust",
            "Yellow Mosaic"
        ],
        "model_path": SAVED_MODELS_DIR / "soybean_mobilenetv3.pth",
        "data_dir": BASE_DIR / "data" / "soybean",
        "confidence_threshold": 0.60,
        "severity_map": {
            "Healthy": "None",
            "Cercospora Leaf Blight": "Severe",
            "Frogeye Leaf Spot": "Moderate",
            "Rust": "Severe",
            "Yellow Mosaic": "Moderate",
        },
        "status_map": {
            "Healthy": "Healthy",
            "Cercospora Leaf Blight": "Diseased",
            "Frogeye Leaf Spot": "Diseased",
            "Rust": "Diseased",
            "Yellow Mosaic": "Diseased",
        },
    },
    "Rice": {
        "classes": [
            "Healthy",
            "Bacterial Leaf Blight",
            "Brown Spot"
        ],
        "model_path": SAVED_MODELS_DIR / "rice_mobilenetv3.pth",
        "data_dir": BASE_DIR / "data" / "rice",
        "dataset_source": "ICAR / IndiaAI Rice and Maize in-field dataset",
        "dataset_source_path": r"C:\Users\Shlok\Downloads\SIH\dataset\Rice_and_Maize_Dataset",
        "verified_real": True,
        "source_mapping": {
            "Healthy": "ICAR Rice/Healthy (48 verified images)",
            "Bacterial Leaf Blight": "ICAR Rice/Disease/01_Bacterial_leaf_blight (46 verified images)",
            "Brown Spot": "ICAR Rice/Disease/02_Brown_spot (50 verified images)",
        },
        "confidence_threshold": 0.60,
        "severity_map": {
            "Healthy": "None",
            "Bacterial Leaf Blight": "Severe",
            "Brown Spot": "Moderate",
        },
        "status_map": {
            "Healthy": "Healthy",
            "Bacterial Leaf Blight": "Diseased",
            "Brown Spot": "Diseased",
        },
    },
    "Wheat": {
        "classes": [
            "Healthy",
            "Brown Rust",
            "Yellow Rust",
            "Powdery Mildew",
            "Septoria"
        ],
        "model_path": SAVED_MODELS_DIR / "wheat_mobilenetv3.pth",
        "data_dir": BASE_DIR / "data" / "wheat",
        "dataset_source": "Unverified / Awaiting Real Multi-Class Dataset",
        "dataset_source_path": "",
        "verified_real": False,
        "source_mapping": {},
        "confidence_threshold": 0.60,
        "severity_map": {
            "Healthy": "None",
            "Brown Rust": "Severe",
            "Yellow Rust": "Severe",
            "Powdery Mildew": "Moderate",
            "Septoria": "Severe",
        },
        "status_map": {
            "Healthy": "Healthy",
            "Brown Rust": "Diseased",
            "Yellow Rust": "Diseased",
            "Powdery Mildew": "Diseased",
            "Septoria": "Diseased",
        },
    },
    "Maize": {
        "classes": [
            "Healthy",
            "Common Rust",
            "Gray Leaf Spot",
            "Northern Leaf Blight"
        ],
        "model_path": SAVED_MODELS_DIR / "maize_mobilenetv3.pth",
        "data_dir": BASE_DIR / "data" / "maize",
        "dataset_source": "PlantVillage Open Dataset + ICAR IndiaAI",
        "dataset_source_path": r"C:\Users\Shlok\Downloads\SIH\dataset\PlantVillage-Dataset-master, C:\Users\Shlok\Downloads\SIH\dataset\Rice_and_Maize_Dataset",
        "verified_real": True,
        "source_mapping": {
            "Healthy": "PlantVillage Corn_(maize)___healthy (1,162) + ICAR Maize/Healthy (50)",
            "Common Rust": "PlantVillage Corn_(maize)___Common_rust_ (1,192)",
            "Gray Leaf Spot": "PlantVillage Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot (513)",
            "Northern Leaf Blight": "PlantVillage Corn_(maize)___Northern_Leaf_Blight (985) + ICAR Maize/Disease/02_turcicum_leaf_blight (50)",
        },
        "confidence_threshold": 0.60,
        "severity_map": {
            "Healthy": "None",
            "Common Rust": "Moderate",
            "Gray Leaf Spot": "Severe",
            "Northern Leaf Blight": "Severe",
        },
        "status_map": {
            "Healthy": "Healthy",
            "Common Rust": "Diseased",
            "Gray Leaf Spot": "Diseased",
            "Northern Leaf Blight": "Diseased",
        },
    },
    "Cotton": {
        "classes": [
            "Healthy",
            "Bacterial Blight",
            "Curl Virus",
            "Fusarium Wilt",
            "Target Spot"
        ],
        "model_path": SAVED_MODELS_DIR / "cotton_mobilenetv3.pth",
        "data_dir": BASE_DIR / "data" / "cotton",
        "dataset_source": "Unverified / Awaiting Real Multi-Class Dataset",
        "dataset_source_path": "",
        "verified_real": False,
        "source_mapping": {},
        "confidence_threshold": 0.60,
        "severity_map": {
            "Healthy": "None",
            "Bacterial Blight": "Severe",
            "Curl Virus": "Severe",
            "Fusarium Wilt": "Severe",
            "Target Spot": "Moderate",
        },
        "status_map": {
            "Healthy": "Healthy",
            "Bacterial Blight": "Diseased",
            "Curl Virus": "Diseased",
            "Fusarium Wilt": "Diseased",
            "Target Spot": "Diseased",
        },
    },
    "Tomato": {
        "classes": [
            "Healthy",
            "Bacterial Spot",
            "Early Blight",
            "Late Blight",
            "Yellow Leaf Curl Virus"
        ],
        "model_path": SAVED_MODELS_DIR / "tomato_mobilenetv3.pth",
        "data_dir": BASE_DIR / "data" / "tomato",
        "dataset_source": "PlantVillage Open-Access Agricultural Pathology Dataset",
        "dataset_source_path": r"C:\Users\Shlok\Downloads\SIH\dataset\PlantVillage-Dataset-master",
        "verified_real": True,
        "source_mapping": {
            "Healthy": "PlantVillage Tomato___healthy (1,585 verified unique images)",
            "Bacterial Spot": "PlantVillage Tomato___Bacterial_spot (2,127 verified images)",
            "Early Blight": "PlantVillage Tomato___Early_blight (1,000 verified images)",
            "Late Blight": "PlantVillage Tomato___Late_blight (1,901 verified unique images)",
            "Yellow Leaf Curl Virus": "PlantVillage Tomato___Tomato_Yellow_Leaf_Curl_Virus (5,357 verified images)",
        },
        "confidence_threshold": 0.60,
        "severity_map": {
            "Healthy": "None",
            "Bacterial Spot": "Severe",
            "Early Blight": "Moderate",
            "Late Blight": "Severe",
            "Yellow Leaf Curl Virus": "Severe",
        },
        "status_map": {
            "Healthy": "Healthy",
            "Bacterial Spot": "Diseased",
            "Early Blight": "Diseased",
            "Late Blight": "Diseased",
            "Yellow Leaf Curl Virus": "Diseased",
        },
    },
    "Chickpea": {
        "classes": [
            "Healthy",
            "Ascochyta Blight",
            "Fusarium Wilt",
            "Dry Root Rot",
            "Stunt Virus"
        ],
        "model_path": SAVED_MODELS_DIR / "chickpea_mobilenetv3.pth",
        "data_dir": BASE_DIR / "data" / "chickpea",
        "confidence_threshold": 0.60,
        "severity_map": {
            "Healthy": "None",
            "Ascochyta Blight": "Severe",
            "Fusarium Wilt": "Severe",
            "Dry Root Rot": "Severe",
            "Stunt Virus": "Moderate",
        },
        "status_map": {
            "Healthy": "Healthy",
            "Ascochyta Blight": "Diseased",
            "Fusarium Wilt": "Diseased",
            "Dry Root Rot": "Diseased",
            "Stunt Virus": "Diseased",
        },
    },
    "Onion": {
        "classes": ["Healthy", "Purple Blotch", "Stemphylium Blight", "Basal Rot", "Downy Mildew"],
        "model_path": SAVED_MODELS_DIR / "onion_mobilenetv3.pth",
        "data_dir": BASE_DIR / "data" / "onion",
        "confidence_threshold": 0.60,
        "severity_map": {
            "Healthy": "None",
            "Purple Blotch": "Severe",
            "Stemphylium Blight": "Moderate",
            "Basal Rot": "Severe",
            "Downy Mildew": "Moderate",
        },
        "status_map": {
            "Healthy": "Healthy",
            "Purple Blotch": "Diseased",
            "Stemphylium Blight": "Diseased",
            "Basal Rot": "Diseased",
            "Downy Mildew": "Diseased",
        },
    },
    "Potato": {
        "classes": ["Healthy", "Early Blight", "Late Blight", "Black Scurf", "Bacterial Wilt"],
        "model_path": SAVED_MODELS_DIR / "potato_mobilenetv3.pth",
        "data_dir": BASE_DIR / "data" / "potato",
        "confidence_threshold": 0.60,
        "severity_map": {
            "Healthy": "None",
            "Early Blight": "Moderate",
            "Late Blight": "Severe",
            "Black Scurf": "Moderate",
            "Bacterial Wilt": "Severe",
        },
        "status_map": {
            "Healthy": "Healthy",
            "Early Blight": "Diseased",
            "Late Blight": "Diseased",
            "Black Scurf": "Diseased",
            "Bacterial Wilt": "Diseased",
        },
    },
    "Pigeon Pea": {
        "classes": ["Healthy", "Fusarium Wilt", "Sterility Mosaic Disease", "Phytophthora Blight", "Pod Borer Damage"],
        "model_path": SAVED_MODELS_DIR / "pigeon_pea_mobilenetv3.pth",
        "data_dir": BASE_DIR / "data" / "pigeon_pea",
        "confidence_threshold": 0.60,
        "severity_map": {
            "Healthy": "None",
            "Fusarium Wilt": "Severe",
            "Sterility Mosaic Disease": "Severe",
            "Phytophthora Blight": "Severe",
            "Pod Borer Damage": "Moderate",
        },
        "status_map": {
            "Healthy": "Healthy",
            "Fusarium Wilt": "Diseased",
            "Sterility Mosaic Disease": "Diseased",
            "Phytophthora Blight": "Diseased",
            "Pod Borer Damage": "Diseased",
        },
    },
    "Groundnut": {
        "classes": ["Healthy", "Tikka Leaf Spot", "Rust", "Collar Rot", "Bud Necrosis"],
        "model_path": SAVED_MODELS_DIR / "groundnut_mobilenetv3.pth",
        "data_dir": BASE_DIR / "data" / "groundnut",
        "confidence_threshold": 0.60,
        "severity_map": {
            "Healthy": "None",
            "Tikka Leaf Spot": "Moderate",
            "Rust": "Severe",
            "Collar Rot": "Severe",
            "Bud Necrosis": "Moderate",
        },
        "status_map": {
            "Healthy": "Healthy",
            "Tikka Leaf Spot": "Diseased",
            "Rust": "Diseased",
            "Collar Rot": "Diseased",
            "Bud Necrosis": "Diseased",
        },
    },
    "Pomegranate": {
        "classes": ["Healthy", "Bacterial Blight", "Anthracnose", "Wilt Complex", "Fruit Borer"],
        "model_path": SAVED_MODELS_DIR / "pomegranate_mobilenetv3.pth",
        "data_dir": BASE_DIR / "data" / "pomegranate",
        "confidence_threshold": 0.60,
        "severity_map": {
            "Healthy": "None",
            "Bacterial Blight": "Severe",
            "Anthracnose": "Moderate",
            "Wilt Complex": "Severe",
            "Fruit Borer": "Moderate",
        },
        "status_map": {
            "Healthy": "Healthy",
            "Bacterial Blight": "Diseased",
            "Anthracnose": "Diseased",
            "Wilt Complex": "Diseased",
            "Fruit Borer": "Diseased",
        },
    },
    "Grapes": {
        "classes": ["Healthy", "Downy Mildew", "Powdery Mildew", "Anthracnose", "Bacterial Canker"],
        "model_path": SAVED_MODELS_DIR / "grapes_mobilenetv3.pth",
        "data_dir": BASE_DIR / "data" / "grapes",
        "confidence_threshold": 0.60,
        "severity_map": {
            "Healthy": "None",
            "Downy Mildew": "Severe",
            "Powdery Mildew": "Moderate",
            "Anthracnose": "Moderate",
            "Bacterial Canker": "Severe",
        },
        "status_map": {
            "Healthy": "Healthy",
            "Downy Mildew": "Diseased",
            "Powdery Mildew": "Diseased",
            "Anthracnose": "Diseased",
            "Bacterial Canker": "Diseased",
        },
    },
    "Banana": {
        "classes": ["Healthy", "Panama Wilt", "Sigatoka Leaf Spot", "Bunchy Top Virus", "Anthracnose"],
        "model_path": SAVED_MODELS_DIR / "banana_mobilenetv3.pth",
        "data_dir": BASE_DIR / "data" / "banana",
        "confidence_threshold": 0.60,
        "severity_map": {
            "Healthy": "None",
            "Panama Wilt": "Severe",
            "Sigatoka Leaf Spot": "Moderate",
            "Bunchy Top Virus": "Severe",
            "Anthracnose": "Moderate",
        },
        "status_map": {
            "Healthy": "Healthy",
            "Panama Wilt": "Diseased",
            "Sigatoka Leaf Spot": "Diseased",
            "Bunchy Top Virus": "Diseased",
            "Anthracnose": "Diseased",
        },
    },
    "Mango": {
        "classes": ["Healthy", "Anthracnose", "Powdery Mildew", "Dieback", "Bacterial Canker"],
        "model_path": SAVED_MODELS_DIR / "mango_mobilenetv3.pth",
        "data_dir": BASE_DIR / "data" / "mango",
        "confidence_threshold": 0.60,
        "severity_map": {
            "Healthy": "None",
            "Anthracnose": "Severe",
            "Powdery Mildew": "Moderate",
            "Dieback": "Severe",
            "Bacterial Canker": "Moderate",
        },
        "status_map": {
            "Healthy": "Healthy",
            "Anthracnose": "Diseased",
            "Powdery Mildew": "Diseased",
            "Dieback": "Diseased",
            "Bacterial Canker": "Diseased",
        },
    },
    "Orange": {
        "classes": ["Healthy", "Citrus Canker", "Phytophthora Gummosis", "Citrus Greening (HLB)", "Dieback"],
        "model_path": SAVED_MODELS_DIR / "orange_mobilenetv3.pth",
        "data_dir": BASE_DIR / "data" / "orange",
        "confidence_threshold": 0.60,
        "severity_map": {
            "Healthy": "None",
            "Citrus Canker": "Moderate",
            "Phytophthora Gummosis": "Severe",
            "Citrus Greening (HLB)": "Severe",
            "Dieback": "Severe",
        },
        "status_map": {
            "Healthy": "Healthy",
            "Citrus Canker": "Diseased",
            "Phytophthora Gummosis": "Diseased",
            "Citrus Greening (HLB)": "Diseased",
            "Dieback": "Diseased",
        },
    },
    "Sorghum": {
        "classes": ["Healthy", "Grain Mold", "Anthracnose", "Charcoal Rot", "Downy Mildew"],
        "model_path": SAVED_MODELS_DIR / "sorghum_mobilenetv3.pth",
        "data_dir": BASE_DIR / "data" / "sorghum",
        "confidence_threshold": 0.60,
        "severity_map": {
            "Healthy": "None",
            "Grain Mold": "Moderate",
            "Anthracnose": "Severe",
            "Charcoal Rot": "Severe",
            "Downy Mildew": "Moderate",
        },
        "status_map": {
            "Healthy": "Healthy",
            "Grain Mold": "Diseased",
            "Anthracnose": "Diseased",
            "Charcoal Rot": "Diseased",
            "Downy Mildew": "Diseased",
        },
    },
    "Pearl Millet": {
        "classes": ["Healthy", "Downy Mildew", "Rust", "Ergot", "Blast"],
        "model_path": SAVED_MODELS_DIR / "pearl_millet_mobilenetv3.pth",
        "data_dir": BASE_DIR / "data" / "pearl_millet",
        "confidence_threshold": 0.60,
        "severity_map": {
            "Healthy": "None",
            "Downy Mildew": "Severe",
            "Rust": "Moderate",
            "Ergot": "Severe",
            "Blast": "Moderate",
        },
        "status_map": {
            "Healthy": "Healthy",
            "Downy Mildew": "Diseased",
            "Rust": "Diseased",
            "Ergot": "Diseased",
            "Blast": "Diseased",
        },
    },
    "Turmeric": {
        "classes": ["Healthy", "Rhizome Rot", "Leaf Spot", "Leaf Blotch", "Fusarium Wilt"],
        "model_path": SAVED_MODELS_DIR / "turmeric_mobilenetv3.pth",
        "data_dir": BASE_DIR / "data" / "turmeric",
        "confidence_threshold": 0.60,
        "severity_map": {
            "Healthy": "None",
            "Rhizome Rot": "Severe",
            "Leaf Spot": "Moderate",
            "Leaf Blotch": "Moderate",
            "Fusarium Wilt": "Severe",
        },
        "status_map": {
            "Healthy": "Healthy",
            "Rhizome Rot": "Diseased",
            "Leaf Spot": "Diseased",
            "Leaf Blotch": "Diseased",
            "Fusarium Wilt": "Diseased",
        },
    },
}

# ── Backwards-Compatibility Exports for Sugarcane ────────────────────────────
SUGARCANE_CLASSES = CROP_CONFIGS["Sugarcane"]["classes"]
NUM_CLASSES = len(SUGARCANE_CLASSES)
SUGARCANE_CONFIDENCE_THRESHOLD = CROP_CONFIGS["Sugarcane"]["confidence_threshold"]
MODEL_PATH = CROP_CONFIGS["Sugarcane"]["model_path"]
DATASET_DIR = CROP_CONFIGS["Sugarcane"]["data_dir"]
SEVERITY_MAP = CROP_CONFIGS["Sugarcane"]["severity_map"]
STATUS_MAP = CROP_CONFIGS["Sugarcane"]["status_map"]

# ── SAGE Dataset Registration (Independent Expansion Dataset) ────────────────
SAGE_DATA_DIR = BASE_DIR / "data_sage"
SAGE_METADATA_PATH = SAGE_DATA_DIR / "sage_metadata.csv"
SAGE_DATASET_INFO: Dict[str, Any] = {
    "name": "SAGE (tirtho149/SAGE)",
    "data_dir": SAGE_DATA_DIR,
    "metadata_path": SAGE_METADATA_PATH,
    "available_crops": ["Ginger", "Garlic", "Pepper", "Tea", "Coffee", "Cashew"],
    "is_integrated_in_training": False,
    "notice": (
        "SAGE dataset images are saved separately in backend/ml/data_sage/ and "
        "have not yet been trained into existing models. Existing models serve "
        "the 8 primary crops (Chickpea, Cotton, Maize, Rice, Soybean, Sugarcane, "
        "Tomato, Wheat)."
    ),
}


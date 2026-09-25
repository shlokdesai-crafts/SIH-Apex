import abc
import json
import logging
from pathlib import Path
from typing import Dict, Any, Tuple, Optional, List
import io

from PIL import Image
import torch
import torchvision.transforms as transforms
from huggingface_hub import hf_hub_download, snapshot_download

from ml.config import SAVED_MODELS_DIR, IMAGE_SIZE, IMAGENET_MEAN, IMAGENET_STD
from ml.model import load_crop_checkpoint

logger = logging.getLogger(__name__)

# Standard inference transform
_inference_transform = transforms.Compose([
    transforms.Resize((int(IMAGE_SIZE[0] * 1.14), int(IMAGE_SIZE[1] * 1.14))),
    transforms.CenterCrop(IMAGE_SIZE),
    transforms.ToTensor(),
    transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
])

class DiseaseModelAdapter(abc.ABC):
    @abc.abstractmethod
    def load_model(self) -> None:
        """Load and cache the model."""
        pass
        
    @abc.abstractmethod
    def predict(self, image: Image.Image) -> Tuple[List[str], torch.Tensor]:
        """
        Run prediction on the image.
        Returns:
            Tuple of (classes list, probabilities tensor)
        """
        pass
        
    @abc.abstractmethod
    def get_classes(self) -> List[str]:
        pass
        
    @abc.abstractmethod
    def get_supported_crops(self) -> List[str]:
        pass
        
    @abc.abstractmethod
    def get_model_metadata(self) -> Dict[str, Any]:
        pass

class LocalTorchModelAdapter(DiseaseModelAdapter):
    def __init__(self, crop_name: str, model_path: Path, classes: List[str]):
        self.crop_name = crop_name
        self.model_path = model_path
        self.classes = classes
        self.model = None
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    def load_model(self) -> None:
        if self.model is None:
            if not self.model_path.exists():
                raise FileNotFoundError(f"Local model not found at {self.model_path}")
            logger.info(f"Loading local {self.crop_name} model from {self.model_path}...")
            self.model = load_crop_checkpoint(self.model_path, num_classes=len(self.classes), device=self.device)
            self.model.eval()

    def predict(self, image: Image.Image) -> Tuple[List[str], torch.Tensor]:
        self.load_model()
        if image.mode != "RGB":
            image = image.convert("RGB")
        tensor = _inference_transform(image).unsqueeze(0).to(self.device)
        with torch.no_grad():
            outputs = self.model(tensor)
            probs = torch.softmax(outputs, dim=1).squeeze(0).cpu()
        return self.classes, probs

    def get_classes(self) -> List[str]:
        return self.classes

    def get_supported_crops(self) -> List[str]:
        return [self.crop_name.lower()]

    def get_model_metadata(self) -> Dict[str, Any]:
        return {
            "source": "local",
            "model_path": str(self.model_path)
        }

class HuggingFaceImageClassifierAdapter(DiseaseModelAdapter):
    def __init__(self, repo_id: str, crop_name: Optional[str] = None):
        self.repo_id = repo_id
        self.crop_name = crop_name
        self.model = None
        self.classes = []
        self.feature_extractor = None
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    def load_model(self) -> None:
        if self.model is None:
            try:
                from transformers import AutoImageProcessor, AutoModelForImageClassification
            except ImportError:
                raise ImportError("transformers library is required for HuggingFace models")
            
            logger.info(f"Loading HuggingFace model {self.repo_id}...")
            self.feature_extractor = AutoImageProcessor.from_pretrained(self.repo_id)
            self.model = AutoModelForImageClassification.from_pretrained(self.repo_id).to(self.device)
            self.model.eval()
            
            # Try to get classes from config
            if hasattr(self.model.config, 'id2label'):
                # Sort by id to ensure correct order
                sorted_labels = sorted(self.model.config.id2label.items(), key=lambda x: int(x[0]))
                self.classes = [label for _, label in sorted_labels]
            else:
                logger.warning(f"No id2label found for {self.repo_id}")

    def predict(self, image: Image.Image) -> Tuple[List[str], torch.Tensor]:
        self.load_model()
        if image.mode != "RGB":
            image = image.convert("RGB")
            
        inputs = self.feature_extractor(images=image, return_tensors="pt").to(self.device)
        with torch.no_grad():
            outputs = self.model(**inputs)
            logits = outputs.logits
            probs = torch.softmax(logits, dim=1).squeeze(0).cpu()
            
        return self.classes, probs

    def get_classes(self) -> List[str]:
        self.load_model()
        return self.classes

    def get_supported_crops(self) -> List[str]:
        if self.crop_name:
            return [self.crop_name.lower()]
        return []

    def get_model_metadata(self) -> Dict[str, Any]:
        return {
            "source": "huggingface",
            "repo_id": self.repo_id
        }

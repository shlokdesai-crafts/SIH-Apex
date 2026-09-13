from pydantic import BaseModel
from typing import Optional, List, Any


class ValidationResult(BaseModel):
    passed: bool
    errors: List[str]
    warnings: List[str]


class ImageQuality(BaseModel):
    brightness_score: float   # 0-255 mean gray value
    blur_score: float          # Laplacian variance – higher = sharper
    resolution: str            # e.g. "1920x1080"
    file_size_mb: float
    is_bright_enough: bool
    is_sharp_enough: bool


class CropIdentification(BaseModel):
    crop_name: str                        # "Rice", "Wheat", "Maize", "Cotton", "Soybean", "Sugarcane", "Tomato", "Chickpea"
    confidence: float                     # Actual model confidence (0.0 to 1.0)
    is_identified: bool                   # True if confidence >= threshold
    message: Optional[str] = None         # Rejection message if confidence < threshold


class CropAnalysis(BaseModel):
    is_relevant: bool
    confidence: float                     # 0.0 to 1.0 model confidence
    detected_category: str                # e.g. "Plant/Crop", "Person", "Animal", "Vehicle", "Building/Scenery", "Irrelevant Object"
    label: str                            # Top predicted label (e.g. "ear of corn", "sports car")
    rejection_reason: Optional[str] = None
    crop_identification: Optional[CropIdentification] = None


class DiseaseDetectionResult(BaseModel):
    crop: str
    disease: str
    confidence: float
    severity: str                                # "None", "Mild", "Moderate", "Severe"
    status: str                                  # "Healthy", "Diseased", "Needs expert verification"
    explanation: Optional[str] = None
    symptoms: List[str] = []
    recommended_actions: List[str] = []
    prevention: List[str] = []
    expert_verification_required: bool = False
    abstain_reason: Optional[str] = None         # Why model abstained (entropy/margin/confidence)


class ScanResponse(BaseModel):
    """
    Structured response for the /api/scan endpoint.
    """
    status: str                          # "valid" | "invalid"
    message: str                         # Human-readable primary message
    validation: ValidationResult
    image_quality: Optional[ImageQuality] = None
    crop_analysis: Optional[CropAnalysis] = None
    disease_detection: Optional[DiseaseDetectionResult] = None  # Crop + Disease + Confidence + Severity + Status
    severity: Optional[str] = None           # Severity level (None/Mild/Moderate/Severe)
    risk_score: Optional[Any] = None         # 0-100 risk index
    advisory: Optional[Any] = None           # Treatment recommendations




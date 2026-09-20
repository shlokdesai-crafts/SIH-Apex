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
    crop_name: str                        # "Rice", "Wheat", "Maize (Corn)", "Cotton", "Soybean", "Sugarcane", "Tomato", "Chickpea"
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
    severity: str                                # "None", "Mild", "Moderate", "Severe", "Unknown"
    status: str                                  # "Healthy", "Diseased", "Needs expert verification"
    explanation: Optional[str] = None
    symptoms: List[str] = []
    recommended_actions: List[str] = []
    prevention: List[str] = []
    expert_verification_required: bool = False
    abstain_reason: Optional[str] = None         # Why model abstained (entropy/margin/confidence)


# ── Structured Diagnosis Contract (STEP 8) ───────────────────────────────────
class PredictionCandidate(BaseModel):
    crop: str
    condition: str
    confidence: float
    probability: Optional[float] = None


class CropDetail(BaseModel):
    name: str
    confidence: float


class DiagnosisDetail(BaseModel):
    condition: str
    type: str                                    # "disease" | "pest" | "healthy" | "uncertain"
    healthStatus: str                            # "Healthy" | "Affected" | "At Risk" | "Needs expert verification"
    confidence: float
    severity: str                                # "None" | "Mild" | "Moderate" | "Severe" | "Unknown"


class AnalysisDetail(BaseModel):
    summary: str
    symptoms: List[str] = []
    recommendedActions: List[str] = []
    prevention: List[str] = []
    pesticideNote: Optional[str] = None


class ModelMetadata(BaseModel):
    model: str
    modelVersion: str
    datasetSources: List[str] = ["ICAR", "PlantVillage"]


class VerificationDetail(BaseModel):
    isVerified: bool = True
    accuracyPercentage: float
    confidencePercentage: float
    reliabilityLevel: str
    referenceSource: str
    referenceProtocol: str
    datasetAttribution: str
    scientificCitation: str


class ScanResponse(BaseModel):
    """
    Standardized, structured response for /api/scan endpoint.
    Guarantees backward compatibility with existing frontends while
    providing strict typed contracts for the upgraded pipeline.
    """
    scanId: Optional[str] = None
    status: str                          # "valid" | "success" | "uncertain" | "invalid_image" | "unsupported_crop" | "server_error"
    message: str                         # Human-readable primary message
    timestamp: Optional[str] = None

    # Structured contracts
    crop: Optional[CropDetail] = None
    diagnosis: Optional[DiagnosisDetail] = None
    topPredictions: List[PredictionCandidate] = []
    analysis: Optional[AnalysisDetail] = None
    metadata: Optional[ModelMetadata] = None
    verification: Optional[VerificationDetail] = None
    imageUrl: Optional[str] = None

    # Backward-compatible fields
    validation: ValidationResult
    image_quality: Optional[ImageQuality] = None
    crop_analysis: Optional[CropAnalysis] = None
    disease_detection: Optional[DiseaseDetectionResult] = None
    severity: Optional[str] = None
    risk_score: Optional[Any] = None
    advisory: Optional[Any] = None

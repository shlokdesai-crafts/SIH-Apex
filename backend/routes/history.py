
import logging
from fastapi import APIRouter, HTTPException, Query, Header
from typing import Optional
from db_mongo import get_user_scan_history, verify_auth_token, get_db
from bson import ObjectId

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/scans/history", summary="List persistent crop scan history")
def list_history(
    farmer_id: Optional[str] = Query(default=None, description="Optional farmer ID filter"),
    authorization: Optional[str] = Header(None)
):
    try:
        user_id = farmer_id
        if authorization and authorization.startswith("Bearer "):
            token = authorization.split(" ")[1]
            try:
                user = verify_auth_token(token)
                if user and user.get("id"):
                    user_id = user["id"]
            except Exception:
                pass
                
        if not user_id or user_id == "anonymous":
            return []
            
        scans = get_user_scan_history(user_id)
        
        # Map fields to what frontend expects, and filter out nulls/errors
        formatted_scans = []
        for row in scans:
            disease_conf = row.get("confidence", 0.0) * 100
            condition = row.get("disease", "Unknown")
            is_healthy = "healthy" in condition.lower()
            health_status = "Healthy" if is_healthy else ("Needs expert verification" if condition == "Needs expert verification" else "Affected")
            
            # Use MongoDB 'scannedAt' but stringified
            created_at = row.get("scannedAt", row.get("createdAt", ""))
            
            # Get diagnosis report details if available (MongoDB structure)
            db = get_db()
            diagnosis_details = {}
            if db:
                diag = db.diagnosis_reports.find_one({"scanId": str(row.get("id"))})
                if diag:
                    diagnosis_details = diag

            formatted_scans.append({
                "id": str(row.get("id")),
                "farmerId": row.get("userId", "default_farmer"),
                "crop": row.get("crop", "Unknown"),
                "cropName": row.get("crop", "Unknown"),
                "condition": condition,
                "disease": condition,
                "confidence": disease_conf,
                "severity": row.get("severity", "Unknown"),
                "status": health_status,
                "healthStatus": health_status,
                "imagePath": row.get("previewUrl", ""),
                "previewUrl": row.get("previewUrl", ""),
                "imageUrl": row.get("previewUrl", ""),
                "description": diagnosis_details.get("explanation", ""),
                "symptoms": diagnosis_details.get("symptoms", []),
                "recommendedActions": diagnosis_details.get("recommendedActions", []),
                "prevention": diagnosis_details.get("prevention", []),
                "createdAt": str(created_at),
                "date": str(created_at),
                "verification": {
                    "isVerified": is_healthy or (disease_conf >= 45.0),
                    "confidencePercentage": disease_conf
                }
            })
            
        return formatted_scans
    except Exception as e:
        logger.error(f"Error fetching history: {e}", exc_info=True)
        return []

@router.delete("/scans/history/{scan_id}", summary="Delete a scan record")
def delete_history_entry(scan_id: str):
    db = get_db()
    if not db:
        raise HTTPException(status_code=500, detail="Database not available")
        
    try:
        if ObjectId.is_valid(scan_id):
            db.crop_scans.delete_one({"_id": ObjectId(scan_id)})
            db.diagnosis_reports.delete_one({"scanId": scan_id})
        else:
            db.crop_scans.delete_one({"id": scan_id})
            db.diagnosis_reports.delete_one({"scanId": scan_id})
            
        return {"message": "Deleted"}
    except Exception as e:
        logger.error(f"Failed to delete scan: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete scan")

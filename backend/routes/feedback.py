"""
backend/routes/feedback.py
──────────────────────────
Diagnosis accuracy feedback endpoint.
"""

from fastapi import APIRouter, Header, HTTPException, Body
from typing import Optional
from pydantic import BaseModel, Field

from db_mongo import save_diagnosis_feedback, verify_auth_token

router = APIRouter(prefix="/feedback", tags=["Feedback"])


class FeedbackRequest(BaseModel):
    scanId: str
    isAccurate: bool
    rating: int = Field(default=5, ge=1, le=5)
    comments: Optional[str] = None


@router.post("")
def submit_feedback(req: FeedbackRequest, authorization: Optional[str] = Header(None)):
    uid = "anonymous"
    if authorization:
        token = authorization.replace("Bearer ", "").strip()
        payload = verify_auth_token(token)
        if payload and payload.get("uid"):
            uid = payload["uid"]

    success = save_diagnosis_feedback(
        user_id=uid,
        scan_id=req.scanId,
        is_accurate=req.isAccurate,
        rating=req.rating,
        comments=req.comments,
    )
    if not success:
        raise HTTPException(status_code=500, detail="Failed to record feedback")
    return {"success": True, "message": "Feedback submitted successfully"}

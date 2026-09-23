"""
backend/routes/advisory_risk.py
───────────────────────────────
User-specific Risk Forecast and Advisory persistence endpoints.
"""

from fastapi import APIRouter, Header, HTTPException, Query
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

from db_mongo import (
    save_risk_forecast,
    get_user_risk_forecasts,
    save_user_advisory,
    get_user_advisories,
    verify_auth_token,
)

router = APIRouter(tags=["Risk & Advisory"])


def require_user_id(authorization: Optional[str]) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail="Authentication token required")
    token = authorization.replace("Bearer ", "").strip()
    payload = verify_auth_token(token)
    if not payload or not payload.get("uid"):
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return payload["uid"]


class RiskForecastRequest(BaseModel):
    crop: str
    stage: str = "Vegetative"
    overallRisk: str = "Low"
    trend: str = "↑"
    riskDesc: str = ""
    confidence: float = 85.0
    weatherImpact: str = ""
    details: Optional[Dict[str, Any]] = None


class AdvisoryRequest(BaseModel):
    crop: str
    title: str
    recommendations: List[str] = Field(default_factory=list)
    category: str = "Precision Advisory"
    details: Optional[Dict[str, Any]] = None


@router.post("/risk-forecasts")
def record_risk_forecast(
    req: RiskForecastRequest,
    authorization: Optional[str] = Header(None),
):
    uid = require_user_id(authorization)
    result_id = save_risk_forecast(
        user_id=uid,
        crop=req.crop,
        stage=req.stage,
        overall_risk=req.overallRisk,
        trend=req.trend,
        risk_desc=req.riskDesc,
        confidence=req.confidence,
        weather_impact=req.weatherImpact,
        details=req.details,
    )
    if not result_id:
        raise HTTPException(status_code=500, detail="Failed to persist risk forecast")
    return {"success": True, "message": "Risk forecast saved", "forecastId": result_id}


@router.get("/risk-forecasts")
def list_risk_forecasts(
    crop: Optional[str] = Query(None),
    authorization: Optional[str] = Header(None),
):
    uid = require_user_id(authorization)
    forecasts = get_user_risk_forecasts(uid, crop=crop)
    return {"success": True, "forecasts": forecasts}


@router.post("/advisories")
def record_advisory(
    req: AdvisoryRequest,
    authorization: Optional[str] = Header(None),
):
    uid = require_user_id(authorization)
    adv_id = save_user_advisory(
        user_id=uid,
        crop=req.crop,
        title=req.title,
        recommendations=req.recommendations,
        category=req.category,
        details=req.details,
    )
    if not adv_id:
        raise HTTPException(status_code=500, detail="Failed to persist advisory")
    return {"success": True, "message": "Advisory saved", "advisoryId": adv_id}


@router.get("/advisories")
def list_advisories(
    limit: int = Query(default=20, ge=1, le=100),
    authorization: Optional[str] = Header(None),
):
    uid = require_user_id(authorization)
    advisories = get_user_advisories(uid, limit=limit)
    return {"success": True, "advisories": advisories}

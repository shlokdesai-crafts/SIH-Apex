"""
backend/routes/farm.py
──────────────────────
Farmer Farm State & Field Management endpoints.
Ensures strict user data isolation.
"""

from fastapi import APIRouter, Header, HTTPException, Body
from typing import Optional, Dict, Any

from db_mongo import (
    get_farm_by_user,
    save_farm_for_user,
    verify_auth_token,
)

router = APIRouter(prefix="/farm", tags=["Farm"])


def require_user_id(authorization: Optional[str]) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail="Authentication token required")
    token = authorization.replace("Bearer ", "").strip()
    payload = verify_auth_token(token)
    if not payload or not payload.get("uid"):
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return payload["uid"]


@router.get("")
def get_farm(authorization: Optional[str] = Header(None)):
    """Fetches the authenticated farmer's persistent farm state."""
    uid = require_user_id(authorization)
    farm = get_farm_by_user(uid)
    if not farm:
        raise HTTPException(status_code=404, detail="Farm record not found")
    return {"success": True, "farm": farm}


@router.put("")
def update_farm(
    farm_data: Dict[str, Any] = Body(...),
    authorization: Optional[str] = Header(None)
):
    """Persists updated farm state for the authenticated farmer."""
    uid = require_user_id(authorization)
    success = save_farm_for_user(uid, farm_data)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to persist farm data")
    return {"success": True, "message": "Farm state saved to MongoDB"}

"""
backend/routes/auth.py
──────────────────────
Authentication & User profile endpoints.
"""

from fastapi import APIRouter, Header, HTTPException, Body
from typing import Optional
from pydantic import BaseModel, Field

from db_mongo import (
    create_user,
    authenticate_user,
    get_user_by_id,
    update_user_profile,
    verify_auth_token,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


class SignupRequest(BaseModel):
    phone: str = Field(..., min_length=10, max_length=15)
    password: str = Field(..., min_length=4)
    fullName: str
    location: str = "Maharashtra, India"
    language: str = "en"
    role: str = "Farmer"
    email: Optional[str] = None
    district: Optional[str] = None


class LoginRequest(BaseModel):
    phone: str
    password: str
    role: Optional[str] = "Farmer"


class ProfileUpdateRequest(BaseModel):
    fullName: Optional[str] = None
    location: Optional[str] = None
    district: Optional[str] = None
    language: Optional[str] = None
    email: Optional[str] = None


def get_current_user_id(authorization: Optional[str] = Header(None)) -> Optional[str]:
    """Helper to extract user ID from Bearer token."""
    if not authorization:
        return None
    token = authorization.replace("Bearer ", "").strip()
    payload = verify_auth_token(token)
    if not payload:
        return None
    return payload.get("uid")


@router.post("/signup")
def signup(req: SignupRequest):
    success, data, err = create_user(
        phone=req.phone,
        full_name=req.fullName,
        password=req.password,
        location=req.location,
        language=req.language,
        role=req.role,
        email=req.email,
        district=req.district,
    )
    if not success or not data:
        raise HTTPException(status_code=400, detail=err or "Registration failed")
    return {"success": True, "user": data["user"], "token": data["token"]}


@router.post("/login")
def login(req: LoginRequest):
    success, data, err = authenticate_user(phone=req.phone, password=req.password)
    if not success or not data:
        raise HTTPException(status_code=401, detail=err or "Invalid phone or password")
    return {"success": True, "user": data["user"], "token": data["token"]}


@router.get("/me")
def get_current_profile(authorization: Optional[str] = Header(None)):
    uid = get_current_user_id(authorization)
    if not uid:
        raise HTTPException(status_code=401, detail="Unauthorized or session expired")
    user = get_user_by_id(uid)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"success": True, "user": user}


@router.put("/profile")
def update_profile(req: ProfileUpdateRequest, authorization: Optional[str] = Header(None)):
    uid = get_current_user_id(authorization)
    if not uid:
        raise HTTPException(status_code=401, detail="Unauthorized")
    updated = update_user_profile(uid, req.model_dump(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=400, detail="Failed to update profile")
    return {"success": True, "user": updated}

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
    get_db,
    create_auth_token,
)
from datetime import datetime, timezone

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


class DemoLoginRequest(BaseModel):
    role: str = "Farmer"


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
    success, data, err = authenticate_user(phone=req.phone, password=req.password, expected_role=req.role)
    if not success or not data:
        raise HTTPException(status_code=401, detail=err or "No account found for this mobile number.")
    return {"success": True, "user": data["user"], "token": data["token"]}


@router.post("/demo")
def demo_login(req: DemoLoginRequest):
    role_clean = "Government" if (req.role or "").lower() == "government" else "Farmer"
    phone = "9999988888" if role_clean == "Government" else "9876543210"
    full_name = "Dr. Sunita Deshmukh (Gov Officer)" if role_clean == "Government" else "Ramesh Patil (Demo Farmer)"
    location = "Pune, Maharashtra" if role_clean == "Government" else "Nashik, Maharashtra"
    district = "Pune" if role_clean == "Government" else "Nashik"
    email = "officer.demo@piksuraksha.gov.in" if role_clean == "Government" else "farmer.demo@piksuraksha.in"

    db = get_db()
    if db is not None:
        user = db.users.find_one({"phone": phone})
        if not user:
            success, data, err = create_user(
                phone=phone,
                full_name=full_name,
                password="DemoSecureKey2026!",
                location=location,
                language="en",
                role=role_clean,
                email=email,
                district=district,
            )
            if success and data:
                return {"success": True, "user": data["user"], "token": data["token"]}
        else:
            user_id = str(user["_id"])
            token = create_auth_token(user_id, phone, user.get("role", role_clean))
            user_public = {
                "id": user_id,
                "phone": user["phone"],
                "fullName": user.get("fullName", full_name),
                "location": user.get("location", location),
                "district": user.get("district", district),
                "language": user.get("language", "en"),
                "role": user.get("role", role_clean),
                "email": user.get("email", email),
                "createdAt": user.get("createdAt", datetime.now(timezone.utc)).isoformat()
                if isinstance(user.get("createdAt"), datetime)
                else str(user.get("createdAt", "")),
            }
            return {"success": True, "user": user_public, "token": token}

    # Fallback if DB offline
    fallback_id = "demo_gov_id" if role_clean == "Government" else "demo_farmer_id"
    user_public = {
        "id": fallback_id,
        "phone": phone,
        "fullName": full_name,
        "location": location,
        "district": district,
        "language": "en",
        "role": role_clean,
        "email": email,
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }
    token = create_auth_token(fallback_id, phone, role_clean)
    return {"success": True, "user": user_public, "token": token}


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

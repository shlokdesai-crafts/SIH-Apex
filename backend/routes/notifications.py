"""
backend/routes/notifications.py
───────────────────────────────
User Notifications & Alerts endpoints.
"""

from fastapi import APIRouter, Header, HTTPException, Query
from typing import Optional

from db_mongo import (
    get_user_notifications,
    mark_notification_read,
    mark_all_notifications_read,
    verify_auth_token,
)

router = APIRouter(prefix="/notifications", tags=["Notifications"])


def require_user_id(authorization: Optional[str]) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail="Authentication token required")
    token = authorization.replace("Bearer ", "").strip()
    payload = verify_auth_token(token)
    if not payload or not payload.get("uid"):
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return payload["uid"]


@router.get("")
def list_notifications(
    limit: int = Query(default=20, ge=1, le=100),
    authorization: Optional[str] = Header(None),
):
    """Retrieves user's notifications list with read/unread statuses."""
    uid = require_user_id(authorization)
    items = get_user_notifications(uid, limit=limit)
    unread_count = sum(1 for item in items if not item.get("isRead"))
    return {"success": True, "notifications": items, "unreadCount": unread_count}


@router.patch("/{notification_id}/read")
def read_notification(notification_id: str, authorization: Optional[str] = Header(None)):
    """Marks a single notification as read."""
    uid = require_user_id(authorization)
    success = mark_notification_read(notification_id, uid)
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"success": True}


@router.patch("/read-all")
def read_all_notifications(authorization: Optional[str] = Header(None)):
    """Marks all user notifications as read."""
    uid = require_user_id(authorization)
    mark_all_notifications_read(uid)
    return {"success": True}

"""
routes/gov.py
─────────────
Government dashboard API endpoints for Unified Case Management.

GET  /api/stats                      - Live aggregate counts
GET  /api/submissions                - Recent submissions list (optionally filtered)
POST /api/submissions/{id}/assign    - Assign a field officer and mark as 'Assigned'
POST /api/submissions/{id}/resolve   - Resolve submission with optional notes
POST /api/submissions/{id}/update    - Full submission case update (status, officer, notes, diagnosis, priority)
GET  /api/field-officers             - List of active government field officers
"""

from typing import Optional, Union
from fastapi import APIRouter, HTTPException, Query, Body
from pydantic import BaseModel

from db_mongo import (
    get_dashboard_mongo_stats,
    get_mongo_submissions,
    update_mongo_submission,
    get_mongo_map_markers,
)

router = APIRouter()


class AssignRequest(BaseModel):
    assigned_officer: Optional[str] = None
    officer: Optional[str] = None


class ResolveRequest(BaseModel):
    resolution_notes: Optional[str] = None
    notes: Optional[str] = None


class CaseUpdateRequest(BaseModel):
    status: Optional[str] = None
    assigned_officer: Optional[str] = None
    resolution_notes: Optional[str] = None
    priority: Optional[str] = None
    disease: Optional[str] = None
    ai_result: Optional[str] = None


OFFICERS_LIST = [
    {"id": "off_1", "name": "Rajesh Patil", "role": "Agriculture Extension Officer", "district": "Pune"},
    {"id": "off_2", "name": "Sneha Deshmukh", "role": "District Agriculture Officer", "district": "Nashik"},
    {"id": "off_3", "name": "Vikram Joshi", "role": "Field Inspector", "district": "Satara"},
    {"id": "off_4", "name": "Priya Kadam", "role": "Agronomist", "district": "Kolhapur"},
    {"id": "off_5", "name": "Amit Shinde", "role": "Crop Health Specialist", "district": "Latur"},
    {"id": "off_6", "name": "Kavita Chavan", "role": "Field Inspector", "district": "Pune"},
    {"id": "off_7", "name": "Sanjay More", "role": "Agriculture Extension Officer", "district": "Dhule"},
    {"id": "off_8", "name": "Mahesh Gaikwad", "role": "Plant Pathologist", "district": "Nanded"},
    {"id": "off_9", "name": "Anil Sutar", "role": "Field Officer", "district": "Osmanabad"},
]


@router.get("/stats", summary="Aggregate stats for the government dashboard")
def stats():
    return get_dashboard_mongo_stats()


@router.get("/submissions", summary="List recent farmer submissions")
def submissions(
    status: str | None = Query(default=None, description="Filter by status: Pending, Assigned, Resolved, Unidentified, or all"),
    limit: int = Query(default=100, ge=1, le=500),
):
    return get_mongo_submissions(limit=limit, status_filter=status)


@router.get("/map-markers", summary="Get GPS coordinates for map markers")
def map_markers(
    severity: str | None = Query(default=None, description="Filter by severity (e.g., 'High Issues')")
):
    db_severity = None
    if severity == "High Issues":
        db_severity = "Severe"
    elif severity == "Needs Visit":
        db_severity = "Unidentified"
        
    return get_mongo_map_markers(severity_filter=db_severity)


@router.get("/field-officers", summary="Get list of available government field officers")
def get_field_officers():
    return OFFICERS_LIST


@router.post("/submissions/{submission_id}/assign", summary="Assign a field officer to a submission")
def assign(
    submission_id: str,
    payload: Optional[AssignRequest] = Body(default=None),
    officer: Optional[str] = Query(default=None),
):
    officer_name = officer or (payload.assigned_officer if payload else None) or (payload.officer if payload else None) or "Assigned Officer"
    ok = update_mongo_submission(
        submission_id=str(submission_id),
        status="Assigned",
        assigned_officer=officer_name,
    )
    if not ok:
        raise HTTPException(status_code=404, detail="Submission not found")
    return {
        "message": "Submission marked as Assigned",
        "id": submission_id,
        "status": "Assigned",
        "assigned_officer": officer_name,
    }


@router.post("/submissions/{submission_id}/resolve", summary="Mark a submission as resolved")
def resolve(
    submission_id: str,
    payload: Optional[ResolveRequest] = Body(default=None),
    notes: Optional[str] = Query(default=None),
):
    res_notes = notes or (payload.resolution_notes if payload else None) or (payload.notes if payload else None) or "Resolved by government field team"
    ok = update_mongo_submission(
        submission_id=str(submission_id),
        status="Resolved",
        resolution_notes=res_notes,
    )
    if not ok:
        raise HTTPException(status_code=404, detail="Submission not found")
    return {
        "message": "Submission marked as Resolved",
        "id": submission_id,
        "status": "Resolved",
        "resolution_notes": res_notes,
    }


@router.post("/submissions/{submission_id}/update", summary="Update submission case details")
def update_case(
    submission_id: str,
    req: CaseUpdateRequest,
):
    ok = update_mongo_submission(
        submission_id=str(submission_id),
        status=req.status,
        assigned_officer=req.assigned_officer,
        resolution_notes=req.resolution_notes,
        priority=req.priority,
        disease=req.disease,
        ai_result=req.ai_result,
    )
    if not ok:
        raise HTTPException(status_code=404, detail="Submission not found")
    return {
        "message": "Submission updated successfully",
        "id": submission_id,
    }


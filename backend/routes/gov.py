"""
routes/gov.py
─────────────
Government dashboard API endpoints.

GET  /api/stats                      - Live aggregate counts
GET  /api/submissions                - Recent submissions list (optionally filtered)
POST /api/submissions/{id}/assign    - Mark a submission as 'Assigned'
POST /api/submissions/{id}/resolve   - Mark a submission as 'Resolved'
"""

from fastapi import APIRouter, HTTPException, Query

from db import get_stats, get_submissions, update_status, get_map_markers

router = APIRouter()


@router.get("/stats", summary="Aggregate stats for the government dashboard")
def stats():
    return get_stats()


@router.get("/submissions", summary="List recent farmer submissions")
def submissions(
    status: str | None = Query(default=None, description="Filter by status: Pending, Assigned, Resolved, Unidentified"),
    limit: int = Query(default=50, ge=1, le=500),
):
    return get_submissions(limit=limit, status_filter=status)


@router.get("/map-markers", summary="Get GPS coordinates for map markers")
def map_markers(
    severity: str | None = Query(default=None, description="Filter by severity (e.g., 'High Issues')")
):
    # Mapping filter strings to actual DB severities if needed
    # Map component dropdown says: 'All Cases', 'High Issues', 'Needs Visit'
    # db severities might be 'Severe', 'Moderate', 'Mild', 'Verified', etc.
    # We will adjust filter mapping here based on what map component passes.
    # For now we'll accept severity as is or map it.
    db_severity = None
    if severity == "High Issues":
        db_severity = "Severe"
    elif severity == "Needs Visit":
        db_severity = "Unidentified" # Just an example mapping
        
    # the function get_map_markers in db.py filters by severity directly
    # but the current map component expects High Issues, Needs Visit, etc.
    # let's just return what get_map_markers gives or implement mapping here.
    return get_map_markers(severity_filter=db_severity)


@router.post("/submissions/{submission_id}/assign", summary="Assign a field officer to a submission")
def assign(submission_id: int):
    ok = update_status(submission_id, "Assigned")
    if not ok:
        raise HTTPException(status_code=404, detail="Submission not found")
    return {"message": "Submission marked as Assigned", "id": submission_id, "status": "Assigned"}


@router.post("/submissions/{submission_id}/resolve", summary="Mark a submission as resolved")
def resolve(submission_id: int):
    ok = update_status(submission_id, "Resolved")
    if not ok:
        raise HTTPException(status_code=404, detail="Submission not found")
    return {"message": "Submission marked as Resolved", "id": submission_id, "status": "Resolved"}

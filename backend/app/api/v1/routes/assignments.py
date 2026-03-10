"""
Assignment routes — list, update status, delete
"""
from fastapi import APIRouter, Depends, status
from pydantic import BaseModel as PydanticBase
from sqlalchemy.orm import Session
from typing import Optional
from app.api.dependencies import get_current_user, get_db_session
from app.models.user import User
from app.models.assignment import Assignment
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


# ---------- Schemas ----------

class AssignmentStatusBody(PydanticBase):
    status: str  # pending, in-progress, completed


# ---------- Endpoints ----------

@router.get(
    "/",
    status_code=status.HTTP_200_OK,
    summary="List all assignments grouped by subject",
)
async def list_assignments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
):
    """Return all assignments for the current user, grouped by subject."""
    rows = (
        db.query(Assignment)
        .filter(Assignment.user_id == current_user.id)
        .order_by(Assignment.plan_id, Assignment.week_number, Assignment.id)
        .all()
    )

    # Group by plan_id (each plan = one subject)
    subjects: dict = {}
    for a in rows:
        key = a.plan_id
        if key not in subjects:
            subjects[key] = {
                "plan_id": a.plan_id,
                "subject_name": a.subject_name,
                "subject_icon": a.subject_icon,
                "subject_color": a.subject_color,
                "total": 0,
                "completed": 0,
                "assignments": [],
            }
        subjects[key]["total"] += 1
        if a.status == "completed":
            subjects[key]["completed"] += 1
        subjects[key]["assignments"].append({
            "id": a.id,
            "title": a.title,
            "description": a.description,
            "assignment_type": a.assignment_type,
            "difficulty": a.difficulty,
            "estimated_time": a.estimated_time,
            "status": a.status,
            "week_number": a.week_number,
            "topics_covered": a.topics_covered,
            "created_at": a.created_at.isoformat(),
        })

    return {"success": True, "data": list(subjects.values())}


@router.get(
    "/subject/{plan_id}",
    status_code=status.HTTP_200_OK,
    summary="Get assignments for a specific subject/plan",
)
async def get_subject_assignments(
    plan_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
):
    """Return all assignments for a specific study plan."""
    rows = (
        db.query(Assignment)
        .filter(Assignment.user_id == current_user.id, Assignment.plan_id == plan_id)
        .order_by(Assignment.week_number, Assignment.id)
        .all()
    )
    assignments = [
        {
            "id": a.id,
            "title": a.title,
            "description": a.description,
            "assignment_type": a.assignment_type,
            "difficulty": a.difficulty,
            "estimated_time": a.estimated_time,
            "status": a.status,
            "week_number": a.week_number,
            "topics_covered": a.topics_covered,
            "created_at": a.created_at.isoformat(),
        }
        for a in rows
    ]
    return {"success": True, "data": assignments}


@router.patch(
    "/{assignment_id}/status",
    status_code=status.HTTP_200_OK,
    summary="Update assignment status",
)
async def update_assignment_status(
    assignment_id: int,
    body: AssignmentStatusBody,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
):
    """Toggle an assignment's status."""
    assignment = (
        db.query(Assignment)
        .filter(Assignment.id == assignment_id, Assignment.user_id == current_user.id)
        .first()
    )
    if not assignment:
        return {"success": False, "message": "Assignment not found"}

    assignment.status = body.status
    db.commit()
    return {"success": True, "message": f"Assignment status updated to {body.status}"}


@router.delete(
    "/{assignment_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete an assignment",
)
async def delete_assignment(
    assignment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
):
    """Delete a single assignment."""
    assignment = (
        db.query(Assignment)
        .filter(Assignment.id == assignment_id, Assignment.user_id == current_user.id)
        .first()
    )
    if not assignment:
        return {"success": False, "message": "Assignment not found"}
    db.delete(assignment)
    db.commit()
    return {"success": True, "message": "Assignment deleted"}

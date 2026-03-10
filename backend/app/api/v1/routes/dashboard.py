"""
Dashboard routes — aggregated stats and recent activity for the home screen
"""
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime, timedelta

from app.api.dependencies import get_current_user, get_db_session
from app.models.user import User
from app.models.study_plan import StudyPlan
from app.models.assignment import Assignment
from app.models.file import File
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get(
    "/stats",
    status_code=status.HTTP_200_OK,
    summary="Get dashboard statistics and recent activity",
)
async def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
):
    """Return aggregated stats for the current user's dashboard."""
    uid = current_user.id

    # ---- Study Plans ----
    plans = db.query(StudyPlan).filter(StudyPlan.user_id == uid).all()
    total_plans = len(plans)
    total_topics = 0
    completed_topics = 0
    total_study_hours = 0

    for plan in plans:
        total_study_hours += plan.total_hours or 0
        if plan.plan_data:
            for week in plan.plan_data:
                for topic in week.get("topics", []):
                    total_topics += 1
                    if topic.get("status") == "completed":
                        completed_topics += 1
                    # parse duration like "3h" -> 3
                    dur = topic.get("duration", "0h")
                    try:
                        total_study_hours_from_dur = int(dur.replace("h", "").strip())
                    except (ValueError, AttributeError):
                        total_study_hours_from_dur = 0

    # Use plan.total_hours as aggregate study-hours (set during plan creation)
    study_hours_display = sum(p.total_hours or 0 for p in plans)

    topic_progress = round((completed_topics / total_topics * 100) if total_topics > 0 else 0)

    # ---- Assignments ----
    assignments = db.query(Assignment).filter(Assignment.user_id == uid).all()
    total_assignments = len(assignments)
    completed_assignments = sum(1 for a in assignments if a.status == "completed")
    pending_assignments = total_assignments - completed_assignments

    # ---- Files ----
    total_files = db.query(func.count(File.id)).filter(File.uploaded_by == uid).scalar() or 0

    # ---- Recent Activity (real data, last 10 events) ----
    activity = []

    # Recent completed topics (from plans updated recently)
    recent_plans = (
        db.query(StudyPlan)
        .filter(StudyPlan.user_id == uid)
        .order_by(desc(StudyPlan.updated_at))
        .limit(5)
        .all()
    )
    for plan in recent_plans:
        if plan.plan_data:
            for week in plan.plan_data:
                for topic in week.get("topics", []):
                    if topic.get("status") == "completed":
                        activity.append({
                            "icon": "checkmark-circle",
                            "color": "#10B981",
                            "title": "Topic Completed",
                            "description": f"{topic.get('title', 'Unknown')} — {plan.subject_name}",
                            "time": plan.updated_at.isoformat() if plan.updated_at else "",
                            "sort_time": plan.updated_at or datetime.min,
                        })

    # Recent assignments completed
    recent_completed = (
        db.query(Assignment)
        .filter(Assignment.user_id == uid, Assignment.status == "completed")
        .order_by(desc(Assignment.updated_at))
        .limit(5)
        .all()
    )
    for a in recent_completed:
        activity.append({
            "icon": "clipboard",
            "color": "#F59E0B",
            "title": "Assignment Done",
            "description": f"{a.title} — {a.subject_name}",
            "time": a.updated_at.isoformat() if a.updated_at else "",
            "sort_time": a.updated_at or datetime.min,
        })

    # Recent file uploads
    recent_files = (
        db.query(File)
        .filter(File.uploaded_by == uid)
        .order_by(desc(File.created_at))
        .limit(5)
        .all()
    )
    for f in recent_files:
        activity.append({
            "icon": "cloud-upload",
            "color": "#3B82F6",
            "title": "File Uploaded",
            "description": f.title or f.original_filename,
            "time": f.created_at.isoformat() if f.created_at else "",
            "sort_time": f.created_at or datetime.min,
        })

    # Recent study plans created
    for plan in recent_plans:
        activity.append({
            "icon": "map",
            "color": "#8B5CF6",
            "title": "Study Plan Created",
            "description": plan.subject_name,
            "time": plan.created_at.isoformat() if plan.created_at else "",
            "sort_time": plan.created_at or datetime.min,
        })

    # Sort by time descending and take top 8
    activity.sort(key=lambda x: x.get("sort_time", datetime.min), reverse=True)
    activity = activity[:8]

    # Format relative time and remove sort_time
    now = datetime.utcnow()
    for item in activity:
        sort_t = item.pop("sort_time", None)
        if sort_t and sort_t != datetime.min:
            delta = now - sort_t
            if delta.total_seconds() < 60:
                item["time"] = "Just now"
            elif delta.total_seconds() < 3600:
                mins = int(delta.total_seconds() / 60)
                item["time"] = f"{mins}m ago"
            elif delta.total_seconds() < 86400:
                hrs = int(delta.total_seconds() / 3600)
                item["time"] = f"{hrs}h ago"
            elif delta.days < 7:
                item["time"] = f"{delta.days}d ago"
            else:
                item["time"] = sort_t.strftime("%b %d")
        else:
            item["time"] = ""

    return {
        "success": True,
        "data": {
            "study_hours": study_hours_display,
            "total_plans": total_plans,
            "total_topics": total_topics,
            "completed_topics": completed_topics,
            "topic_progress": topic_progress,
            "total_assignments": total_assignments,
            "completed_assignments": completed_assignments,
            "pending_assignments": pending_assignments,
            "total_files": total_files,
            "recent_activity": activity,
        },
    }

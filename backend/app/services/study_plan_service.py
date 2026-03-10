"""
Study Plan service for managing AI-generated study plans
"""
import logging
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.study_plan import StudyPlan
from app.core.exceptions import NotFoundException

logger = logging.getLogger(__name__)

# Map subject names to icons and colors
SUBJECT_ICON_MAP = {
    'mathematics': ('calculator', '#2563EB'),
    'math': ('calculator', '#2563EB'),
    'maths': ('calculator', '#2563EB'),
    'physics': ('planet', '#8B5CF6'),
    'chemistry': ('flask', '#F59E0B'),
    'computer science': ('code-slash', '#10B981'),
    'programming': ('code-slash', '#10B981'),
    'coding': ('code-slash', '#10B981'),
    'dsa': ('code-slash', '#10B981'),
    'english': ('book', '#EF4444'),
    'biology': ('leaf', '#06B6D4'),
    'history': ('time', '#D97706'),
    'economics': ('trending-up', '#7C3AED'),
    'science': ('flask', '#F59E0B'),
    'geography': ('globe', '#14B8A6'),
    'psychology': ('happy', '#EC4899'),
    'philosophy': ('bulb', '#6366F1'),
    'art': ('color-palette', '#F43F5E'),
    'music': ('musical-notes', '#A855F7'),
    'literature': ('book', '#EF4444'),
}

# Color palette for subjects not in the map
DEFAULT_COLORS = ['#2563EB', '#8B5CF6', '#F59E0B', '#10B981', '#EF4444', '#06B6D4', '#D97706', '#7C3AED', '#14B8A6', '#EC4899']


def get_subject_icon_color(subject_name: str) -> tuple:
    """Get icon and color for a subject based on its name"""
    lower = subject_name.lower().strip()
    for key, val in SUBJECT_ICON_MAP.items():
        if key in lower:
            return val
    # Deterministic color based on name hash
    color_idx = abs(hash(lower)) % len(DEFAULT_COLORS)
    return ('book', DEFAULT_COLORS[color_idx])


class StudyPlanService:
    """Service for CRUD operations on study plans"""

    @staticmethod
    def create_plan(db: Session, user_id: int, subject_name: str, description: str, plan_data: list) -> StudyPlan:
        """Create a new study plan"""
        try:
            icon, color = get_subject_icon_color(subject_name)

            # Calculate totals from plan_data
            total_topics = 0
            total_hours = 0
            for week in plan_data:
                topics = week.get('topics', [])
                total_topics += len(topics)
                for topic in topics:
                    dur = topic.get('duration', '0h')
                    try:
                        total_hours += int(''.join(filter(str.isdigit, dur)))
                    except ValueError:
                        pass

            plan = StudyPlan(
                user_id=user_id,
                subject_name=subject_name,
                subject_icon=icon,
                subject_color=color,
                description=description,
                total_topics=total_topics,
                total_hours=total_hours,
                plan_data=plan_data,
            )
            db.add(plan)
            db.commit()
            db.refresh(plan)
            logger.info(f"Study plan created: {subject_name} for user {user_id}")
            return plan
        except Exception as e:
            db.rollback()
            logger.error(f"Error creating study plan: {str(e)}")
            raise

    @staticmethod
    def get_user_plans(db: Session, user_id: int) -> List[StudyPlan]:
        """Get all study plans for a user"""
        return (
            db.query(StudyPlan)
            .filter(StudyPlan.user_id == user_id)
            .order_by(StudyPlan.created_at.desc())
            .all()
        )

    @staticmethod
    def get_plan_by_id(db: Session, plan_id: int, user_id: int) -> StudyPlan:
        """Get a specific study plan by ID"""
        plan = (
            db.query(StudyPlan)
            .filter(StudyPlan.id == plan_id, StudyPlan.user_id == user_id)
            .first()
        )
        if not plan:
            raise NotFoundException("Study plan not found")
        return plan

    @staticmethod
    def delete_plan(db: Session, plan_id: int, user_id: int) -> bool:
        """Delete a study plan"""
        plan = (
            db.query(StudyPlan)
            .filter(StudyPlan.id == plan_id, StudyPlan.user_id == user_id)
            .first()
        )
        if not plan:
            raise NotFoundException("Study plan not found")
        db.delete(plan)
        db.commit()
        logger.info(f"Study plan deleted: {plan_id}")
        return True


study_plan_service = StudyPlanService()

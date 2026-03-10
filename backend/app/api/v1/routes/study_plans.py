"""
Study Plan routes for CRUD and AI generation
"""
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.api.dependencies import get_current_user, get_db_session
from app.models.user import User
from app.services.study_plan_service import study_plan_service
from app.services.chat_service import chat_service
from app.schemas.study_plan import (
    StudyPlanCreateRequest,
    StudyPlanCreateResponse,
    StudyPlanListResponse,
    StudyPlanListItem,
    StudyPlanDetailResponse,
    StudyPlanResponse,
)
import logging
import json

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get(
    "/",
    response_model=StudyPlanListResponse,
    status_code=status.HTTP_200_OK,
    summary="List user's study plans",
)
async def list_study_plans(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
):
    """Get all study plans for the current user"""
    plans = study_plan_service.get_user_plans(db, current_user.id)
    items = [StudyPlanListItem.model_validate(p) for p in plans]
    return StudyPlanListResponse(data=items)


@router.get(
    "/{plan_id}",
    response_model=StudyPlanDetailResponse,
    status_code=status.HTTP_200_OK,
    summary="Get study plan detail",
)
async def get_study_plan(
    plan_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
):
    """Get a specific study plan with full data"""
    plan = study_plan_service.get_plan_by_id(db, plan_id, current_user.id)
    return StudyPlanDetailResponse(data=StudyPlanResponse.model_validate(plan))


@router.post(
    "/generate",
    response_model=StudyPlanCreateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generate study plan with AI",
)
async def generate_study_plan(
    subject: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
):
    """Generate a structured study plan using Gemini AI and save it"""
    logger.info(f"Generating study plan for '{subject}' for user {current_user.id}")

    result = await chat_service.generate_study_plan(subject)

    if not result.get("success"):
        return StudyPlanCreateResponse(
            success=False,
            message=result.get("error", "Failed to generate study plan"),
            data=None,
        )

    plan_data = result["plan_data"]
    subject_name = result.get("subject_name", subject)
    description = result.get("description", f"AI-generated study plan for {subject}")

    plan = study_plan_service.create_plan(
        db=db,
        user_id=current_user.id,
        subject_name=subject_name,
        description=description,
        plan_data=plan_data,
    )

    return StudyPlanCreateResponse(data=StudyPlanResponse.model_validate(plan))


@router.delete(
    "/{plan_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete a study plan",
)
async def delete_study_plan(
    plan_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
):
    """Delete a study plan"""
    study_plan_service.delete_plan(db, plan_id, current_user.id)
    return {"success": True, "message": "Study plan deleted"}

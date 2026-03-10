"""
Study Plan routes for CRUD and AI generation
"""
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.api.dependencies import get_current_user, get_db_session
from app.models.user import User
from app.services.study_plan_service import study_plan_service
from app.services.chat_service import chat_service
from app.services.file_service import FileService
from app.models.assignment import Assignment
from app.schemas.study_plan import (
    StudyPlanCreateRequest,
    StudyPlanCreateResponse,
    StudyPlanListResponse,
    StudyPlanListItem,
    StudyPlanDetailResponse,
    StudyPlanResponse,
    TopicStatusUpdateRequest,
    TopicStatusUpdateResponse,
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

    # Fetch file context for this subject
    file_context = FileService.get_user_file_context(db, current_user.id, subject=subject)
    if file_context:
        logger.info(f"Including {len(file_context)} chars of file context for study plan")

    result = await chat_service.generate_study_plan(subject, file_context=file_context)

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

    # Save assignments if AI generated them
    ai_assignments = result.get("assignments", [])
    if ai_assignments:
        for a in ai_assignments:
            try:
                assignment = Assignment(
                    user_id=current_user.id,
                    plan_id=plan.id,
                    subject_name=subject_name,
                    subject_icon=plan.subject_icon,
                    subject_color=plan.subject_color,
                    title=a.get("title", "Untitled Assignment"),
                    description=a.get("description", ""),
                    assignment_type=a.get("assignment_type", "homework"),
                    difficulty=a.get("difficulty", "Medium"),
                    estimated_time=a.get("estimated_time", ""),
                    week_number=a.get("week_number"),
                    topics_covered=a.get("topics_covered", []),
                )
                db.add(assignment)
            except Exception as e:
                logger.error(f"Failed to save assignment: {str(e)}")
        db.commit()
        logger.info(f"Saved {len(ai_assignments)} assignments for plan {plan.id}")

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


@router.patch(
    "/{plan_id}/topics/{topic_id}/status",
    response_model=TopicStatusUpdateResponse,
    status_code=status.HTTP_200_OK,
    summary="Update a topic's completion status",
)
async def update_topic_status(
    plan_id: int,
    topic_id: int,
    body: TopicStatusUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
):
    """Toggle a topic's status (not-started, in-progress, completed)"""
    plan = study_plan_service.update_topic_status(
        db=db,
        plan_id=plan_id,
        user_id=current_user.id,
        topic_id=topic_id,
        new_status=body.status,
    )
    return TopicStatusUpdateResponse(data=StudyPlanResponse.model_validate(plan))


@router.post(
    "/{plan_id}/topics/{topic_id}/quiz",
    status_code=status.HTTP_200_OK,
    summary="Generate a quiz for a completed topic",
)
async def generate_topic_quiz(
    plan_id: int,
    topic_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
):
    """Generate a quiz or load existing one from DB"""
    from app.models.quiz import Quiz

    plan = study_plan_service.get_plan_by_id(db, plan_id, current_user.id)

    # Check if quiz already exists in DB
    existing_quiz = (
        db.query(Quiz)
        .filter(Quiz.plan_id == plan_id, Quiz.topic_id == topic_id)
        .first()
    )

    if existing_quiz:
        logger.info(f"Loading saved quiz for plan {plan_id}, topic {topic_id}")
        return {
            "success": True,
            "message": "Quiz loaded",
            "data": {
                "quiz_title": existing_quiz.quiz_title,
                "questions": existing_quiz.questions,
                "is_completed": existing_quiz.is_completed,
                "user_answers": existing_quiz.user_answers,
                "score": existing_quiz.score,
            },
        }

    # Find the topic in plan_data
    topic_data = None
    for week in plan.plan_data:
        for topic in week.get('topics', []):
            if topic.get('id') == topic_id:
                topic_data = topic
                break
        if topic_data:
            break

    if not topic_data:
        return {"success": False, "message": f"Topic {topic_id} not found in plan"}

    # Fetch file context for this subject
    file_context = FileService.get_user_file_context(db, current_user.id, subject=plan.subject_name)

    result = await chat_service.generate_quiz(
        topic_title=topic_data.get('title', ''),
        subject_name=plan.subject_name,
        key_points=topic_data.get('key_points', []),
        file_context=file_context,
    )

    if not result.get("success"):
        return {
            "success": False,
            "message": result.get("error", "Failed to generate quiz"),
        }

    # Save quiz to DB
    try:
        new_quiz = Quiz(
            plan_id=plan_id,
            topic_id=topic_id,
            quiz_title=result["quiz_title"],
            questions=result["questions"],
        )
        db.add(new_quiz)
        db.commit()
        logger.info(f"Quiz saved for plan {plan_id}, topic {topic_id}")
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to save quiz: {str(e)}")

    return {
        "success": True,
        "message": "Quiz generated",
        "data": {
            "quiz_title": result["quiz_title"],
            "questions": result["questions"],
            "is_completed": False,
            "user_answers": None,
            "score": None,
        },
    }


from pydantic import BaseModel as PydanticBaseModel


class QuizResultsBody(PydanticBaseModel):
    user_answers: dict
    score: int


@router.patch(
    "/{plan_id}/topics/{topic_id}/quiz/results",
    status_code=status.HTTP_200_OK,
    summary="Save quiz results after completion",
)
async def save_quiz_results(
    plan_id: int,
    topic_id: int,
    body: QuizResultsBody,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
):
    """Save the user's quiz answers and score"""
    from app.models.quiz import Quiz

    quiz = (
        db.query(Quiz)
        .filter(Quiz.plan_id == plan_id, Quiz.topic_id == topic_id)
        .first()
    )

    if not quiz:
        return {"success": False, "message": "Quiz not found"}

    quiz.user_answers = body.user_answers
    quiz.score = body.score
    quiz.is_completed = True

    from sqlalchemy.orm.attributes import flag_modified
    flag_modified(quiz, "user_answers")

    db.commit()
    logger.info(f"Quiz results saved for plan {plan_id}, topic {topic_id}: score={quiz.score}")

    return {"success": True, "message": "Quiz results saved"}

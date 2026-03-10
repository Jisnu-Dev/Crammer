"""
Chat routes for AI study assistant
"""
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.schemas.chat import ChatMessageRequest, ChatMessageResponse
from app.services.chat_service import chat_service
from app.services.file_service import FileService
from app.api.dependencies import get_current_user, get_db_session
from app.models.user import User
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "/send",
    response_model=ChatMessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Send a chat message",
    description="Send a message to the AI study assistant and get a response"
)
async def send_message(
    request: ChatMessageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
):
    """Send a message to the Gemini AI study assistant"""
    logger.info(f"Chat message from user {current_user.id}: {request.message[:50]}...")

    # Fetch file context — try to guess subject from message
    file_context = FileService.get_user_file_context(db, current_user.id)

    result = await chat_service.send_message(
        user_message=request.message,
        conversation_history=request.conversation_history,
        file_context=file_context,
    )

    return ChatMessageResponse(
        success=True,
        message="Response generated successfully",
        data=result
    )

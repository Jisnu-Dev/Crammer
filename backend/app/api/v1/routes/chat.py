"""
Chat routes for AI study assistant
"""
from fastapi import APIRouter, Depends, status
from app.schemas.chat import ChatMessageRequest, ChatMessageResponse
from app.services.chat_service import chat_service
from app.api.dependencies import get_current_user
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
    current_user: User = Depends(get_current_user)
):
    """Send a message to the Gemini AI study assistant"""
    logger.info(f"Chat message from user {current_user.id}: {request.message[:50]}...")

    result = await chat_service.send_message(
        user_message=request.message,
        conversation_history=request.conversation_history
    )

    return ChatMessageResponse(
        success=True,
        message="Response generated successfully",
        data=result
    )

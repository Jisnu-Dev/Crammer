"""
Chat schemas for Gemini AI study assistant
"""
from typing import Optional, List
from pydantic import BaseModel, Field
from .base_schema import BaseSchema


class ChatMessageRequest(BaseModel):
    """Request schema for sending a chat message"""
    message: str = Field(..., min_length=1, max_length=5000, description="User message")
    conversation_history: Optional[List[dict]] = Field(
        default=None,
        description="Previous conversation messages for context"
    )


class ChatMessageResponse(BaseSchema):
    """Response schema for chat message"""
    success: bool = True
    message: str = "Response generated successfully"
    data: Optional[dict] = None

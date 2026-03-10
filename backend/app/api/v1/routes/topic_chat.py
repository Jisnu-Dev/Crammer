"""
Topic Chat routes — persist and retrieve per-topic chat messages
"""
from fastapi import APIRouter, Depends, status
from pydantic import BaseModel as PydanticBase
from sqlalchemy.orm import Session
from typing import List, Optional
from app.api.dependencies import get_current_user, get_db_session
from app.models.user import User
from app.models.topic_chat import TopicChatMessage
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


# ---------- Schemas ----------

class ChatMessageBody(PydanticBase):
    sender: str  # 'user' or 'bot'
    text: str


class SaveMessagesBody(PydanticBase):
    messages: List[ChatMessageBody]


class ChatMessageOut(PydanticBase):
    id: int
    sender: str
    text: str
    created_at: str

    class Config:
        from_attributes = True


# ---------- Endpoints ----------

@router.get(
    "/{plan_id}/topics/{topic_id}/chat",
    status_code=status.HTTP_200_OK,
    summary="Get saved topic chat messages",
)
async def get_topic_chat(
    plan_id: int,
    topic_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
):
    """Return all stored messages for a specific topic, ordered by creation time."""
    rows = (
        db.query(TopicChatMessage)
        .filter(
            TopicChatMessage.user_id == current_user.id,
            TopicChatMessage.plan_id == plan_id,
            TopicChatMessage.topic_id == topic_id,
        )
        .order_by(TopicChatMessage.created_at.asc())
        .all()
    )
    messages = [
        {
            "id": r.id,
            "sender": r.sender,
            "text": r.text,
            "created_at": r.created_at.isoformat(),
        }
        for r in rows
    ]
    return {"success": True, "data": messages}


@router.post(
    "/{plan_id}/topics/{topic_id}/chat",
    status_code=status.HTTP_201_CREATED,
    summary="Save a single topic chat message",
)
async def save_topic_chat_message(
    plan_id: int,
    topic_id: int,
    body: ChatMessageBody,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
):
    """Persist a single chat message (user or bot) for a topic."""
    msg = TopicChatMessage(
        user_id=current_user.id,
        plan_id=plan_id,
        topic_id=topic_id,
        sender=body.sender,
        text=body.text,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return {
        "success": True,
        "data": {
            "id": msg.id,
            "sender": msg.sender,
            "text": msg.text,
            "created_at": msg.created_at.isoformat(),
        },
    }


@router.delete(
    "/{plan_id}/topics/{topic_id}/chat",
    status_code=status.HTTP_200_OK,
    summary="Clear topic chat history",
)
async def clear_topic_chat(
    plan_id: int,
    topic_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
):
    """Delete all chat messages for a topic (used when user resets the conversation)."""
    deleted = (
        db.query(TopicChatMessage)
        .filter(
            TopicChatMessage.user_id == current_user.id,
            TopicChatMessage.plan_id == plan_id,
            TopicChatMessage.topic_id == topic_id,
        )
        .delete()
    )
    db.commit()
    return {"success": True, "deleted": deleted}

"""
TopicChat model for storing per-topic chat messages
"""
from sqlalchemy import Column, String, Integer, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base_model import BaseModel
from app.core.database import Base


class TopicChatMessage(Base, BaseModel):
    """Stores individual chat messages for a study plan topic"""

    __tablename__ = "topic_chat_messages"

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    plan_id = Column(Integer, ForeignKey("study_plans.id", ondelete="CASCADE"), nullable=False, index=True)
    topic_id = Column(Integer, nullable=False, index=True)
    sender = Column(String(10), nullable=False)  # 'user' or 'bot'
    text = Column(Text, nullable=False)

    # Relationships
    user = relationship("User", backref="topic_chat_messages")
    plan = relationship("StudyPlan", backref="topic_chat_messages")

    def __repr__(self):
        return f"<TopicChatMessage(id={self.id}, plan={self.plan_id}, topic={self.topic_id}, sender={self.sender})>"

"""
Study Plan model for database
"""
from sqlalchemy import Column, String, Integer, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.models.base_model import BaseModel
from app.core.database import Base


class StudyPlan(Base, BaseModel):
    """Study plan model - stores AI-generated study plans"""

    __tablename__ = "study_plans"

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_name = Column(String(255), nullable=False)
    subject_icon = Column(String(50), nullable=False, default="book")
    subject_color = Column(String(20), nullable=False, default="#2563EB")
    description = Column(String(500), nullable=True)
    total_topics = Column(Integer, nullable=False, default=0)
    total_hours = Column(Integer, nullable=False, default=0)
    plan_data = Column(JSON, nullable=False)  # Stores the full structured plan as JSON

    # Relationships
    user = relationship("User", backref="study_plans")

    def __repr__(self):
        return f"<StudyPlan(id={self.id}, subject={self.subject_name}, user_id={self.user_id})>"

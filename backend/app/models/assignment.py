"""
Assignment model for storing AI-generated assignments per study plan
"""
from sqlalchemy import Column, String, Integer, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.models.base_model import BaseModel
from app.core.database import Base


class Assignment(Base, BaseModel):
    """Stores assignments generated alongside study plans"""

    __tablename__ = "assignments"

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    plan_id = Column(Integer, ForeignKey("study_plans.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_name = Column(String(255), nullable=False)
    subject_icon = Column(String(50), nullable=False, default="book")
    subject_color = Column(String(20), nullable=False, default="#2563EB")
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    assignment_type = Column(String(50), nullable=False, default="homework")  # homework, essay, project, practice, research
    difficulty = Column(String(20), nullable=False, default="Medium")  # Easy, Medium, Hard
    estimated_time = Column(String(20), nullable=True)  # e.g. "2h"
    status = Column(String(20), nullable=False, default="pending")  # pending, in-progress, completed
    week_number = Column(Integer, nullable=True)
    topics_covered = Column(JSON, nullable=True)  # list of topic titles this assignment covers

    # Relationships
    user = relationship("User", backref="assignments")
    plan = relationship("StudyPlan", backref="assignments")

    def __repr__(self):
        return f"<Assignment(id={self.id}, title={self.title}, plan_id={self.plan_id}, status={self.status})>"

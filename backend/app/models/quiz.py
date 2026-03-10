"""
Quiz model for storing generated quizzes
"""
from sqlalchemy import Column, String, Integer, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.models.base_model import BaseModel
from app.core.database import Base


class Quiz(Base, BaseModel):
    """Quiz model - stores AI-generated quizzes for study plan topics"""

    __tablename__ = "quizzes"

    plan_id = Column(Integer, ForeignKey("study_plans.id", ondelete="CASCADE"), nullable=False, index=True)
    topic_id = Column(Integer, nullable=False, index=True)
    quiz_title = Column(String(255), nullable=False)
    questions = Column(JSON, nullable=False)  # Stores the full quiz questions array
    is_completed = Column(Boolean, default=False, nullable=False)
    user_answers = Column(JSON, nullable=True)  # {"0": 2, "1": 0, ...} question_index -> selected_option
    score = Column(Integer, nullable=True)

    # Relationships
    plan = relationship("StudyPlan", backref="quizzes")

    def __repr__(self):
        return f"<Quiz(id={self.id}, plan_id={self.plan_id}, topic_id={self.topic_id}, completed={self.is_completed})>"

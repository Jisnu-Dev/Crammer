"""
Database models package
Import all models here for easy access
"""
from app.core.database import Base
from .user import User, UserRole
from .file import File, FileType, FileCategory
from .study_plan import StudyPlan
from .quiz import Quiz
from .topic_chat import TopicChatMessage
from .assignment import Assignment

__all__ = ["Base", "User", "UserRole", "File", "FileType", "FileCategory", "StudyPlan", "Quiz", "TopicChatMessage", "Assignment"]

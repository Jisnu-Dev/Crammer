"""
Database models package
Import all models here for easy access
"""
from app.core.database import Base
from .user import User, UserRole

__all__ = ["Base", "User", "UserRole"]

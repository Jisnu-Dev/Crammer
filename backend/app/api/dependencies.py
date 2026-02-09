"""
Common dependencies for API routes
"""
from typing import Generator
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db


def get_db_session() -> Generator[Session, None, None]:
    """Get database session dependency"""
    return get_db()


# Add more dependencies as needed
# Example: get_current_user, verify_token, etc.

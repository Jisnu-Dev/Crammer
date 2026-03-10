"""
Common dependencies for API routes
"""
from typing import Generator
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.utils.jwt_utils import decode_token
from app.core.exceptions import AuthenticationException
import logging

logger = logging.getLogger(__name__)

security = HTTPBearer()


def get_db_session() -> Generator[Session, None, None]:
    """Get database session dependency"""
    yield from get_db()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db_session)
) -> User:
    """
    Dependency to get current authenticated user from JWT token
    """
    try:
        token = credentials.credentials
        payload = decode_token(token)
        
        if payload is None:
            raise AuthenticationException("Invalid token")
        
        user_id = payload.get("sub")
        if user_id is None:
            raise AuthenticationException("Invalid token payload")
        
        user = db.query(User).filter(User.id == int(user_id)).first()
        if user is None:
            raise AuthenticationException("User not found")
        
        if not user.is_active:
            raise AuthenticationException("User account is inactive")
        
        return user
        
    except AuthenticationException as e:
        logger.warning(f"Authentication failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        logger.error(f"Error in get_current_user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

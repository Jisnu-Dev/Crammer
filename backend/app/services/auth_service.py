"""
Authentication service for user registration and login
"""
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import Optional, Tuple
from app.models.user import User, UserRole
from app.schemas.auth import SignUpRequest, LoginRequest, UserResponse, TokenResponse
from app.utils.jwt_utils import hash_password, verify_password, create_access_token, create_refresh_token
from app.core.exceptions import ValidationException, AuthenticationException, DatabaseException
from app.config import settings
import logging

logger = logging.getLogger(__name__)


class AuthService:
    """Service for authentication operations"""
    
    @staticmethod
    def create_user(db: Session, signup_data: SignUpRequest) -> User:
        """
        Create a new user
        
        Args:
            db: Database session
            signup_data: User registration data
            
        Returns:
            Created user instance
            
        Raises:
            ValidationException: If email already exists
            DatabaseException: If database error occurs
        """
        try:
            # Check if user already exists
            existing_user = db.query(User).filter(User.email == signup_data.email).first()
            if existing_user:
                raise ValidationException("Email already registered")
            
            # Hash the password
            password_hash = hash_password(signup_data.password)
            
            # Create user instance
            new_user = User(
                full_name=signup_data.full_name,
                email=signup_data.email,
                password_hash=password_hash,
                role=UserRole(signup_data.role),
                is_active=True,
                is_verified=False
            )
            
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
            
            logger.info(f"User created successfully: {new_user.email}")
            return new_user
            
        except ValidationException:
            raise
        except IntegrityError as e:
            db.rollback()
            logger.error(f"Database integrity error: {str(e)}")
            raise ValidationException("Email already registered")
        except Exception as e:
            db.rollback()
            logger.error(f"Error creating user: {str(e)}")
            raise DatabaseException("Failed to create user")
    
    @staticmethod
    def authenticate_user(db: Session, login_data: LoginRequest) -> Optional[User]:
        """
        Authenticate a user with email and password
        
        Args:
            db: Database session
            login_data: Login credentials
            
        Returns:
            User instance if authentication successful, None otherwise
        """
        try:
            user = db.query(User).filter(User.email == login_data.email).first()
            
            if not user:
                logger.warning(f"Login attempt with non-existent email: {login_data.email}")
                return None
            
            if not verify_password(login_data.password, user.password_hash):
                logger.warning(f"Failed login attempt for user: {login_data.email}")
                return None
            
            if not user.is_active:
                logger.warning(f"Login attempt for inactive user: {login_data.email}")
                return None
            
            logger.info(f"User authenticated successfully: {user.email}")
            return user
            
        except Exception as e:
            logger.error(f"Error authenticating user: {str(e)}")
            return None
    
    @staticmethod
    def generate_tokens(user: User) -> TokenResponse:
        """
        Generate access and refresh tokens for a user
        
        Args:
            user: User instance
            
        Returns:
            TokenResponse with access and refresh tokens
        """
        token_data = {
            "sub": str(user.id),
            "email": user.email,
            "role": user.role.value
        }
        
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token({"sub": str(user.id)})
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60  # Convert to seconds
        )
    
    @staticmethod
    def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
        """
        Get user by ID
        
        Args:
            db: Database session
            user_id: User ID
            
        Returns:
            User instance or None
        """
        try:
            return db.query(User).filter(User.id == user_id).first()
        except Exception as e:
            logger.error(f"Error getting user by ID: {str(e)}")
            return None
    
    @staticmethod
    def get_user_by_email(db: Session, email: str) -> Optional[User]:
        """
        Get user by email
        
        Args:
            db: Database session
            email: User email
            
        Returns:
            User instance or None
        """
        try:
            return db.query(User).filter(User.email == email).first()
        except Exception as e:
            logger.error(f"Error getting user by email: {str(e)}")
            return None

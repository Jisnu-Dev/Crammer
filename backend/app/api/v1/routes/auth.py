"""
Authentication routes for signup and login
"""
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.api.dependencies import get_db_session
from app.schemas.auth import SignUpRequest, LoginRequest, AuthResponse, UserResponse
from app.schemas.base_schema import ResponseSchema
from app.services.auth_service import AuthService
from app.core.exceptions import AuthenticationException, ValidationException
import logging

logger = logging.getLogger(__name__)

router = APIRouter()
auth_service = AuthService()


@router.post(
    "/signup",
    response_model=ResponseSchema[AuthResponse],
    status_code=status.HTTP_201_CREATED,
    summary="User registration",
    description="Register a new user account"
)
async def signup(
    signup_data: SignUpRequest,
    db: Session = Depends(get_db_session)
):
    """
    Register a new user
    
    - **full_name**: User's full name (min 2 characters)
    - **email**: Valid email address
    - **password**: Strong password (min 8 characters)
    - **role**: User role (student, mentor, or admin)
    """
    try:
        # Create user
        user = auth_service.create_user(db, signup_data)
        
        # Generate tokens
        tokens = auth_service.generate_tokens(user)
        
        # Prepare response
        user_response = UserResponse.model_validate(user)
        auth_response = AuthResponse(
            user=user_response,
            token=tokens,
            message="Account created successfully"
        )
        
        logger.info(f"New user registered: {user.email}")
        
        return ResponseSchema(
            success=True,
            message="Account created successfully",
            data=auth_response
        )
        
    except ValidationException as e:
        logger.warning(f"Signup validation error: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Signup error: {str(e)}")
        raise


@router.post(
    "/login",
    response_model=ResponseSchema[AuthResponse],
    status_code=status.HTTP_200_OK,
    summary="User login",
    description="Authenticate user and get access tokens"
)
async def login(
    login_data: LoginRequest,
    db: Session = Depends(get_db_session)
):
    """
    Login with email and password
    
    - **email**: User's email address
    - **password**: User's password
    
    Returns user data and JWT tokens
    """
    try:
        # Authenticate user
        user = auth_service.authenticate_user(db, login_data)
        
        if not user:
            raise AuthenticationException("Invalid email or password")
        
        # Generate tokens
        tokens = auth_service.generate_tokens(user)
        
        # Prepare response
        user_response = UserResponse.model_validate(user)
        auth_response = AuthResponse(
            user=user_response,
            token=tokens,
            message="Login successful"
        )
        
        logger.info(f"User logged in: {user.email}")
        
        return ResponseSchema(
            success=True,
            message="Login successful",
            data=auth_response
        )
        
    except AuthenticationException as e:
        logger.warning(f"Login failed: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise


@router.get(
    "/me",
    response_model=ResponseSchema[UserResponse],
    status_code=status.HTTP_200_OK,
    summary="Get current user",
    description="Get current authenticated user information"
)
async def get_current_user_info(
    db: Session = Depends(get_db_session)
):
    """
    Get current user information
    
    Note: This endpoint will require authentication middleware
    which we'll add in the next step
    """
    # TODO: Add authentication dependency to get current user from token
    return ResponseSchema(
        success=True,
        message="User information retrieved",
        data=None
    )

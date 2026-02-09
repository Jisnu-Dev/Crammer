"""
Authentication and user-related Pydantic schemas
"""
from typing import Optional
from pydantic import EmailStr, Field, validator
from datetime import datetime
from app.schemas.base_schema import BaseSchema, TimestampSchema, IDSchema


class UserRole(str):
    """User role values"""
    STUDENT = "student"
    MENTOR = "mentor"
    ADMIN = "admin"


# Request Schemas
class SignUpRequest(BaseSchema):
    """Schema for user registration"""
    
    full_name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=72)
    role: str = Field(..., pattern="^(student|mentor|admin)$")
    
    @validator('full_name')
    def validate_full_name(cls, v):
        if not v.strip():
            raise ValueError('Full name cannot be empty')
        return v.strip()


class LoginRequest(BaseSchema):
    """Schema for user login"""
    
    email: EmailStr
    password: str = Field(..., min_length=8)


class TokenRefreshRequest(BaseSchema):
    """Schema for token refresh"""
    
    refresh_token: str


# Response Schemas
class TokenResponse(BaseSchema):
    """Schema for authentication token response"""
    
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds


class UserResponse(BaseSchema):
    """Schema for user data response"""
    
    id: int
    full_name: str
    email: EmailStr
    role: str
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class AuthResponse(BaseSchema):
    """Schema for complete authentication response"""
    
    user: UserResponse
    token: TokenResponse
    message: str = "Authentication successful"

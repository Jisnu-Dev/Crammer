"""
Base Pydantic schemas for reusable validation
"""
from datetime import datetime
from typing import Generic, TypeVar, Optional, List, Any
from pydantic import BaseModel, ConfigDict


class BaseSchema(BaseModel):
    """Base schema with common configuration"""
    
    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )


class TimestampSchema(BaseSchema):
    """Schema with timestamp fields"""
    
    created_at: datetime
    updated_at: datetime


class IDSchema(BaseSchema):
    """Schema with ID field"""
    
    id: int


T = TypeVar('T')


class ResponseSchema(BaseSchema, Generic[T]):
    """Generic response schema"""
    
    success: bool = True
    message: str = "Operation successful"
    data: Optional[T] = None


class ErrorResponseSchema(BaseSchema):
    """Error response schema"""
    
    success: bool = False
    message: str
    details: Optional[Any] = None


class PaginationSchema(BaseSchema):
    """Pagination schema"""
    
    page: int = 1
    page_size: int = 10
    total: int
    total_pages: int
    
    @classmethod
    def create(cls, total: int, page: int = 1, page_size: int = 10):
        """Create pagination instance with calculated total_pages"""
        total_pages = (total + page_size - 1) // page_size
        return cls(
            page=page,
            page_size=page_size,
            total=total,
            total_pages=total_pages
        )


class PaginatedResponseSchema(BaseSchema, Generic[T]):
    """Paginated response schema"""
    
    success: bool = True
    message: str = "Data retrieved successfully"
    data: List[T]
    pagination: PaginationSchema

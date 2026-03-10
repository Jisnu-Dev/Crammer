"""
File-related Pydantic schemas
"""
from typing import Optional
from pydantic import Field, validator
from datetime import datetime
from app.schemas.base_schema import BaseSchema


class FileUploadResponse(BaseSchema):
    """Schema for file upload response"""
    
    id: int
    original_filename: str
    stored_filename: str
    file_size: int
    mime_type: str
    file_type: str
    category: str
    title: Optional[str] = None
    description: Optional[str] = None
    uploaded_by: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class FileListResponse(BaseSchema):
    """Schema for file list item"""
    
    id: int
    original_filename: str
    file_size: int
    mime_type: str
    file_type: str
    category: str
    title: Optional[str] = None
    description: Optional[str] = None
    uploaded_by: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class FileUpdateRequest(BaseSchema):
    """Schema for updating file metadata"""
    
    title: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    category: Optional[str] = Field(None, pattern="^(notes|syllabus|assignment|resource|other)$")

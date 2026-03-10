"""
File model for storing uploaded documents (notes, syllabus, etc.)
"""
from sqlalchemy import Column, Integer, String, BigInteger, Text, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum
from app.models.base_model import BaseModel
from app.core.database import Base


class FileType(str, enum.Enum):
    """File type enumeration"""
    PDF = "pdf"
    IMAGE = "image"
    DOCUMENT = "document"
    OTHER = "other"


class FileCategory(str, enum.Enum):
    """File category enumeration"""
    NOTES = "notes"
    SYLLABUS = "syllabus"
    ASSIGNMENT = "assignment"
    RESOURCE = "resource"
    OTHER = "other"


class File(Base, BaseModel):
    """File model for uploaded documents"""
    
    __tablename__ = "files"
    
    # File metadata
    original_filename = Column(String(255), nullable=False)
    stored_filename = Column(String(255), nullable=False, unique=True)
    file_path = Column(String(500), nullable=False)
    file_size = Column(BigInteger, nullable=False)  # Size in bytes
    mime_type = Column(String(100), nullable=False)
    file_type = Column(SQLEnum(FileType), nullable=False, default=FileType.OTHER)
    category = Column(SQLEnum(FileCategory), nullable=False, default=FileCategory.OTHER)
    
    # Optional metadata
    title = Column(String(255), nullable=True)
    description = Column(String(1000), nullable=True)
    subject = Column(String(255), nullable=True)  # Link file to a subject
    
    # Extracted text content (for AI context)
    extracted_text = Column(Text, nullable=True)
    
    # User relationship
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    user = relationship("User", back_populates="files")
    
    def __repr__(self):
        return f"<File {self.original_filename}>"

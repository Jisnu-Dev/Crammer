"""
File service for handling file uploads and management
"""
from sqlalchemy.orm import Session
from typing import List, Optional, BinaryIO
from fastapi import UploadFile
import os
import uuid
import logging
from pathlib import Path
from io import BytesIO
from app.models.file import File, FileType, FileCategory
from app.models.user import User
from app.core.exceptions import ValidationException, NotFoundException
from app.config import settings

logger = logging.getLogger(__name__)

# File upload configuration
UPLOAD_DIR = Path("uploads")
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = {
    'pdf': FileType.PDF,
    'png': FileType.IMAGE,
    'jpg': FileType.IMAGE,
    'jpeg': FileType.IMAGE,
    'gif': FileType.IMAGE,
    'doc': FileType.DOCUMENT,
    'docx': FileType.DOCUMENT,
    'txt': FileType.DOCUMENT,
}


class FileService:
    """Service for file operations"""
    
    @staticmethod
    def _ensure_upload_dir():
        """Ensure upload directory exists"""
        UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    
    @staticmethod
    def _get_file_extension(filename: str) -> str:
        """Get file extension from filename"""
        return filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
    
    @staticmethod
    def _determine_file_type(extension: str) -> FileType:
        """Determine file type from extension"""
        return ALLOWED_EXTENSIONS.get(extension, FileType.OTHER)
    
    @staticmethod
    def _generate_unique_filename(original_filename: str) -> str:
        """Generate unique filename while preserving extension"""
        extension = FileService._get_file_extension(original_filename)
        unique_name = f"{uuid.uuid4()}"
        return f"{unique_name}.{extension}" if extension else unique_name

    @staticmethod
    def _extract_text_from_pdf(content: bytes) -> str:
        """Extract text from PDF bytes. Returns empty string on failure."""
        try:
            from PyPDF2 import PdfReader
            reader = PdfReader(BytesIO(content))
            texts = []
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    texts.append(page_text)
            full_text = "\n".join(texts).strip()
            # Cap at ~50k chars to keep DB rows manageable
            if len(full_text) > 50000:
                full_text = full_text[:50000] + "\n...[truncated]"
            return full_text
        except Exception as e:
            logger.warning(f"PDF text extraction failed: {e}")
            return ""

    @staticmethod
    def _extract_text_from_txt(content: bytes) -> str:
        """Extract text from a plain text file."""
        try:
            text = content.decode("utf-8", errors="replace").strip()
            if len(text) > 50000:
                text = text[:50000] + "\n...[truncated]"
            return text
        except Exception as e:
            logger.warning(f"TXT text extraction failed: {e}")
            return ""
    
    @staticmethod
    async def upload_file(
        db: Session,
        file: UploadFile,
        user_id: int,
        category: str = "other",
        title: Optional[str] = None,
        description: Optional[str] = None,
        subject: Optional[str] = None
    ) -> File:
        """
        Upload and save a file
        
        Args:
            db: Database session
            file: Uploaded file
            user_id: ID of user uploading the file
            category: File category (notes, syllabus, etc.)
            title: Optional file title
            description: Optional file description
            
        Returns:
            Created File instance
            
        Raises:
            ValidationException: If file validation fails
        """
        try:
            # Validate file extension
            extension = FileService._get_file_extension(file.filename)
            if extension not in ALLOWED_EXTENSIONS:
                raise ValidationException(
                    f"File type .{extension} not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS.keys())}"
                )
            
            # Read file content
            content = await file.read()
            file_size = len(content)
            
            # Validate file size
            if file_size > MAX_FILE_SIZE:
                raise ValidationException(
                    f"File size ({file_size / 1024 / 1024:.2f}MB) exceeds maximum allowed size ({MAX_FILE_SIZE / 1024 / 1024}MB)"
                )
            
            # Ensure upload directory exists
            FileService._ensure_upload_dir()
            
            # Generate unique filename
            stored_filename = FileService._generate_unique_filename(file.filename)
            file_path = UPLOAD_DIR / stored_filename
            
            # Save file to disk
            with open(file_path, "wb") as f:
                f.write(content)
            
            # Determine file type
            file_type = FileService._determine_file_type(extension)
            
            # Extract text for AI context
            extracted_text = ""
            if extension == "pdf":
                extracted_text = FileService._extract_text_from_pdf(content)
                logger.info(f"Extracted {len(extracted_text)} chars from PDF")
            elif extension == "txt":
                extracted_text = FileService._extract_text_from_txt(content)
                logger.info(f"Extracted {len(extracted_text)} chars from TXT")
            
            # Create database record
            db_file = File(
                original_filename=file.filename,
                stored_filename=stored_filename,
                file_path=str(file_path),
                file_size=file_size,
                mime_type=file.content_type or "application/octet-stream",
                file_type=file_type,
                category=FileCategory(category),
                title=title or file.filename,
                description=description,
                subject=subject,
                extracted_text=extracted_text or None,
                uploaded_by=user_id
            )
            
            db.add(db_file)
            db.commit()
            db.refresh(db_file)
            
            logger.info(f"File uploaded: {file.filename} by user {user_id}")
            return db_file
            
        except ValidationException:
            raise
        except Exception as e:
            db.rollback()
            logger.error(f"Error uploading file: {str(e)}")
            # Clean up file if it was created
            if 'file_path' in locals() and os.path.exists(file_path):
                os.remove(file_path)
            raise ValidationException(f"Failed to upload file: {str(e)}")
    
    @staticmethod
    def get_user_files(
        db: Session,
        user_id: int,
        category: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[File]:
        """
        Get files uploaded by a user
        
        Args:
            db: Database session
            user_id: User ID
            category: Optional category filter
            skip: Number of records to skip
            limit: Maximum number of records to return
            
        Returns:
            List of File instances
        """
        query = db.query(File).filter(File.uploaded_by == user_id)
        
        if category:
            query = query.filter(File.category == FileCategory(category))
        
        return query.order_by(File.created_at.desc()).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_file_by_id(db: Session, file_id: int, user_id: int) -> File:
        """
        Get a file by ID (user can only access their own files)
        
        Args:
            db: Database session
            file_id: File ID
            user_id: User ID
            
        Returns:
            File instance
            
        Raises:
            NotFoundException: If file not found
        """
        db_file = db.query(File).filter(
            File.id == file_id,
            File.uploaded_by == user_id
        ).first()
        
        if not db_file:
            raise NotFoundException("File not found")
        
        return db_file
    
    @staticmethod
    def delete_file(db: Session, file_id: int, user_id: int) -> None:
        """
        Delete a file
        
        Args:
            db: Database session
            file_id: File ID
            user_id: User ID (for authorization)
            
        Raises:
            NotFoundException: If file not found
        """
        db_file = FileService.get_file_by_id(db, file_id, user_id)
        
        # Delete physical file
        if os.path.exists(db_file.file_path):
            os.remove(db_file.file_path)
            logger.info(f"Deleted physical file: {db_file.file_path}")
        
        # Delete database record
        db.delete(db_file)
        db.commit()
        
        logger.info(f"File deleted: {db_file.original_filename} by user {user_id}")
    
    @staticmethod
    def update_file_metadata(
        db: Session,
        file_id: int,
        user_id: int,
        title: Optional[str] = None,
        description: Optional[str] = None,
        category: Optional[str] = None,
        subject: Optional[str] = None
    ) -> File:
        """
        Update file metadata
        
        Args:
            db: Database session
            file_id: File ID
            user_id: User ID
            title: New title
            description: New description
            category: New category
            
        Returns:
            Updated File instance
        """
        db_file = FileService.get_file_by_id(db, file_id, user_id)
        
        if title is not None:
            db_file.title = title
        if description is not None:
            db_file.description = description
        if category is not None:
            db_file.category = FileCategory(category)
        if subject is not None:
            db_file.subject = subject
        
        db.commit()
        db.refresh(db_file)
        
        logger.info(f"File metadata updated: {db_file.original_filename}")
        return db_file

    @staticmethod
    def get_user_file_context(
        db: Session,
        user_id: int,
        subject: Optional[str] = None,
        max_chars: int = 30000,
    ) -> str:
        """
        Build a combined text blob from the user's uploaded files for AI context.
        If ``subject`` is provided, prioritise files tagged with that subject,
        then fall back to all files with extracted text.
        Returns a string ready to inject into a prompt.
        """
        query = db.query(File).filter(
            File.uploaded_by == user_id,
            File.extracted_text.isnot(None),
            File.extracted_text != "",
        )

        # Prefer subject-tagged files first
        if subject:
            subject_lower = subject.lower()
            subject_files = query.filter(
                File.subject.isnot(None),
            ).all()
            # Filter in Python for case-insensitive partial match
            matched = [
                f for f in subject_files
                if f.subject and subject_lower in f.subject.lower()
            ]
            # Also grab files whose title/description mention the subject
            all_files = query.all()
            for f in all_files:
                if f not in matched:
                    title_match = f.title and subject_lower in f.title.lower()
                    desc_match = f.description and subject_lower in f.description.lower()
                    if title_match or desc_match:
                        matched.append(f)
            # If still nothing, use all files with text
            if not matched:
                matched = all_files
        else:
            matched = query.order_by(File.created_at.desc()).limit(20).all()

        if not matched:
            return ""

        parts = []
        total = 0
        for f in matched:
            header = f"--- File: {f.title or f.original_filename} (category: {f.category}) ---"
            text = f.extracted_text or ""
            available = max_chars - total - len(header) - 10
            if available <= 0:
                break
            if len(text) > available:
                text = text[:available] + "...[truncated]"
            parts.append(f"{header}\n{text}")
            total += len(header) + len(text) + 2
        return "\n\n".join(parts)

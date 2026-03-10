"""
File upload and management routes
"""
from fastapi import APIRouter, Depends, UploadFile, File as FastAPIFile, Form, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.api.dependencies import get_db_session, get_current_user
from app.schemas.file import FileUploadResponse, FileListResponse, FileUpdateRequest
from app.schemas.base_schema import ResponseSchema
from app.services.file_service import FileService
from app.models.user import User
from app.core.exceptions import ValidationException, NotFoundException
import logging

logger = logging.getLogger(__name__)

router = APIRouter()
file_service = FileService()


@router.post(
    "/upload",
    response_model=ResponseSchema[FileUploadResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Upload a file",
    description="Upload a file (PDF, image, document)"
)
async def upload_file(
    file: UploadFile = FastAPIFile(...),
    category: str = Form("other"),
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """
    Upload a file
    
    - **file**: File to upload (PDF, PNG, JPG, JPEG, GIF, DOC, DOCX, TXT)
    - **category**: File category (notes, syllabus, assignment, resource, other)
    - **title**: Optional file title
    - **description**: Optional file description
    """
    try:
        logger.info("=== FILE UPLOAD REQUEST RECEIVED ===")
        logger.info(f"User: {current_user.email} (ID: {current_user.id})")
        logger.info(f"Filename: {file.filename}")
        logger.info(f"Content Type: {file.content_type}")
        logger.info(f"Category: {category}")
        logger.info(f"Title: {title}")
        logger.info(f"Description: {description}")
        
        # Validate inputs
        if not file or not file.filename:
            logger.error("No file provided in request")
            raise ValidationException("No file provided")
            
        uploaded_file = await file_service.upload_file(
            db=db,
            file=file,
            user_id=current_user.id,
            category=category,
            title=title,
            description=description
        )
        
        logger.info(f"File uploaded successfully: {uploaded_file.id}")
        file_response = FileUploadResponse.model_validate(uploaded_file)
        
        return ResponseSchema(
            success=True,
            message="File uploaded successfully",
            data=file_response
        )
        
    except ValidationException as e:
        logger.warning(f"File upload validation error: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"File upload error: {str(e)}", exc_info=True)
        raise ValidationException(f"Failed to upload file: {str(e)}")


@router.get(
    "/",
    response_model=ResponseSchema[List[FileListResponse]],
    summary="List user files",
    description="Get list of files uploaded by current user"
)
async def list_files(
    category: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """
    List files uploaded by current user
    
    - **category**: Optional filter by category (notes, syllabus, assignment, resource, other)
    - **skip**: Number of records to skip (pagination)
    - **limit**: Maximum number of records to return
    """
    try:
        files = file_service.get_user_files(
            db=db,
            user_id=current_user.id,
            category=category,
            skip=skip,
            limit=limit
        )
        
        files_response = [FileListResponse.model_validate(f) for f in files]
        
        return ResponseSchema(
            success=True,
            message=f"Found {len(files_response)} file(s)",
            data=files_response
        )
        
    except Exception as e:
        logger.error(f"Error listing files: {str(e)}")
        raise


@router.get(
    "/{file_id}",
    response_model=ResponseSchema[FileListResponse],
    summary="Get file details",
    description="Get details of a specific file"
)
async def get_file(
    file_id: int,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Get file details by ID"""
    try:
        file = file_service.get_file_by_id(db, file_id, current_user.id)
        file_response = FileListResponse.model_validate(file)
        
        return ResponseSchema(
            success=True,
            message="File retrieved successfully",
            data=file_response
        )
        
    except NotFoundException as e:
        logger.warning(f"File not found: {file_id}")
        raise
    except Exception as e:
        logger.error(f"Error retrieving file: {str(e)}")
        raise


@router.patch(
    "/{file_id}",
    response_model=ResponseSchema[FileListResponse],
    summary="Update file metadata",
    description="Update file title, description, or category"
)
async def update_file(
    file_id: int,
    update_data: FileUpdateRequest,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Update file metadata"""
    try:
        updated_file = file_service.update_file_metadata(
            db=db,
            file_id=file_id,
            user_id=current_user.id,
            title=update_data.title,
            description=update_data.description,
            category=update_data.category
        )
        
        file_response = FileListResponse.model_validate(updated_file)
        
        return ResponseSchema(
            success=True,
            message="File updated successfully",
            data=file_response
        )
        
    except NotFoundException as e:
        logger.warning(f"File not found: {file_id}")
        raise
    except Exception as e:
        logger.error(f"Error updating file: {str(e)}")
        raise


@router.delete(
    "/{file_id}",
    response_model=ResponseSchema[None],
    summary="Delete a file",
    description="Delete a file permanently"
)
async def delete_file(
    file_id: int,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Delete a file"""
    try:
        file_service.delete_file(db, file_id, current_user.id)
        
        return ResponseSchema(
            success=True,
            message="File deleted successfully",
            data=None
        )
        
    except NotFoundException as e:
        logger.warning(f"File not found: {file_id}")
        raise
    except Exception as e:
        logger.error(f"Error deleting file: {str(e)}")
        raise

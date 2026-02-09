"""
Health check routes
"""
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.api.dependencies import get_db_session
from app.schemas.base_schema import ResponseSchema
from app.core.exceptions import DatabaseException
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get(
    "/",
    response_model=ResponseSchema,
    status_code=status.HTTP_200_OK,
    summary="Basic health check",
    description="Check if the API is running"
)
async def health_check():
    """Basic health check endpoint"""
    return ResponseSchema(
        success=True,
        message="API is healthy",
        data={"status": "ok"}
    )


@router.get(
    "/db",
    response_model=ResponseSchema,
    status_code=status.HTTP_200_OK,
    summary="Database health check",
    description="Check database connectivity and version"
)
async def database_health_check(db: Session = Depends(get_db_session)):
    """
    Database health check endpoint
    Tests connection and retrieves database version
    """
    try:
        # Execute a simple query to check database connection
        result = db.execute(text("SELECT version();"))
        version = result.scalar()
        
        logger.info("Database health check successful")
        
        return ResponseSchema(
            success=True,
            message="Database connection successful",
            data={
                "status": "connected",
                "database_version": version
            }
        )
    except Exception as e:
        logger.error(f"Database health check failed: {str(e)}")
        raise DatabaseException(
            message="Database connection failed",
            details=str(e)
        )


@router.get(
    "/detailed",
    response_model=ResponseSchema,
    status_code=status.HTTP_200_OK,
    summary="Detailed health check",
    description="Comprehensive system health information"
)
async def detailed_health_check(db: Session = Depends(get_db_session)):
    """Detailed health check with system information"""
    try:
        # Check database
        result = db.execute(text("SELECT version();"))
        db_version = result.scalar()
        
        # Get database statistics
        stats_result = db.execute(text("""
            SELECT 
                COUNT(*) as connection_count 
            FROM pg_stat_activity 
            WHERE datname = current_database();
        """))
        connection_count = stats_result.scalar()
        
        return ResponseSchema(
            success=True,
            message="System is healthy",
            data={
                "api": {
                    "status": "ok",
                    "version": "1.0.0"
                },
                "database": {
                    "status": "connected",
                    "version": db_version,
                    "active_connections": connection_count
                }
            }
        )
    except Exception as e:
        logger.error(f"Detailed health check failed: {str(e)}")
        raise DatabaseException(
            message="Health check failed",
            details=str(e)
        )

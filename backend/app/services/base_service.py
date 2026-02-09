"""
Base service class with common CRUD operations
"""
from typing import TypeVar, Generic, Type, Optional, List, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.core.database import Base
from app.core.exceptions import NotFoundException, DatabaseException
import logging

logger = logging.getLogger(__name__)

ModelType = TypeVar("ModelType", bound=Base)


class BaseService(Generic[ModelType]):
    """
    Base service with common CRUD operations
    Inherit from this class for model-specific services
    """
    
    def __init__(self, model: Type[ModelType]):
        """
        Initialize service with model class
        
        Args:
            model: SQLAlchemy model class
        """
        self.model = model
    
    def get_by_id(self, db: Session, id: int) -> Optional[ModelType]:
        """
        Get a record by ID
        
        Args:
            db: Database session
            id: Record ID
            
        Returns:
            Model instance or None
        """
        try:
            return db.query(self.model).filter(self.model.id == id).first()
        except Exception as e:
            logger.error(f"Error getting {self.model.__name__} by ID: {str(e)}")
            raise DatabaseException(f"Error retrieving {self.model.__name__}")
    
    def get_or_404(self, db: Session, id: int) -> ModelType:
        """
        Get a record by ID or raise 404
        
        Args:
            db: Database session
            id: Record ID
            
        Returns:
            Model instance
            
        Raises:
            NotFoundException: If record not found
        """
        instance = self.get_by_id(db, id)
        if not instance:
            raise NotFoundException(f"{self.model.__name__} with ID {id} not found")
        return instance
    
    def get_all(
        self,
        db: Session,
        skip: int = 0,
        limit: int = 100,
        filters: Optional[dict] = None
    ) -> List[ModelType]:
        """
        Get all records with pagination and optional filters
        
        Args:
            db: Database session
            skip: Number of records to skip
            limit: Maximum number of records to return
            filters: Optional dictionary of filters
            
        Returns:
            List of model instances
        """
        try:
            query = db.query(self.model)
            
            if filters:
                filter_conditions = [
                    getattr(self.model, key) == value
                    for key, value in filters.items()
                    if hasattr(self.model, key)
                ]
                if filter_conditions:
                    query = query.filter(and_(*filter_conditions))
            
            return query.offset(skip).limit(limit).all()
        except Exception as e:
            logger.error(f"Error getting all {self.model.__name__}: {str(e)}")
            raise DatabaseException(f"Error retrieving {self.model.__name__} list")
    
    def count(self, db: Session, filters: Optional[dict] = None) -> int:
        """
        Count records with optional filters
        
        Args:
            db: Database session
            filters: Optional dictionary of filters
            
        Returns:
            Total count
        """
        try:
            query = db.query(self.model)
            
            if filters:
                filter_conditions = [
                    getattr(self.model, key) == value
                    for key, value in filters.items()
                    if hasattr(self.model, key)
                ]
                if filter_conditions:
                    query = query.filter(and_(*filter_conditions))
            
            return query.count()
        except Exception as e:
            logger.error(f"Error counting {self.model.__name__}: {str(e)}")
            raise DatabaseException(f"Error counting {self.model.__name__}")
    
    def create(self, db: Session, obj_in: dict) -> ModelType:
        """
        Create a new record
        
        Args:
            db: Database session
            obj_in: Dictionary with model data
            
        Returns:
            Created model instance
        """
        try:
            db_obj = self.model(**obj_in)
            db.add(db_obj)
            db.commit()
            db.refresh(db_obj)
            logger.info(f"Created {self.model.__name__} with ID: {db_obj.id}")
            return db_obj
        except Exception as e:
            db.rollback()
            logger.error(f"Error creating {self.model.__name__}: {str(e)}")
            raise DatabaseException(f"Error creating {self.model.__name__}")
    
    def update(self, db: Session, id: int, obj_in: dict) -> ModelType:
        """
        Update an existing record
        
        Args:
            db: Database session
            id: Record ID
            obj_in: Dictionary with updated data
            
        Returns:
            Updated model instance
        """
        try:
            db_obj = self.get_or_404(db, id)
            
            for field, value in obj_in.items():
                if hasattr(db_obj, field):
                    setattr(db_obj, field, value)
            
            db.commit()
            db.refresh(db_obj)
            logger.info(f"Updated {self.model.__name__} with ID: {id}")
            return db_obj
        except NotFoundException:
            raise
        except Exception as e:
            db.rollback()
            logger.error(f"Error updating {self.model.__name__}: {str(e)}")
            raise DatabaseException(f"Error updating {self.model.__name__}")
    
    def delete(self, db: Session, id: int) -> bool:
        """
        Delete a record
        
        Args:
            db: Database session
            id: Record ID
            
        Returns:
            True if deleted successfully
        """
        try:
            db_obj = self.get_or_404(db, id)
            db.delete(db_obj)
            db.commit()
            logger.info(f"Deleted {self.model.__name__} with ID: {id}")
            return True
        except NotFoundException:
            raise
        except Exception as e:
            db.rollback()
            logger.error(f"Error deleting {self.model.__name__}: {str(e)}")
            raise DatabaseException(f"Error deleting {self.model.__name__}")

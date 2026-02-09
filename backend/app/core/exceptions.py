"""
Custom exception classes for the application
"""
from typing import Optional, Any


class AppException(Exception):
    """Base exception class for application"""
    
    def __init__(
        self,
        message: str,
        status_code: int = 500,
        details: Optional[Any] = None
    ):
        self.message = message
        self.status_code = status_code
        self.details = details
        super().__init__(self.message)


class NotFoundException(AppException):
    """Exception raised when a resource is not found"""
    
    def __init__(self, message: str = "Resource not found", details: Optional[Any] = None):
        super().__init__(message=message, status_code=404, details=details)


class ValidationException(AppException):
    """Exception raised for validation errors"""
    
    def __init__(self, message: str = "Validation error", details: Optional[Any] = None):
        super().__init__(message=message, status_code=400, details=details)


class DatabaseException(AppException):
    """Exception raised for database errors"""
    
    def __init__(self, message: str = "Database error", details: Optional[Any] = None):
        super().__init__(message=message, status_code=500, details=details)


class AuthenticationException(AppException):
    """Exception raised for authentication errors"""
    
    def __init__(self, message: str = "Authentication failed", details: Optional[Any] = None):
        super().__init__(message=message, status_code=401, details=details)


class AuthorizationException(AppException):
    """Exception raised for authorization errors"""
    
    def __init__(self, message: str = "Access denied", details: Optional[Any] = None):
        super().__init__(message=message, status_code=403, details=details)

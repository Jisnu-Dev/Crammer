"""
Helper utility functions
"""
from typing import Optional, Any
from datetime import datetime, timedelta
import hashlib
import secrets


def generate_random_string(length: int = 32) -> str:
    """Generate a random string"""
    return secrets.token_urlsafe(length)


def hash_string(text: str) -> str:
    """Hash a string using SHA256"""
    return hashlib.sha256(text.encode()).hexdigest()


def calculate_expiry_time(minutes: int) -> datetime:
    """Calculate expiry datetime from current time"""
    return datetime.utcnow() + timedelta(minutes=minutes)


def sanitize_string(text: Optional[str]) -> Optional[str]:
    """Sanitize string by stripping whitespace"""
    return text.strip() if text else None


def convert_to_dict(obj: Any) -> dict:
    """Convert object to dictionary"""
    if hasattr(obj, 'to_dict'):
        return obj.to_dict()
    elif hasattr(obj, '__dict__'):
        return {
            key: value for key, value in obj.__dict__.items()
            if not key.startswith('_')
        }
    return {}

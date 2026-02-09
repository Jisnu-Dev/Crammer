"""
API v1 router that combines all route modules
"""
from fastapi import APIRouter
from .routes import health, auth

api_router = APIRouter()

# Include all route modules
api_router.include_router(
    health.router,
    prefix="/health",
    tags=["Health"]
)

api_router.include_router(
    auth.router,
    prefix="/auth",
    tags=["Authentication"]
)

# Add more routers as you create them
# api_router.include_router(users.router, prefix="/users", tags=["Users"])

"""
API v1 router that combines all route modules
"""
from fastapi import APIRouter
from .routes import health, auth, files, chat, study_plans

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

api_router.include_router(
    files.router,
    prefix="/files",
    tags=["Files"]
)

api_router.include_router(
    chat.router,
    prefix="/chat",
    tags=["Chat"]
)

api_router.include_router(
    study_plans.router,
    prefix="/study-plans",
    tags=["Study Plans"]
)

# Add more routers as you create them
# api_router.include_router(users.router, prefix="/users", tags=["Users"])

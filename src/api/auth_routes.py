"""
PJUD Sencker - Auth Routes.

API endpoints for Firebase user authentication.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.database.database import get_db
from src.api.auth import (
    UserResponse,
    get_current_user,
)
from src.database.models import User

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Get current authenticated user info.
    
    Requires valid Firebase ID token in Authorization header.
    
    Example:
        Authorization: Bearer <firebase-id-token>
    """
    return current_user

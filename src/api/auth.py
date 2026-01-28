"""
PJUD Sencker - Firebase Authentication Module.

Firebase-based authentication with token verification.
"""

from __future__ import annotations

from typing import Optional
from datetime import datetime

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.database.database import get_db
from src.database.models import User
from src.api.firebase_config import verify_firebase_token

# Security scheme for Firebase tokens
firebase_scheme = HTTPBearer(auto_error=False)


# ============ Pydantic Schemas ============

class UserResponse(BaseModel):
    """User data response."""
    id: str
    email: str
    full_name: Optional[str]
    firebase_uid: str
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class FirebaseTokenData(BaseModel):
    """Data from verified Firebase token."""
    uid: str
    email: Optional[str]
    email_verified: bool = False
    name: Optional[str] = None
    picture: Optional[str] = None


# ============ User Service Functions ============

async def get_user_by_firebase_uid(db: AsyncSession, firebase_uid: str) -> Optional[User]:
    """Get a user by Firebase UID."""
    result = await db.execute(
        select(User).where(User.id == firebase_uid)
    )
    return result.scalar_one_or_none()


async def create_user_from_firebase(
    db: AsyncSession,
    token_data: FirebaseTokenData
) -> User:
    """
    Create a new user from Firebase token data.
    
    Called automatically on first login.
    """
    user = User(
        id=token_data.uid,  # Use Firebase UID as primary key
        email=token_data.email or "",
        hashed_password="",  # Not used with Firebase
        full_name=token_data.name,
    )
    
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    return user


async def get_or_create_user(
    db: AsyncSession,
    token_data: FirebaseTokenData
) -> User:
    """Get existing user or create new one from Firebase data."""
    user = await get_user_by_firebase_uid(db, token_data.uid)
    
    if not user:
        user = await create_user_from_firebase(db, token_data)
    
    return user


# ============ Dependencies ============

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(firebase_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Dependency to get the current authenticated user.
    
    Verifies Firebase ID token and returns/creates user.
    
    Usage:
        @app.get("/me")
        async def get_me(user: User = Depends(get_current_user)):
            return user
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        # Verify Firebase token
        decoded_token = verify_firebase_token(credentials.credentials)
        
        token_data = FirebaseTokenData(
            uid=decoded_token["uid"],
            email=decoded_token.get("email"),
            email_verified=decoded_token.get("email_verified", False),
            name=decoded_token.get("name"),
            picture=decoded_token.get("picture"),
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Get or create user in database
    user = await get_or_create_user(db, token_data)
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    
    return user

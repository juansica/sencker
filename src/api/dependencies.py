"""
PJUD Sencker - API Dependencies.

Reusable dependencies for authentication and authorization (RBAC).
Implements the "Decorator Pattern" for FastAPI security.
"""

from __future__ import annotations

from typing import List, Union

from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.database.database import get_db
from src.database.models import User, UserRole
from src.api.auth import get_current_user


# ============================================================================
# Role-Based Access Control (RBAC)
# ============================================================================

class RoleChecker:
    """
    FastAPI Dependency to enforce role-based access control.
    
    Usage:
        allow_admin = RoleChecker([UserRole.ADMIN, UserRole.OWNER])
        
        @router.get("/")
        def endpoint(user: User = Depends(allow_admin)):
            ...
    """
    
    def __init__(self, allowed_roles: List[UserRole]):
        self.allowed_roles = allowed_roles

    def __call__(self, user: User = Depends(get_current_user)) -> User:
        """
        Validates if the user has one of the allowed roles.
        
        Args:
            user: The authenticated user (injected by get_current_user)
            
        Returns:
            User: The user object if authorized
            
        Raises:
            HTTPException: 403 if user lacks permission
            HTTPException: 403 if user is not in an organization
        """
        # 1. Organization Check (Most roles require being in an org)
        # We can implement specific non-org roles later if needed
        if not user.organization_id and not user.is_superuser:
             raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User does not belong to any organization"
            )

        # 2. Role Check
        if user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted. Required roles: {[r.value for r in self.allowed_roles]}"
            )
            
        return user


# ============================================================================
# Reusable Dependency Instances
# ============================================================================

# Use these in your routes instead of creating new RoleCheckers

# Allows ONLY Owners
allow_owner = RoleChecker([UserRole.OWNER])

# Allows Admins and Owners
allow_admin = RoleChecker([UserRole.ADMIN, UserRole.OWNER])

# Allows Members, Admins, and Owners (Basically anyone in the org)
allow_member = RoleChecker([UserRole.MEMBER, UserRole.ADMIN, UserRole.OWNER])
allow_viewer = RoleChecker([UserRole.VIEWER, UserRole.MEMBER, UserRole.ADMIN, UserRole.OWNER])


# ============================================================================
# Special Dependencies
# ============================================================================

async def require_superuser(
    user: User = Depends(get_current_user)
) -> User:
    """Require the current user to be a superuser (Platform Admin)."""
    if not user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Superuser access required"
        )
    return user

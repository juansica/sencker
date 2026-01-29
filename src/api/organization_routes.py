"""
PJUD Sencker - Organization API Routes.

Endpoints for organization members to manage their own organization.
Access is limited to users within the organization.
"""

from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status, Body
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.database.database import get_db
from src.database.models import User, Organization, UserRole, PlanType, Subscription
from src.api.mercadopago_service import MercadoPagoService
from src.api.dependencies import allow_admin, allow_viewer


router = APIRouter(prefix="/api/organizations/me", tags=["Organization"])
mp_service = MercadoPagoService()


# ============================================================================
# Schemas
# ============================================================================

class OrgUserResponse(BaseModel):
    id: str
    email: str
    full_name: Optional[str]
    role: str
    is_active: bool
    
    class Config:
        from_attributes = True


class InviteUserRequest(BaseModel):
    email: EmailStr
    role: UserRole = UserRole.MEMBER
    full_name: Optional[str] = None


class CheckoutRequest(BaseModel):
    plan_type: PlanType


class CheckoutResponse(BaseModel):
    init_point: str
    preapproval_id: str


# ============================================================================
# Endpoints
# ============================================================================

@router.get("", response_model=dict)
async def get_my_organization(
    user: User = Depends(allow_viewer),
    db: AsyncSession = Depends(get_db)
):
    """Get details of the current user's organization."""
    result = await db.execute(
        select(Organization)
        .where(Organization.id == user.organization_id)
        .options(selectinload(Organization.subscription))
    )
    org = result.scalar_one_or_none()
    
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
        
    return {
        "id": org.id,
        "name": org.name,
        "slug": org.slug,
        "subdomain": org.subdomain,
        "subscription": {
            "plan": org.subscription.plan_type.value if org.subscription else "free",
            "status": org.subscription.status.value if org.subscription else "active",
        } if org.subscription else None
    }


@router.get("/users", response_model=List[OrgUserResponse])
async def list_org_users(
    user: User = Depends(allow_admin),
    db: AsyncSession = Depends(get_db)
):
    """List all users in the organization."""
    result = await db.execute(
        select(User).where(User.organization_id == user.organization_id)
    )
    users = result.scalars().all()
    return users


@router.post("/users", response_model=OrgUserResponse)
async def invite_user(
    data: InviteUserRequest,
    user: User = Depends(allow_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Invite a user to the organization.
    
    Note: Real invitation flow would send email. 
    Here we just create the user if they don't exist, or link them.
    For simplicity, we refuse if user already exists (to avoid account takeover).
    """
    # Check if email exists
    existing = await db.execute(select(User).where(User.email == data.email))
    existing_user = existing.scalar_one_or_none()
    
    if existing_user:
        if existing_user.organization_id:
            raise HTTPException(
                status_code=400, 
                detail="User already belongs to an organization"
            )
        # Link existing user
        existing_user.organization_id = user.organization_id
        existing_user.role = data.role
        await db.commit()
        await db.refresh(existing_user)
        return existing_user
    
    # Create new placeholder user (they will claim via auth later)
    # In Firebase auth, we might need to create them there too, 
    # but for now we just create the DB record.
    new_user = User(
        email=data.email,
        full_name=data.full_name,
        organization_id=user.organization_id,
        role=data.role,
        is_active=True, 
        # hashed_password not needed as we use Firebase
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    return new_user


@router.delete("/users/{user_id}")
async def remove_user(
    user_id: str,
    user: User = Depends(allow_admin),
    db: AsyncSession = Depends(get_db)
):
    """Remove a user from the organization."""
    if user_id == user.id:
        raise HTTPException(status_code=400, detail="Cannot remove yourself")
        
    result = await db.execute(
        select(User).where(
            User.id == user_id, 
            User.organization_id == user.organization_id
        )
    )
    target_user = result.scalar_one_or_none()
    
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Unlink user
    target_user.organization_id = None
    target_user.role = UserRole.MEMBER
    
    await db.commit()
    return {"status": "ok"}


@router.post("/subscription", response_model=CheckoutResponse)
async def create_subscription_checkout(
    data: CheckoutRequest,
    user: User = Depends(allow_admin),
    db: AsyncSession = Depends(get_db)
):
    """Create a MercadoPago subscription checkout link."""
    # Get Organization
    result = await db.execute(
        select(Organization).where(Organization.id == user.organization_id)
    )
    org = result.scalar_one_or_none()
    
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    try:
        response = await mp_service.create_subscription_link(
            organization=org,
            plan_type=data.plan_type,
            user_email=user.email
        )
        return response
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Checkout error: {e}")
        raise HTTPException(status_code=500, detail="Failed to create subscription link")

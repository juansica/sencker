"""
PJUD Sencker - Admin API Routes.

Protected admin routes for managing organizations, subscriptions, and platform config.
Only accessible by superusers.
"""

from __future__ import annotations

from typing import Optional, List
from datetime import datetime
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.database.database import get_db
from src.database.models import (
    User,
    Organization,
    Subscription,
    Payment,
    OrganizationConfig,
    PlanType,
    SubscriptionStatus,
    PaymentStatus,
    UserRole,
)
from src.api.dependencies import require_superuser


router = APIRouter(prefix="/api/admin", tags=["Admin"])


# ============================================================================
# Pydantic Schemas
# ============================================================================

# Organization schemas
class OrganizationCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    slug: str = Field(..., min_length=2, max_length=100, pattern=r"^[a-z0-9-]+$")
    subdomain: str = Field(..., min_length=2, max_length=100, pattern=r"^[a-z0-9-]+$")


class OrganizationUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    slug: Optional[str] = Field(None, min_length=2, max_length=100, pattern=r"^[a-z0-9-]+$")
    subdomain: Optional[str] = Field(None, min_length=2, max_length=100, pattern=r"^[a-z0-9-]+$")
    is_active: Optional[bool] = None


class SubscriptionResponse(BaseModel):
    id: str
    plan_type: str
    status: str
    current_period_start: Optional[datetime]
    current_period_end: Optional[datetime]
    mp_preapproval_id: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class OrganizationConfigResponse(BaseModel):
    id: str
    logo_url: Optional[str]
    primary_color: Optional[str]
    secondary_color: Optional[str]
    enabled_modules: Optional[List[str]]
    
    class Config:
        from_attributes = True


class UserSummaryResponse(BaseModel):
    id: str
    email: str
    full_name: Optional[str]
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class OrganizationResponse(BaseModel):
    id: str
    name: str
    slug: str
    subdomain: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
    user_count: int = 0
    subscription: Optional[SubscriptionResponse] = None

    class Config:
        from_attributes = True


class OrganizationDetailResponse(OrganizationResponse):
    users: List[UserSummaryResponse] = []
    config: Optional[OrganizationConfigResponse] = None


# Subscription schemas
class SubscriptionCreate(BaseModel):
    organization_id: str
    plan_type: PlanType = PlanType.FREE


class SubscriptionUpdate(BaseModel):
    plan_type: Optional[PlanType] = None
    status: Optional[SubscriptionStatus] = None


# Config schemas
class OrganizationConfigUpdate(BaseModel):
    logo_url: Optional[str] = None
    primary_color: Optional[str] = Field(None, pattern=r"^#[0-9A-Fa-f]{6}$")
    secondary_color: Optional[str] = Field(None, pattern=r"^#[0-9A-Fa-f]{6}$")
    enabled_modules: Optional[List[str]] = None
    custom_settings: Optional[dict] = None


# Dashboard schemas
class DashboardStats(BaseModel):
    total_organizations: int
    active_organizations: int
    total_users: int
    total_subscriptions: int
    subscriptions_by_plan: dict
    subscriptions_by_status: dict
    recent_payments_total: Decimal


# ============================================================================
# Organization Endpoints
# ============================================================================

@router.get("/organizations", response_model=List[OrganizationResponse])
async def list_organizations(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    is_active: Optional[bool] = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_superuser),
):
    """List all organizations with pagination."""
    query = select(Organization).offset(skip).limit(limit)
    
    if is_active is not None:
        query = query.where(Organization.is_active == is_active)
    
    query = query.order_by(Organization.created_at.desc())
    
    result = await db.execute(query)
    organizations = result.scalars().all()
    
    # Get user counts
    response = []
    for org in organizations:
        user_count_result = await db.execute(
            select(func.count(User.id)).where(User.organization_id == org.id)
        )
        user_count = user_count_result.scalar() or 0
        
        # Get subscription
        sub_result = await db.execute(
            select(Subscription).where(Subscription.organization_id == org.id)
        )
        subscription = sub_result.scalar_one_or_none()
        
        response.append(OrganizationResponse(
            id=org.id,
            name=org.name,
            slug=org.slug,
            subdomain=org.subdomain,
            is_active=org.is_active,
            created_at=org.created_at,
            updated_at=org.updated_at,
            user_count=user_count,
            subscription=SubscriptionResponse.model_validate(subscription) if subscription else None,
        ))
    
    return response


@router.post("/organizations", response_model=OrganizationResponse, status_code=201)
async def create_organization(
    data: OrganizationCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_superuser),
):
    """Create a new organization."""
    # Check for existing slug/subdomain
    existing = await db.execute(
        select(Organization).where(
            (Organization.slug == data.slug) | (Organization.subdomain == data.subdomain)
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Organization with this slug or subdomain already exists"
        )
    
    # Create organization
    org = Organization(
        name=data.name,
        slug=data.slug,
        subdomain=data.subdomain,
    )
    db.add(org)
    await db.flush()
    
    # Create default subscription (free plan)
    subscription = Subscription(
        organization_id=org.id,
        plan_type=PlanType.FREE,
        status=SubscriptionStatus.ACTIVE,
    )
    db.add(subscription)
    
    # Create default config
    config = OrganizationConfig(
        organization_id=org.id,
        enabled_modules=["sentencias", "plazos"],
    )
    db.add(config)
    
    await db.commit()
    await db.refresh(org)
    
    return OrganizationResponse(
        id=org.id,
        name=org.name,
        slug=org.slug,
        subdomain=org.subdomain,
        is_active=org.is_active,
        created_at=org.created_at,
        updated_at=org.updated_at,
        user_count=0,
        subscription=SubscriptionResponse.model_validate(subscription),
    )


@router.get("/organizations/{org_id}", response_model=OrganizationDetailResponse)
async def get_organization(
    org_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_superuser),
):
    """Get organization details including users and config."""
    result = await db.execute(
        select(Organization)
        .where(Organization.id == org_id)
        .options(
            selectinload(Organization.users),
            selectinload(Organization.subscription),
            selectinload(Organization.config),
        )
    )
    org = result.scalar_one_or_none()
    
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )
    
    return OrganizationDetailResponse(
        id=org.id,
        name=org.name,
        slug=org.slug,
        subdomain=org.subdomain,
        is_active=org.is_active,
        created_at=org.created_at,
        updated_at=org.updated_at,
        user_count=len(org.users),
        users=[UserSummaryResponse(
            id=u.id,
            email=u.email,
            full_name=u.full_name,
            role=u.role.value,
            is_active=u.is_active,
            created_at=u.created_at,
        ) for u in org.users],
        subscription=SubscriptionResponse.model_validate(org.subscription) if org.subscription else None,
        config=OrganizationConfigResponse.model_validate(org.config) if org.config else None,
    )


@router.put("/organizations/{org_id}", response_model=OrganizationResponse)
async def update_organization(
    org_id: str,
    data: OrganizationUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_superuser),
):
    """Update an organization."""
    result = await db.execute(
        select(Organization).where(Organization.id == org_id)
    )
    org = result.scalar_one_or_none()
    
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )
    
    # Check for conflicts on slug/subdomain update
    if data.slug or data.subdomain:
        conflict_query = select(Organization).where(Organization.id != org_id)
        if data.slug:
            conflict_query = conflict_query.where(Organization.slug == data.slug)
        if data.subdomain:
            conflict_query = conflict_query.where(Organization.subdomain == data.subdomain)
        
        conflict = await db.execute(conflict_query)
        if conflict.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Slug or subdomain already in use"
            )
    
    # Update fields
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(org, field, value)
    
    await db.commit()
    await db.refresh(org)
    
    # Get user count
    user_count_result = await db.execute(
        select(func.count(User.id)).where(User.organization_id == org.id)
    )
    user_count = user_count_result.scalar() or 0
    
    return OrganizationResponse(
        id=org.id,
        name=org.name,
        slug=org.slug,
        subdomain=org.subdomain,
        is_active=org.is_active,
        created_at=org.created_at,
        updated_at=org.updated_at,
        user_count=user_count,
    )


@router.delete("/organizations/{org_id}", status_code=204)
async def delete_organization(
    org_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_superuser),
):
    """Delete an organization (cascades to related records)."""
    result = await db.execute(
        select(Organization).where(Organization.id == org_id)
    )
    org = result.scalar_one_or_none()
    
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )
    
    await db.delete(org)
    await db.commit()


# ============================================================================
# Subscription Endpoints
# ============================================================================

@router.get("/subscriptions", response_model=List[SubscriptionResponse])
async def list_subscriptions(
    status: Optional[SubscriptionStatus] = None,
    plan_type: Optional[PlanType] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_superuser),
):
    """List all subscriptions with filtering."""
    query = select(Subscription).offset(skip).limit(limit)
    
    if status:
        query = query.where(Subscription.status == status)
    if plan_type:
        query = query.where(Subscription.plan_type == plan_type)
    
    query = query.order_by(Subscription.created_at.desc())
    
    result = await db.execute(query)
    subscriptions = result.scalars().all()
    
    return [SubscriptionResponse.model_validate(s) for s in subscriptions]


@router.put("/organizations/{org_id}/subscription", response_model=SubscriptionResponse)
async def update_subscription(
    org_id: str,
    data: SubscriptionUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_superuser),
):
    """Update an organization's subscription."""
    result = await db.execute(
        select(Subscription).where(Subscription.organization_id == org_id)
    )
    subscription = result.scalar_one_or_none()
    
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription not found"
        )
    
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(subscription, field, value)
    
    await db.commit()
    await db.refresh(subscription)
    
    return SubscriptionResponse.model_validate(subscription)


# ============================================================================
# Organization Config Endpoints
# ============================================================================

@router.put("/organizations/{org_id}/config", response_model=OrganizationConfigResponse)
async def update_organization_config(
    org_id: str,
    data: OrganizationConfigUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_superuser),
):
    """Update organization configuration (branding, modules)."""
    result = await db.execute(
        select(OrganizationConfig).where(OrganizationConfig.organization_id == org_id)
    )
    config = result.scalar_one_or_none()
    
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization config not found"
        )
    
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(config, field, value)
    
    await db.commit()
    await db.refresh(config)
    
    return OrganizationConfigResponse.model_validate(config)


# ============================================================================
# Payment History Endpoints
# ============================================================================

@router.get("/organizations/{org_id}/payments")
async def get_organization_payments(
    org_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_superuser),
):
    """Get payment history for an organization."""
    # First get the subscription
    sub_result = await db.execute(
        select(Subscription).where(Subscription.organization_id == org_id)
    )
    subscription = sub_result.scalar_one_or_none()
    
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription not found"
        )
    
    # Get payments
    result = await db.execute(
        select(Payment)
        .where(Payment.subscription_id == subscription.id)
        .offset(skip)
        .limit(limit)
        .order_by(Payment.payment_date.desc())
    )
    payments = result.scalars().all()
    
    return [{
        "id": p.id,
        "amount": float(p.amount),
        "currency": p.currency,
        "status": p.status.value,
        "payment_date": p.payment_date,
        "mp_payment_id": p.mp_payment_id,
    } for p in payments]


# ============================================================================
# Dashboard Stats Endpoint
# ============================================================================

@router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_superuser),
):
    """Get dashboard statistics."""
    # Total organizations
    total_orgs_result = await db.execute(select(func.count(Organization.id)))
    total_organizations = total_orgs_result.scalar() or 0
    
    # Active organizations
    active_orgs_result = await db.execute(
        select(func.count(Organization.id)).where(Organization.is_active == True)
    )
    active_organizations = active_orgs_result.scalar() or 0
    
    # Total users
    total_users_result = await db.execute(select(func.count(User.id)))
    total_users = total_users_result.scalar() or 0
    
    # Total subscriptions
    total_subs_result = await db.execute(select(func.count(Subscription.id)))
    total_subscriptions = total_subs_result.scalar() or 0
    
    # Subscriptions by plan
    plan_counts = {}
    for plan in PlanType:
        count_result = await db.execute(
            select(func.count(Subscription.id)).where(Subscription.plan_type == plan)
        )
        plan_counts[plan.value] = count_result.scalar() or 0
    
    # Subscriptions by status
    status_counts = {}
    for sub_status in SubscriptionStatus:
        count_result = await db.execute(
            select(func.count(Subscription.id)).where(Subscription.status == sub_status)
        )
        status_counts[sub_status.value] = count_result.scalar() or 0
    
    # Recent payments total (last 30 days)
    from datetime import timedelta
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    payments_result = await db.execute(
        select(func.coalesce(func.sum(Payment.amount), 0))
        .where(Payment.payment_date >= thirty_days_ago)
        .where(Payment.status == PaymentStatus.APPROVED)
    )
    recent_payments_total = Decimal(payments_result.scalar() or 0)
    
    return DashboardStats(
        total_organizations=total_organizations,
        active_organizations=active_organizations,
        total_users=total_users,
        total_subscriptions=total_subscriptions,
        subscriptions_by_plan=plan_counts,
        subscriptions_by_status=status_counts,
        recent_payments_total=recent_payments_total,
    )

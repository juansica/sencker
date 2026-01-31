"""
PJUD Sencker - Database Models.

SQLAlchemy models for users, organizations, subscriptions, and scraping tasks.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional, TYPE_CHECKING

from sqlalchemy import String, Text, DateTime, ForeignKey, Enum as SQLEnum, Numeric, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from .database import Base

import enum


# ============================================================================
# Enums
# ============================================================================

class TaskStatus(str, enum.Enum):
    """Status of a scraping task."""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class UserRole(str, enum.Enum):
    """Role of a user within an organization."""
    OWNER = "owner"
    ADMIN = "admin"
    MEMBER = "member"
    VIEWER = "viewer"


class PlanType(str, enum.Enum):
    """Subscription plan types."""
    FREE = "free"
    BASIC = "basic"
    PRO = "pro"
    ENTERPRISE = "enterprise"


class SubscriptionStatus(str, enum.Enum):
    """Subscription status."""
    PENDING = "pending"
    TRIALING = "trialing"
    ACTIVE = "active"
    PAST_DUE = "past_due"
    CANCELLED = "cancelled"
    PAUSED = "paused"


class PaymentStatus(str, enum.Enum):
    """Payment status."""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    REFUNDED = "refunded"


# ============================================================================
# Organization (Multi-tenant)
# ============================================================================

class Organization(Base):
    """Organization/Tenant model for multi-tenant architecture."""
    
    __tablename__ = "organizations"
    
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )
    slug: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        index=True,
        nullable=False
    )
    subdomain: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        index=True,
        nullable=False
    )
    is_active: Mapped[bool] = mapped_column(
        default=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )
    
    # Relationships
    users: Mapped[list["User"]] = relationship(
        "User",
        back_populates="organization",
        cascade="all, delete-orphan"
    )
    subscription: Mapped[Optional["Subscription"]] = relationship(
        "Subscription",
        back_populates="organization",
        uselist=False,
        cascade="all, delete-orphan"
    )
    config: Mapped[Optional["OrganizationConfig"]] = relationship(
        "OrganizationConfig",
        back_populates="organization",
        uselist=False,
        cascade="all, delete-orphan"
    )
    
    def __repr__(self) -> str:
        return f"<Organization {self.name} ({self.subdomain})>"


# ============================================================================
# Subscription (MercadoPago)
# ============================================================================

class Subscription(Base):
    """Subscription model for MercadoPago billing."""
    
    __tablename__ = "subscriptions"
    
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    organization_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        unique=True,
        nullable=False
    )
    
    # Plan info
    plan_type: Mapped[PlanType] = mapped_column(
        SQLEnum(PlanType),
        default=PlanType.FREE
    )
    status: Mapped[SubscriptionStatus] = mapped_column(
        SQLEnum(SubscriptionStatus),
        default=SubscriptionStatus.PENDING
    )
    
    # Billing period
    current_period_start: Mapped[Optional[datetime]] = mapped_column(
        DateTime,
        nullable=True
    )
    current_period_end: Mapped[Optional[datetime]] = mapped_column(
        DateTime,
        nullable=True
    )
    
    # MercadoPago references
    mp_preapproval_id: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True
    )
    mp_payer_id: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True
    )
    mp_plan_id: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True
    )
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )
    
    # Relationships
    organization: Mapped["Organization"] = relationship(
        "Organization",
        back_populates="subscription"
    )
    payments: Mapped[list["Payment"]] = relationship(
        "Payment",
        back_populates="subscription",
        cascade="all, delete-orphan"
    )
    
    def __repr__(self) -> str:
        return f"<Subscription {self.id} ({self.plan_type} - {self.status})>"


# ============================================================================
# Payment History
# ============================================================================

class Payment(Base):
    """Payment history model."""
    
    __tablename__ = "payments"
    
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    subscription_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("subscriptions.id", ondelete="CASCADE"),
        nullable=False
    )
    
    # Payment details
    amount: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False
    )
    currency: Mapped[str] = mapped_column(
        String(3),
        default="ARS"
    )
    status: Mapped[PaymentStatus] = mapped_column(
        SQLEnum(PaymentStatus),
        default=PaymentStatus.PENDING
    )
    
    # MercadoPago references
    mp_payment_id: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True
    )
    mp_merchant_order_id: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True
    )
    
    # Timestamps
    payment_date: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )
    
    # Relationships
    subscription: Mapped["Subscription"] = relationship(
        "Subscription",
        back_populates="payments"
    )
    
    def __repr__(self) -> str:
        return f"<Payment {self.id} ({self.amount} {self.currency} - {self.status})>"


# ============================================================================
# Organization Configuration (Branding & Modules)
# ============================================================================

class OrganizationConfig(Base):
    """Organization configuration for branding and modules."""
    
    __tablename__ = "organization_configs"
    
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    organization_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        unique=True,
        nullable=False
    )
    
    # Branding
    logo_url: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True
    )
    primary_color: Mapped[Optional[str]] = mapped_column(
        String(7),  # #RRGGBB
        nullable=True
    )
    secondary_color: Mapped[Optional[str]] = mapped_column(
        String(7),
        nullable=True
    )
    
    # Modules and features
    enabled_modules: Mapped[Optional[str]] = mapped_column(
        JSON,
        nullable=True,
        default=lambda: ["sentencias", "plazos"]
    )
    
    # Custom settings (flexible JSON storage)
    custom_settings: Mapped[Optional[str]] = mapped_column(
        JSON,
        nullable=True,
        default=lambda: {}
    )
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )
    
    # Relationships
    organization: Mapped["Organization"] = relationship(
        "Organization",
        back_populates="config"
    )
    
    def __repr__(self) -> str:
        return f"<OrganizationConfig for {self.organization_id}>"


# ============================================================================
# User (Updated with Organization relationship)
# ============================================================================

class User(Base):
    """User model for authentication."""
    
    __tablename__ = "users"
    
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False
    )
    hashed_password: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )
    full_name: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True
    )
    is_active: Mapped[bool] = mapped_column(
        default=True
    )
    is_superuser: Mapped[bool] = mapped_column(
        default=False
    )
    
    # Organization relationship (multi-tenant)
    organization_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("organizations.id", ondelete="SET NULL"),
        nullable=True
    )
    role: Mapped[UserRole] = mapped_column(
        SQLEnum(UserRole),
        default=UserRole.MEMBER
    )
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )
    
    # Relationships
    organization: Mapped[Optional["Organization"]] = relationship(
        "Organization",
        back_populates="users"
    )
    tasks: Mapped[list["ScrapingTask"]] = relationship(
        "ScrapingTask",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    
    def __repr__(self) -> str:
        return f"<User {self.email}>"


class ScrapingTask(Base):
    """Scraping task model."""
    
    __tablename__ = "scraping_tasks"
    
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )
    
    # Task configuration
    task_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="civil"
    )
    search_query: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True
    )
    search_params: Mapped[Optional[str]] = mapped_column(
        Text,  # JSON string
        nullable=True
    )
    
    # Task status
    status: Mapped[TaskStatus] = mapped_column(
        SQLEnum(TaskStatus),
        default=TaskStatus.PENDING
    )
    result: Mapped[Optional[str]] = mapped_column(
        Text,  # JSON string
        nullable=True
    )
    error: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True
    )
    screenshot_path: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True
    )
    progress_message: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True
    )
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )
    started_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime,
        nullable=True
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime,
        nullable=True
    )
    
    # Relationships
    user: Mapped["User"] = relationship(
        "User",
        back_populates="tasks"
    )
    
# ============================================================================
# Legal Domain Models (Sentencias & Plazos)
# ============================================================================

class SentenciaStatus(str, enum.Enum):
    """Status of a court case/sentencia."""
    ACTIVA = "activa"
    ARCHIVADA = "archivada"
    SUSPENDIDA = "suspendida"


class PlazoStatus(str, enum.Enum):
    """Status of a legal deadline."""
    PENDIENTE = "pendiente"
    CUMPLIDO = "cumplido"
    VENCIDO = "vencido"
    CANCELADO = "cancelado"


class PlazoTipo(str, enum.Enum):
    """Type of legal deadline."""
    CONTESTACION = "contestacion"
    PRUEBA = "prueba"
    OBSERVACIONES = "observaciones"
    FALLO = "fallo"
    RECURSO = "recurso"
    OTRO = "otro"


class Sentencia(Base):
    """
    Model representing a court case (Causa/Sentencia).
    Linked to an organization.
    """
    __tablename__ = "sentencias"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    organization_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False
    )
    
    # Case Identification
    rol: Mapped[str] = mapped_column(String(50), nullable=False)  # e.g., C-1234-2023
    tribunal: Mapped[str] = mapped_column(String(255), nullable=False)
    caratula: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    materia: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    scraping_task_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    
    # Status
    estado: Mapped[SentenciaStatus] = mapped_column(
        SQLEnum(SentenciaStatus),
        default=SentenciaStatus.ACTIVA
    )
    
    # Detailed PJUD Info (from modal)
    estado_administrativo: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)  # e.g., "Sin archivar"
    procedimiento: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)  # e.g., "Ejecutivo Obligación de Dar"
    ubicacion: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)  # Physical/digital location
    estado_procesal: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)  # e.g., "Tramitación"
    etapa: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)  # e.g., "Contestación Excepciones"
    
    # Detailed data stored as JSON
    litigantes: Mapped[Optional[list[dict]]] = mapped_column(JSON, nullable=True, default=list)  # Array of parties
    historia: Mapped[Optional[list[dict]]] = mapped_column(JSON, nullable=True, default=list)  # Array of history events
    cuadernos: Mapped[Optional[list[dict]]] = mapped_column(JSON, nullable=True, default=list)  # Array of cuadernos with their own histories
    
    # Metadata
    fecha_ingreso: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    custom_tags: Mapped[Optional[str]] = mapped_column(JSON, default=list)  # ["urgent", "civil"]
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    organization: Mapped["Organization"] = relationship("Organization", backref="sentencias")
    plazos: Mapped[list["Plazo"]] = relationship(
        "Plazo", 
        back_populates="sentencia", 
        cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Sentencia {self.rol} - {self.tribunal}>"


class Plazo(Base):
    """
    Model representing a deadline (Plazo) associated with a Sentencia.
    """
    __tablename__ = "plazos"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    sentencia_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("sentencias.id", ondelete="CASCADE"),
        nullable=False
    )
    organization_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False
    )

    # Deadline Details
    descripcion: Mapped[str] = mapped_column(String(255), nullable=False)
    fecha_vencimiento: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    tipo: Mapped[PlazoTipo] = mapped_column(SQLEnum(PlazoTipo), default=PlazoTipo.OTRO)
    
    # Status
    estado: Mapped[PlazoStatus] = mapped_column(
        SQLEnum(PlazoStatus), 
        default=PlazoStatus.PENDIENTE
    )
    
    # Meta
    is_fatal: Mapped[bool] = mapped_column(default=True)  # Si es plazo fatal
    notificado: Mapped[bool] = mapped_column(default=False)  # Si se notificó al usuario
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    sentencia: Mapped["Sentencia"] = relationship("Sentencia", back_populates="plazos")

    def __repr__(self) -> str:
        return f"<Plazo {self.descripcion} (Vence: {self.fecha_vencimiento})>"

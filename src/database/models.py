"""
PJUD Sencker - Database Models.

SQLAlchemy models for users and scraping tasks.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import String, Text, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from .database import Base

import enum


class TaskStatus(str, enum.Enum):
    """Status of a scraping task."""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


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
    
    def __repr__(self) -> str:
        return f"<ScrapingTask {self.id} ({self.status})>"

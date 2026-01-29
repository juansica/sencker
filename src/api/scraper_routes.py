"""
PJUD Sencker - Scraper Routes.

API endpoints for scraper operations.
"""

from __future__ import annotations

import json
import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
import asyncio
from pydantic import BaseModel, field_validator
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.database.database import get_db
from src.database.models import User, ScrapingTask, TaskStatus, Sentencia, SentenciaStatus
from src.api.auth import get_current_user

router = APIRouter(prefix="/api/scraper", tags=["Scraper"])


# ============ Pydantic Schemas ============

class ScraperRunRequest(BaseModel):
    """Request to run a scraping task."""
    task_type: str = "civil"  # civil, laboral, penal, familia
    search_query: Optional[str] = None
    search_params: Optional[dict] = None


class TaskResponse(BaseModel):
    """Scraping task response."""
    id: str
    task_type: str
    status: TaskStatus
    search_query: Optional[str]
    result: Optional[dict]
    error: Optional[str]
    screenshot_path: Optional[str]
    created_at: datetime
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    
    class Config:
        from_attributes = True

    @field_validator("result", mode="before")
    @classmethod
    def parse_result(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                return {}
        return v


class TaskListResponse(BaseModel):
    """List of tasks response."""
    tasks: list[TaskResponse]
    total: int


# ============ Background Task Runner ============

async def run_scraper_task(task_id: str, db_url: str) -> None:
    """
    Background task to run the scraper.
    
    This runs in a separate thread to not block the API.
    """
    # Import here to avoid circular imports
    from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
    from sqlalchemy.orm import sessionmaker
    
    engine = create_async_engine(db_url)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # Get task
        result = await session.execute(
            select(ScrapingTask).where(ScrapingTask.id == task_id)
        )
        task = result.scalar_one_or_none()
        
        if not task:
            return
        
        # Update status to running
        task.status = TaskStatus.RUNNING
        task.started_at = datetime.utcnow()
        await session.commit()
        
        try:
            # Run the actual scraper
            def _run_sync_scraper(query: Optional[str]) -> dict:
                from src.scrapers.civil_scraper import CivilScraper
                with CivilScraper() as scraper:
                    return scraper.run(search_query=query)

            loop = asyncio.get_running_loop()
            scraper_result = await loop.run_in_executor(None, _run_sync_scraper, task.search_query)
            
            # --- PROCESS RESULTS & CREATE SENTENCIAS ---
            if "data" in scraper_result and isinstance(scraper_result["data"], list):
                # Get user organization
                user_result = await session.execute(
                    select(User).where(User.id == task.user_id)
                )
                user = user_result.scalar_one_or_none()
                
                if user and user.organization_id:
                    count_new = 0
                    for item in scraper_result["data"]:
                        rol = item.get("rol")
                        if not rol:
                            continue
                            
                        # Check existance
                        existing = await session.execute(
                            select(Sentencia).where(
                                Sentencia.rol == rol,
                                Sentencia.organization_id == user.organization_id
                            )
                        )
                        if not existing.scalar_one_or_none():
                            # Create new
                            fecha_ingreso = None
                            if item.get("fecha_ingreso"):
                                try:
                                    fecha_ingreso = datetime.fromisoformat(item["fecha_ingreso"])
                                except:
                                    pass

                            new_sentencia = Sentencia(
                                id=str(uuid.uuid4()),
                                organization_id=user.organization_id,
                                rol=rol,
                                tribunal=item.get("tribunal", "Desconocido"),
                                caratula=item.get("caratula"),
                                materia=item.get("materia"),
                                fecha_ingreso=fecha_ingreso or datetime.utcnow(),
                                estado=SentenciaStatus.ACTIVA
                            )
                            session.add(new_sentencia)
                            count_new += 1
                    
                    if count_new > 0:
                        scraper_result["processed_info"] = f"Created {count_new} new Sentencias"

            # Update with results
            task.status = TaskStatus.COMPLETED
            task.result = json.dumps(scraper_result)
            task.completed_at = datetime.utcnow()
            
            # Get screenshot path if available
            if "screenshot" in scraper_result:
                task.screenshot_path = scraper_result["screenshot"]
            
        except Exception as e:
            task.status = TaskStatus.FAILED
            task.error = str(e)
            task.completed_at = datetime.utcnow()
        
        await session.commit()
    
    await engine.dispose()


# ============ API Endpoints ============

@router.post("/run", response_model=TaskResponse, status_code=status.HTTP_202_ACCEPTED)
async def run_scraper(
    request: ScraperRunRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> ScrapingTask:
    """
    Start a new scraping task.
    
    The task runs in the background and can be monitored via /status/{task_id}.
    
    - **task_type**: Type of scraper (civil, laboral, etc.)
    - **search_query**: Optional search query (RUT, ROL, etc.)
    - **search_params**: Optional additional parameters
    """
    # Create task record
    task = ScrapingTask(
        user_id=current_user.id,
        task_type=request.task_type,
        search_query=request.search_query,
        search_params=json.dumps(request.search_params) if request.search_params else None,
        status=TaskStatus.PENDING,
    )
    
    db.add(task)
    await db.commit()
    await db.refresh(task)
    
    # Get database URL for background task
    import os
    db_url = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./sencker.db")
    
    # Queue background task
    background_tasks.add_task(run_scraper_task, task.id, db_url)
    
    return task


@router.get("/status/{task_id}", response_model=TaskResponse)
async def get_task_status(
    task_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> ScrapingTask:
    """
    Get status of a scraping task.
    
    Only the task owner can view the status.
    """
    result = await db.execute(
        select(ScrapingTask).where(
            ScrapingTask.id == task_id,
            ScrapingTask.user_id == current_user.id
        )
    )
    task = result.scalar_one_or_none()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    return task


@router.get("/history", response_model=TaskListResponse)
async def get_task_history(
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> TaskListResponse:
    """
    Get user's scraping task history.
    
    - **skip**: Number of records to skip (pagination)
    - **limit**: Maximum records to return (max 100)
    """
    limit = min(limit, 100)
    
    # Get tasks
    result = await db.execute(
        select(ScrapingTask)
        .where(ScrapingTask.user_id == current_user.id)
        .order_by(ScrapingTask.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    tasks = result.scalars().all()
    
    # Get total count
    from sqlalchemy import func
    count_result = await db.execute(
        select(func.count(ScrapingTask.id))
        .where(ScrapingTask.user_id == current_user.id)
    )
    total = count_result.scalar()
    
    return TaskListResponse(tasks=list(tasks), total=total)


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> None:
    """
    Delete a scraping task.
    
    Only the task owner can delete.
    """
    result = await db.execute(
        select(ScrapingTask).where(
            ScrapingTask.id == task_id,
            ScrapingTask.user_id == current_user.id
        )
    )
    task = result.scalar_one_or_none()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    await db.delete(task)
    await db.commit()

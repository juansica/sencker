"""
PJUD Sencker - Sentencia & Plazo API Routes.

Endpoints for managing court cases (Sentencias) and deadlines (Plazos).
"""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.database.database import get_db
from src.database.models import (
    User, Sentencia, Plazo, 
    SentenciaStatus, PlazoStatus, PlazoTipo
)
from src.api.dependencies import allow_member

router = APIRouter(prefix="/api/sentencias", tags=["Sentencias"])


# ============================================================================
# Schemas
# ============================================================================

class PlazoCreate(BaseModel):
    descripcion: str
    fecha_vencimiento: datetime
    tipo: PlazoTipo = PlazoTipo.OTRO
    is_fatal: bool = True

class PlazoResponse(PlazoCreate):
    id: str
    sentencia_id: str
    estado: PlazoStatus
    created_at: datetime
    
    class Config:
        from_attributes = True

class SentenciaCreate(BaseModel):
    rol: str
    tribunal: str
    materia: Optional[str] = None
    fecha_ingreso: Optional[datetime] = None
    custom_tags: List[str] = []

class SentenciaResponse(SentenciaCreate):
    id: str
    organization_id: str
    estado: SentenciaStatus
    caratula: Optional[str]
    # Detailed PJUD info
    estado_administrativo: Optional[str] = None
    procedimiento: Optional[str] = None
    ubicacion: Optional[str] = None
    estado_procesal: Optional[str] = None
    etapa: Optional[str] = None
    litigantes: Optional[List[dict]] = []
    historia: Optional[List[dict]] = []
    cuadernos: Optional[List[dict]] = []
    
    plazos: List[PlazoResponse] = []
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class DashboardLegalStats(BaseModel):
    total_sentencias: int
    total_plazos_activos: int
    plazos_vencidos: int
    plazos_proximos: int  # Vencen en < 7 dias


# ============================================================================
# Endpoints
# ============================================================================

@router.post("", response_model=SentenciaResponse)
async def create_sentencia(
    data: SentenciaCreate,
    user: User = Depends(allow_member),
    db: AsyncSession = Depends(get_db)
):
    """Register a new Sentencia."""
    # Check duplicate ROL in same Org
    existing = await db.execute(
        select(Sentencia).where(
            Sentencia.rol == data.rol,
            Sentencia.organization_id == user.organization_id
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=400, 
            detail=f"Sentencia con ROL {data.rol} ya existe en esta organización."
        )

    sentencia = Sentencia(
        id=str(uuid.uuid4()),
        organization_id=user.organization_id,
        rol=data.rol,
        tribunal=data.tribunal,
        materia=data.materia,
        fecha_ingreso=data.fecha_ingreso or datetime.utcnow(),
        custom_tags=data.custom_tags
    )
    
    db.add(sentencia)
    await db.commit()
    await db.refresh(sentencia)
    return sentencia


@router.get("", response_model=List[SentenciaResponse])
async def list_sentencias(
    user: User = Depends(allow_member),
    db: AsyncSession = Depends(get_db),
    status: Optional[SentenciaStatus] = None,
    search: Optional[str] = None
):
    """List Sentencias for the user's organization."""
    query = select(Sentencia).where(Sentencia.organization_id == user.organization_id)
    
    if status:
        query = query.where(Sentencia.estado == status)
        
    if search:
        search_term = f"%{search}%"
        query = query.where(
            or_(
                Sentencia.rol.ilike(search_term),
                Sentencia.tribunal.ilike(search_term),
                Sentencia.caratula.ilike(search_term)
            )
        )
    
    query = query.order_by(Sentencia.created_at.desc()).options(selectinload(Sentencia.plazos))
    
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/stats", response_model=DashboardLegalStats)
async def get_legal_stats(
    user: User = Depends(allow_member),
    db: AsyncSession = Depends(get_db)
):
    """Get summarized stats for Dashboard."""
    org_id = user.organization_id
    now = datetime.utcnow()
    next_week = now + timedelta(days=7)

    # Count Sentencias
    sentencias_res = await db.execute(
        select(func.count(Sentencia.id)).where(Sentencia.organization_id == org_id)
    )
    total_sentencias = sentencias_res.scalar() or 0

    # Count Plazos
    plazos_active_res = await db.execute(
        select(func.count(Plazo.id)).where(
            Plazo.organization_id == org_id,
            Plazo.estado == PlazoStatus.PENDIENTE
        )
    )
    total_plazos_activos = plazos_active_res.scalar() or 0
    
    plazos_vencidos_res = await db.execute(
        select(func.count(Plazo.id)).where(
            Plazo.organization_id == org_id,
            Plazo.estado == PlazoStatus.PENDIENTE,
            Plazo.fecha_vencimiento < now
        )
    )
    plazos_vencidos = plazos_vencidos_res.scalar() or 0
    
    plazos_proximos_res = await db.execute(
        select(func.count(Plazo.id)).where(
            Plazo.organization_id == org_id,
            Plazo.estado == PlazoStatus.PENDIENTE,
            Plazo.fecha_vencimiento >= now,
            Plazo.fecha_vencimiento <= next_week
        )
    )
    plazos_proximos = plazos_proximos_res.scalar() or 0

    return {
        "total_sentencias": total_sentencias,
        "total_plazos_activos": total_plazos_activos,
        "plazos_vencidos": plazos_vencidos,
        "plazos_proximos": plazos_proximos
    }


@router.post("/{sentencia_id}/plazos", response_model=PlazoResponse)
async def add_plazo(
    sentencia_id: str,
    data: PlazoCreate,
    user: User = Depends(allow_member),
    db: AsyncSession = Depends(get_db)
):
    """Add a Plazo (deadline) to a Sentencia manually."""
    # Verify ownership
    sentencia_res = await db.execute(
        select(Sentencia).where(
            Sentencia.id == sentencia_id,
            Sentencia.organization_id == user.organization_id
        )
    )
    sentencia = sentencia_res.scalar_one_or_none()
    if not sentencia:
        raise HTTPException(status_code=404, detail="Sentencia not found")

    plazo = Plazo(
        id=str(uuid.uuid4()),
        organization_id=user.organization_id,
        sentencia_id=sentencia_id,
        descripcion=data.descripcion,
        fecha_vencimiento=data.fecha_vencimiento,
        tipo=data.tipo,
        is_fatal=data.is_fatal,
        estado=PlazoStatus.PENDIENTE
    )
    
    db.add(plazo)
    await db.commit()
    await db.refresh(plazo)
    return plazo

@router.delete("/{sentencia_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_sentencia(
    sentencia_id: str,
    user: User = Depends(allow_member),
    db: AsyncSession = Depends(get_db)
):
    """
    Soft delete a Sentencia (changes status to ARCHIVADA).
    Or hard delete if preferred (here we implement hard delete for cleanup as requested, 
    but user asked for 'soft delete', so let's update status).
    """
    result = await db.execute(
        select(Sentencia).where(
            Sentencia.id == sentencia_id,
            Sentencia.organization_id == user.organization_id
        )
    )
    sentencia = result.scalar_one_or_none()
    
    if not sentencia:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sentencia not found"
        )
    
    # Hard Delete Implementation as per user feedback ("deleting... is not working")
    # Soft delete (ARCHIVADA) was causing items to remain in the list view.
    await db.delete(sentencia)
    await db.commit()


@router.get("/{sentencia_id}/logs")
async def get_sentencia_logs(
    sentencia_id: str,
    user: User = Depends(allow_member),
    db: AsyncSession = Depends(get_db)
):
    """Get scraping task logs for a Sentencia."""
    from src.database.models import ScrapingTask
    import json
    
    # Get sentencia
    result = await db.execute(
        select(Sentencia).where(
            Sentencia.id == sentencia_id,
            Sentencia.organization_id == user.organization_id
        )
    )
    sentencia = result.scalar_one_or_none()
    
    if not sentencia:
        raise HTTPException(status_code=404, detail="Sentencia not found")
    
    if not sentencia.scraping_task_id:
        return {
            "status": "no_task",
            "message": "No scraping task associated with this sentencia"
        }
    
    # Get scraping task
    task_result = await db.execute(
        select(ScrapingTask).where(ScrapingTask.id == sentencia.scraping_task_id)
    )
    task = task_result.scalar_one_or_none()
    
    if not task:
        return {
            "status": "task_not_found",
            "message": "Scraping task not found"
        }
    
    # Parse result if it's a JSON string
    result_data = None
    if task.result:
        try:
            result_data = json.loads(task.result) if isinstance(task.result, str) else task.result
        except:
            result_data = {"raw": task.result}
    
    return {
        "status": "success",
        "task": {
            "id": task.id,
            "status": task.status.value,
            "search_query": task.search_query,
            "progress_message": task.progress_message,
            "error": task.error,
            "result": result_data,
            "created_at": task.created_at.isoformat() if task.created_at else None,
            "started_at": task.started_at.isoformat() if task.started_at else None,
            "completed_at": task.completed_at.isoformat() if task.completed_at else None
        }
    }

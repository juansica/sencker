"""
PJUD Sencker - Webhook Routes.

Handles incoming webhooks from external services (MercadoPago).
"""

from __future__ import annotations

from typing import Dict, Any

from fastapi import APIRouter, Depends, Request, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from src.database.database import get_db
from src.api.mercadopago_service import MercadoPagoService


router = APIRouter(prefix="/api/webhooks", tags=["Webhooks"])
mp_service = MercadoPagoService()


@router.post("/mercadopago")
async def mercadopago_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Handle MercadoPago webhooks.
    MP sends a POST request with query params indicating the topic and id.
    
    Example: ?topic=payment&id=123456789
    Or JSON body for some newer webhook versions.
    """
    try:
        # Check query params first (MP standard)
        topic = request.query_params.get("topic") or request.query_params.get("type")
        resource_id = request.query_params.get("id") or request.query_params.get("data.id")

        # If not in query, check body
        if not topic or not resource_id:
            body = await request.json()
            topic = body.get("type")
            data = body.get("data", {})
            resource_id = data.get("id")

        if not topic or not resource_id:
            # Acknowledge anyway to stop retries if it's a format we don't understand
            return {"status": "ok"}
        
        print(f"Received MP Webhook: topic={topic}, id={resource_id}")

        await mp_service.process_webhook(db, topic, resource_id)
        
        return {"status": "ok"}

    except Exception as e:
        print(f"Webhook Error: {e}")
        # Return 200 to acknowledge receipt even on error, to prevent MP from spamming
        # (Unless we want MP to retry, then return 500)
        return {"status": "error", "detail": str(e)}

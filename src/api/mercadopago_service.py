"""
PJUD Sencker - MercadoPago Subscription Service.

Handles interaction with MercadoPago API for subscriptions and payments.
"""

from __future__ import annotations

import os
from typing import Optional, Dict, Any
from datetime import datetime, timedelta

import mercadopago
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from src.database.models import (
    Subscription, 
    Payment, 
    Organization, 
    PlanType,
    SubscriptionStatus,
    PaymentStatus
)


class MercadoPagoService:
    """Service for handling MercadoPago subscriptions."""

    def __init__(self):
        self.access_token = os.getenv("MERCADOPAGO_ACCESS_TOKEN", "")
        self.sdk = mercadopago.SDK(self.access_token)
        
        # Plan definitions (would normally be in DB or config)
        self.plans = {
            PlanType.BASIC: {
                "transaction_amount": 15000,
                "reason": "Sencker Plan Básico - Suscripción Mensual",
                "frequency": 1,
                "frequency_type": "months"
            },
            PlanType.PRO: {
                "transaction_amount": 35000,
                "reason": "Sencker Plan Pro - Suscripción Mensual",
                "frequency": 1,
                "frequency_type": "months"
            },
            PlanType.ENTERPRISE: {
                "transaction_amount": 80000,
                "reason": "Sencker Plan Enterprise - Suscripción Mensual",
                "frequency": 1,
                "frequency_type": "months"
            }
        }

    async def create_subscription_link(
        self, 
        organization: Organization, 
        plan_type: PlanType,
        user_email: str
    ) -> Dict[str, Any]:
        """
        Creates a preapproval (subscription) preference in MercadoPago.
        Returns the init_point (URL) for the user to authorize.
        """
        if plan_type == PlanType.FREE:
            raise ValueError("Cannot create payment link for Free plan")

        plan_details = self.plans.get(plan_type)
        if not plan_details:
            raise ValueError(f"Invalid plan type: {plan_type}")

        # Create preapproval data
        # See: https://www.mercadopago.cl/developers/en/reference/preapproval/create
        preapproval_data = {
            "reason": plan_details["reason"],
            "external_reference": organization.id,  # Link to our organization
            "payer_email": user_email,
            "auto_recurring": {
                "frequency": plan_details["frequency"],
                "frequency_type": plan_details["frequency_type"],
                "transaction_amount": plan_details["transaction_amount"],
                "currency_id": "CLP"
            },
            "back_url": "https://backoffice.sencker.com/subscriptions/success",
            "status": "pending"
        }

        try:
            # We use the 'preapproval' endpoint to create a subscription directly
            # Alternatively we could create a 'plan' and then a subscription to it,
            # but simple recurring payments are often easier efficiently this way.
            # However, the Python SDK maps 'preapproval' usually to /preapproval
            
            result = self.sdk.preapproval().create(preapproval_data)
            
            if result["status"] == 201:
                return {
                    "init_point": result["response"]["init_point"],
                    "preapproval_id": result["response"]["id"]
                }
            else:
                raise Exception(f"MP API Error: {result['response']}")

        except Exception as e:
            print(f"Error creating subscription: {e}")
            raise

    async def process_webhook(self, db: AsyncSession, topic: str, resource_id: str):
        """
        Process incoming webhooks from MercadoPago.
        Topics: 'payment', 'subscription', 'merchant_order'
        """
        if topic == "payment":
            await self._handle_payment_update(db, resource_id)
        elif topic == "subscription" or topic == "preapproval":
            await self._handle_subscription_update(db, resource_id)

    async def _handle_payment_update(self, db: AsyncSession, payment_id: str):
        """Handle payment status updates."""
        try:
            result = self.sdk.payment().get(payment_id)
            if result["status"] != 200:
                print(f"Error getting payment {payment_id}")
                return

            data = result["response"]
            external_ref = data.get("external_reference")  # Should be org_id usually
            
            # Map status
            status_map = {
                "approved": PaymentStatus.APPROVED,
                "pending": PaymentStatus.PENDING,
                "in_process": PaymentStatus.PENDING,
                "rejected": PaymentStatus.REJECTED,
                "refunded": PaymentStatus.REFUNDED,
                "cancelled": PaymentStatus.REJECTED,
            }
            new_status = status_map.get(data["status"], PaymentStatus.PENDING)

            # Find payment logic using external_ref or metadata would be better,
            # but MP 'preapproval' payments might check subscription ID linkage.
            # For simplicity, we record this payment linked to the subscription.
            
            # Note: For recurring payments, MP sends the `preapproval_id` in the payment data.
            # But sometimes it's under 'order' or other fields.
            
            # Start simplistically: Record detailed payment info.
            # We need to find which subscription this belongs to.
            # Typically data['order']['id'] or data['metadata'] helps.
            
            # Let's check if we track this payment already
            payment_query = select(Payment).where(Payment.mp_payment_id == str(payment_id))
            result_db = await db.execute(payment_query)
            payment = result_db.scalar_one_or_none()

            if payment:
                payment.status = new_status
                payment.updated_at = datetime.utcnow()
            else:
                # Need to find subscription
                # In a real implementation with preapproval, we might need to lookup 
                # the subscription locally via some identifier.
                # If we passed external_reference = org_id in preapproval, 
                # does it carry over to individual payments? Usually yes.
                if external_ref:
                    # Find active subscription for this org
                    sub_query = select(Subscription).where(
                        Subscription.organization_id == external_ref
                    )
                    sub_result = await db.execute(sub_query)
                    subscription = sub_result.scalar_one_or_none()
                    
                    if subscription:
                        payment = Payment(
                            subscription_id=subscription.id,
                            amount=data.get("transaction_amount", 0),
                            currency=data.get("currency_id", "CLP"),
                            status=new_status,
                            mp_payment_id=str(payment_id),
                            payment_date=datetime.fromisoformat(data["date_created"].replace("Z", "+00:00")),
                        )
                        db.add(payment)

            await db.commit()

        except Exception as e:
            print(f"Error handling payment webhook: {e}")
            await db.rollback()

    async def _handle_subscription_update(self, db: AsyncSession, preapproval_id: str):
        """Handle subscription (preapproval) status updates."""
        try:
            result = self.sdk.preapproval().get(preapproval_id)
            if result["status"] != 200:
                return

            data = result["response"]
            external_ref = data.get("external_reference")
            
            if not external_ref:
                return

            # Find subscription by org_id (external_ref)
            query = select(Subscription).where(Subscription.organization_id == external_ref)
            result_db = await db.execute(query)
            subscription = result_db.scalar_one_or_none()

            if subscription:
                # Update status
                mp_status = data["status"]  # authorized, paused, cancelled
                
                status_map = {
                    "authorized": SubscriptionStatus.ACTIVE,
                    "paused": SubscriptionStatus.PAUSED,
                    "cancelled": SubscriptionStatus.CANCELLED,
                    "pending": SubscriptionStatus.PENDING,
                }
                
                subscription.status = status_map.get(mp_status, SubscriptionStatus.PENDING)
                subscription.mp_preapproval_id = preapproval_id
                
                # Update dates
                if "next_payment_date" in data:
                    subscription.current_period_end = datetime.fromisoformat(
                        data["next_payment_date"].replace("Z", "+00:00")
                    )
                
                await db.commit()

        except Exception as e:
            print(f"Error handling subscription webhook: {e}")
            await db.rollback()

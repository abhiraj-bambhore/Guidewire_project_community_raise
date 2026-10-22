"""
BillingCenter — Guidewire practice module.

Responsibilities:
  - create_invoice()   → generate a premium invoice for a policy
  - record_payment()   → mark invoice paid
  - mark_overdue()     → set overdue and trigger lapse notification
  - is_first_premium_paid() → gate used by escrow release

Swap path: replace with real Guidewire BillingCenter REST adapter.
"""
from __future__ import annotations
import uuid
import json
from datetime import date, timedelta
from typing import Any
from app.database import get_db


class BillingCenter:
    """Practice implementation of Guidewire BillingCenter."""

    # ─── Public interface ────────────────────────────────────────────────────

    async def create_invoice(
        self,
        policy_id: str,
        campaign_id: str,
        amount: float,
        due_days: int = 7,
    ) -> dict[str, Any]:
        """Create a premium invoice and return it."""
        invoice_number = f"BC-INV-{uuid.uuid4().hex[:8].upper()}"
        due_date = date.today() + timedelta(days=due_days)

        async with get_db() as conn:
            row = await conn.fetchrow(
                """
                INSERT INTO bc_invoices
                  (id, policy_id, campaign_id, invoice_number, amount, status, due_date)
                VALUES ($1,$2,$3,$4,$5,'unpaid',$6)
                RETURNING *
                """,
                str(uuid.uuid4()),
                policy_id,
                campaign_id,
                invoice_number,
                amount,
                due_date,
            )
        return dict(row)

    async def record_payment(
        self, invoice_id: str, amount: float, note: str = ""
    ) -> dict[str, Any]:
        """Record payment against an invoice and flip its status to paid."""
        async with get_db() as conn:
            payment = await conn.fetchrow(
                """
                INSERT INTO bc_payments (id, invoice_id, amount, note)
                VALUES ($1, $2, $3, $4)
                RETURNING *
                """,
                str(uuid.uuid4()),
                invoice_id,
                amount,
                note,
            )
            await conn.execute(
                "UPDATE bc_invoices SET status='paid' WHERE id=$1",
                invoice_id,
            )
        return dict(payment)

    async def mark_overdue(self, invoice_id: str) -> None:
        async with get_db() as conn:
            await conn.execute(
                "UPDATE bc_invoices SET status='overdue' WHERE id=$1",
                invoice_id,
            )

    async def is_first_premium_paid(self, campaign_id: str) -> bool:
        """Returns True if at least one invoice for this campaign is paid."""
        async with get_db() as conn:
            row = await conn.fetchrow(
                """
                SELECT COUNT(*) AS cnt
                FROM bc_invoices
                WHERE campaign_id=$1 AND status='paid'
                """,
                campaign_id,
            )
        return (row["cnt"] or 0) > 0

    async def get_invoices_for_campaign(self, campaign_id: str) -> list[dict]:
        async with get_db() as conn:
            rows = await conn.fetch(
                "SELECT * FROM bc_invoices WHERE campaign_id=$1 ORDER BY created_at",
                campaign_id,
            )
        return [dict(r) for r in rows]

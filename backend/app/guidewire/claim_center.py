"""
ClaimCenter — Guidewire practice module.

Responsibilities:
  - open_claim()       → create a new claim and set reserves
  - set_reserve()      → adjust reserve amount
  - pay_claim()        → record claim payment to holding account ONLY
  - close_claim()      → finalise the claim

Swap path: replace with real Guidewire ClaimCenter REST adapter.
"""
from __future__ import annotations
import uuid
import json
from datetime import datetime
from typing import Any
from app.database import get_db
from app.ai.gemini_client import GeminiClient


class ClaimCenter:
    """Practice implementation of Guidewire ClaimCenter."""

    def __init__(self, gemini: GeminiClient) -> None:
        self._gemini = gemini

    # ─── Public interface ────────────────────────────────────────────────────

    async def open_claim(
        self,
        policy_id: str,
        campaign_id: str,
        loss_type: str,
        loss_amount: float,
        reserve_amount: float | None = None,
    ) -> dict[str, Any]:
        """Open a new claim, set initial reserves, and return the claim record."""
        claim_number = f"CC-CLM-{uuid.uuid4().hex[:8].upper()}"
        reserve = reserve_amount if reserve_amount is not None else loss_amount * 0.8

        # Generate narrative via Gemini
        narrative = await self._gemini.generate_claim_narrative(
            loss_type, loss_amount, campaign_id
        )

        async with get_db() as conn:
            claim = await conn.fetchrow(
                """
                INSERT INTO cc_claims
                  (id, policy_id, campaign_id, claim_number, status,
                   loss_type, loss_amount, reserve_amount, narrative)
                VALUES ($1,$2,$3,$4,'open',$5,$6,$7,$8)
                RETURNING *
                """,
                str(uuid.uuid4()),
                policy_id,
                campaign_id,
                claim_number,
                loss_type,
                loss_amount,
                reserve,
                narrative,
            )
            # Log initial reserve
            await conn.execute(
                """
                INSERT INTO cc_reserves (id, claim_id, amount, note)
                VALUES ($1,$2,$3,'Initial reserve on claim opening')
                """,
                str(uuid.uuid4()),
                str(claim["id"]),
                reserve,
            )
        return dict(claim)

    async def set_reserve(
        self, claim_id: str, amount: float, note: str = ""
    ) -> None:
        """Adjust reserve on a claim."""
        async with get_db() as conn:
            await conn.execute(
                "UPDATE cc_claims SET reserve_amount=$1 WHERE id=$2",
                amount,
                claim_id,
            )
            await conn.execute(
                """
                INSERT INTO cc_reserves (id, claim_id, amount, note)
                VALUES ($1,$2,$3,$4)
                """,
                str(uuid.uuid4()),
                claim_id,
                amount,
                note,
            )

    async def pay_claim(
        self,
        claim_id: str,
        campaign_id: str,
        amount: float,
        note: str = "",
    ) -> dict[str, Any]:
        """
        Record a claim payment. Recipient is ALWAYS 'holding_account'.
        This is enforced at the data layer — Rule 4 of the safety checker.
        """
        async with get_db() as conn:
            payment = await conn.fetchrow(
                """
                INSERT INTO cc_claim_payments
                  (id, claim_id, campaign_id, amount, recipient, note)
                VALUES ($1,$2,$3,$4,'holding_account',$5)
                RETURNING *
                """,
                str(uuid.uuid4()),
                claim_id,
                campaign_id,
                amount,
                note,
            )
            # Update campaign holding account
            await conn.execute(
                """
                UPDATE campaigns
                SET holding_account_balance = holding_account_balance + $1
                WHERE id = $2
                """,
                amount,
                campaign_id,
            )
            # Update claim status to reserved/paid
            await conn.execute(
                "UPDATE cc_claims SET status='paid' WHERE id=$1",
                claim_id,
            )
        return dict(payment)

    async def close_claim(self, claim_id: str) -> None:
        async with get_db() as conn:
            await conn.execute(
                "UPDATE cc_claims SET status='closed', closed_at=NOW() WHERE id=$1",
                claim_id,
            )

    async def get_claims_for_campaign(self, campaign_id: str) -> list[dict]:
        async with get_db() as conn:
            rows = await conn.fetch(
                "SELECT * FROM cc_claims WHERE campaign_id=$1 ORDER BY opened_at DESC",
                campaign_id,
            )
        return [dict(r) for r in rows]

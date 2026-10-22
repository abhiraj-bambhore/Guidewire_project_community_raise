"""
Campaign service — business logic for campaign lifecycle.
Handles state transitions, investing, escrow, releases, and refunds.
"""
from __future__ import annotations
import uuid
import json
from datetime import datetime
from typing import Any

from app.database import get_db
from app.guidewire import PolicyCenter, BillingCenter, ClaimCenter
from app.services.checker_service import CheckerService


class CampaignService:
    def __init__(
        self,
        policy_center: PolicyCenter,
        billing_center: BillingCenter,
        claim_center: ClaimCenter,
        checker: CheckerService,
    ) -> None:
        self._pc = policy_center
        self._bc = billing_center
        self._cc = claim_center
        self._checker = checker

    # ─── Read operations ──────────────────────────────────────────────────────

    async def list_campaigns(self, state: str | None = None) -> list[dict]:
        async with get_db() as conn:
            if state:
                rows = await conn.fetch(
                    """SELECT c.*, m.name as merchant_name
                       FROM campaigns c
                       JOIN merchants m ON m.id = c.merchant_id
                       WHERE c.state = $1
                       ORDER BY c.created_at DESC""",
                    state,
                )
            else:
                rows = await conn.fetch(
                    """SELECT c.*, m.name as merchant_name
                       FROM campaigns c
                       JOIN merchants m ON m.id = c.merchant_id
                       ORDER BY c.created_at DESC"""
                )
        return [dict(r) for r in rows]

    async def get_campaign(self, campaign_id: str) -> dict | None:
        async with get_db() as conn:
            row = await conn.fetchrow(
                """SELECT c.*, m.name as merchant_name, m.city as merchant_city
                   FROM campaigns c
                   JOIN merchants m ON m.id = c.merchant_id
                   WHERE c.id = $1""",
                campaign_id,
            )
        return dict(row) if row else None

    async def get_campaign_timeline(self, campaign_id: str) -> list[dict]:
        async with get_db() as conn:
            rows = await conn.fetch(
                """SELECT * FROM audit_events
                   WHERE campaign_id = $1
                   ORDER BY created_at ASC""",
                campaign_id,
            )
        return [dict(r) for r in rows]

    # ─── Create campaign ──────────────────────────────────────────────────────

    async def create_campaign(self, data: dict) -> dict:
        campaign_id = str(uuid.uuid4())
        async with get_db() as conn:
            row = await conn.fetchrow(
                """INSERT INTO campaigns
                     (id, merchant_id, title, story, outlet_type, state,
                      target_amount, min_investment, max_investment,
                      insured_amount, area_sqft, has_fire_safety_cert, city)
                   VALUES ($1,$2,$3,$4,$5,'draft',$6,$7,$8,$9,$10,$11,$12)
                   RETURNING *""",
                campaign_id,
                data["merchant_id"],
                data["title"],
                data.get("story", ""),
                data["outlet_type"],
                data["target_amount"],
                data.get("min_investment", 1000),
                data.get("max_investment"),
                data.get("insured_amount", data["target_amount"]),
                data.get("area_sqft", 0),
                data.get("has_fire_safety_cert", False),
                data["city"],
            )
            await self._audit(conn, campaign_id, "campaign_created", data)
        return dict(row)

    # ─── State transitions ────────────────────────────────────────────────────

    async def submit_for_underwriting(self, campaign_id: str) -> dict:
        """Draft -> Underwriting: get a quote from PolicyCenter."""
        campaign = await self.get_campaign(campaign_id)
        if not campaign or campaign["state"] != "draft":
            raise ValueError("Campaign must be in 'draft' state")

        quote = await self._pc.quote(
            campaign_id,
            campaign["outlet_type"],
            float(campaign["insured_amount"]),
            float(campaign["area_sqft"]),
            campaign["has_fire_safety_cert"],
        )

        new_state = "underwriting"
        if quote["decision"] == "declined":
            new_state = "declined"

        async with get_db() as conn:
            await conn.execute(
                "UPDATE campaigns SET state=$1 WHERE id=$2",
                new_state,
                campaign_id,
            )
            await self._audit(conn, campaign_id, "underwriting_submitted", quote)

        return {**quote, "new_state": new_state}

    async def approve_underwriting(self, campaign_id: str) -> dict:
        """Underwriting -> Live: approve and make campaign live."""
        campaign = await self.get_campaign(campaign_id)
        if not campaign or campaign["state"] != "underwriting":
            raise ValueError("Campaign must be in 'underwriting' state")

        async with get_db() as conn:
            await conn.execute(
                "UPDATE campaigns SET state='live' WHERE id=$1",
                campaign_id,
            )
            await self._audit(conn, campaign_id, "underwriting_approved", {})
        return {"state": "live"}

    async def mark_funded(self, campaign_id: str) -> dict:
        """Live -> Funded: target reached, issue policy and create invoice."""
        campaign = await self.get_campaign(campaign_id)
        if not campaign or campaign["state"] != "live":
            raise ValueError("Campaign must be in 'live' state")

        # Get quote again for policy issuance
        quote = await self._pc.quote(
            campaign_id,
            campaign["outlet_type"],
            float(campaign["insured_amount"]),
            float(campaign["area_sqft"]),
            campaign["has_fire_safety_cert"],
        )

        # Issue policy via PolicyCenter
        policy = await self._pc.issue_policy(
            campaign_id,
            quote,
            campaign["outlet_type"],
            float(campaign["insured_amount"]),
        )

        # Create premium invoice via BillingCenter
        invoice = await self._bc.create_invoice(
            str(policy["id"]),
            campaign_id,
            float(policy["premium_amount"]),
        )

        async with get_db() as conn:
            await conn.execute(
                "UPDATE campaigns SET state='funded' WHERE id=$1",
                campaign_id,
            )
            await self._audit(conn, campaign_id, "campaign_funded", {
                "policy_number": policy["policy_number"],
                "invoice_number": invoice["invoice_number"],
            })

        await self._checker.run_for_campaign(campaign_id)
        return {"state": "funded", "policy": dict(policy), "invoice": dict(invoice)}

    async def pay_premium(self, campaign_id: str) -> dict:
        """Pay the first premium invoice, transition Funded -> Active."""
        invoices = await self._bc.get_invoices_for_campaign(campaign_id)
        unpaid = [i for i in invoices if i["status"] == "unpaid"]
        if not unpaid:
            raise ValueError("No unpaid invoice found")

        invoice = unpaid[0]
        payment = await self._bc.record_payment(
            str(invoice["id"]),
            float(invoice["amount"]),
            "First premium payment",
        )

        campaign = await self.get_campaign(campaign_id)
        if campaign and campaign["state"] == "funded":
            async with get_db() as conn:
                await conn.execute(
                    "UPDATE campaigns SET state='active' WHERE id=$1",
                    campaign_id,
                )
                await self._audit(conn, campaign_id, "premium_paid_active", {
                    "invoice_id": str(invoice["id"]),
                    "amount": float(invoice["amount"]),
                })

        await self._checker.run_for_campaign(campaign_id)
        return {"state": "active", "payment": dict(payment)}

    async def release_tranche(self, campaign_id: str, tranche: int) -> dict:
        """Release funds in parts: tranche 1=50%, 2=25%, 3=25%."""
        campaign = await self.get_campaign(campaign_id)
        if not campaign or campaign["state"] not in ("active", "under_claim"):
            raise ValueError("Campaign must be in 'active' state")

        # Check first premium paid
        if not await self._bc.is_first_premium_paid(campaign_id):
            raise ValueError("First premium must be paid before any release")

        # Check tranche not already released
        async with get_db() as conn:
            existing = await conn.fetchval(
                "SELECT COUNT(*) FROM releases WHERE campaign_id=$1 AND tranche=$2",
                campaign_id,
                tranche,
            )
            if existing:
                raise ValueError(f"Tranche {tranche} already released")

        pct_map = {1: 0.50, 2: 0.25, 3: 0.25}
        pct = pct_map.get(tranche)
        if not pct:
            raise ValueError("Tranche must be 1, 2, or 3")

        amount = float(campaign["total_raised"]) * pct

        async with get_db() as conn:
            await conn.execute(
                """INSERT INTO releases (id, campaign_id, tranche, amount, note)
                   VALUES ($1,$2,$3,$4,$5)""",
                str(uuid.uuid4()),
                campaign_id,
                tranche,
                amount,
                f"Tranche {tranche} release ({int(pct*100)}%)",
            )
            await conn.execute(
                """UPDATE campaigns
                   SET total_released = total_released + $1,
                       total_held = total_held - $1
                   WHERE id = $2""",
                amount,
                campaign_id,
            )
            await self._audit(conn, campaign_id, "tranche_released", {
                "tranche": tranche,
                "amount": amount,
            })

        await self._checker.run_for_campaign(campaign_id)
        return {"tranche": tranche, "amount": amount}

    async def simulate_loss(
        self, campaign_id: str, loss_type: str, loss_amount: float
    ) -> dict:
        """Open a claim via ClaimCenter. Moves campaign to under_claim."""
        campaign = await self.get_campaign(campaign_id)
        if not campaign or campaign["state"] not in ("active", "funded"):
            raise ValueError("Campaign must be 'active' or 'funded'")

        policy = await self._pc.get_policy_for_campaign(campaign_id)
        if not policy:
            raise ValueError("No policy found for this campaign")

        claim = await self._cc.open_claim(
            str(policy["id"]),
            campaign_id,
            loss_type,
            loss_amount,
        )

        # Pay claim to holding account
        claim_payment = await self._cc.pay_claim(
            str(claim["id"]),
            campaign_id,
            loss_amount * 0.8,
            "Claim payment to holding account",
        )

        async with get_db() as conn:
            await conn.execute(
                "UPDATE campaigns SET state='under_claim' WHERE id=$1",
                campaign_id,
            )
            await self._audit(conn, campaign_id, "loss_simulated", {
                "claim_number": claim["claim_number"],
                "loss_type": loss_type,
                "loss_amount": loss_amount,
            })

        await self._checker.run_for_campaign(campaign_id)
        return {"state": "under_claim", "claim": dict(claim)}

    async def fail_campaign(self, campaign_id: str) -> dict:
        """Mark campaign as failed and refund all investors."""
        campaign = await self.get_campaign(campaign_id)
        if not campaign:
            raise ValueError("Campaign not found")

        async with get_db() as conn:
            # Get all confirmed investments
            investments = await conn.fetch(
                "SELECT * FROM investments WHERE campaign_id=$1 AND status='confirmed'",
                campaign_id,
            )
            total_refunded = 0.0
            for inv in investments:
                amount = float(inv["amount"])
                await conn.execute(
                    """INSERT INTO refunds (id, campaign_id, investment_id, investor_id, amount)
                       VALUES ($1,$2,$3,$4,$5)""",
                    str(uuid.uuid4()),
                    campaign_id,
                    str(inv["id"]),
                    str(inv["investor_id"]),
                    amount,
                )
                await conn.execute(
                    "UPDATE investments SET status='refunded', refunded_at=NOW() WHERE id=$1",
                    str(inv["id"]),
                )
                total_refunded += amount

            await conn.execute(
                """UPDATE campaigns
                   SET state='failed', total_refunded=$1, total_held=0
                   WHERE id=$2""",
                total_refunded,
                campaign_id,
            )
            await self._audit(conn, campaign_id, "campaign_failed", {
                "total_refunded": total_refunded,
            })

        await self._checker.run_for_campaign(campaign_id)
        return {"state": "failed", "total_refunded": total_refunded}

    async def pause_campaign(self, campaign_id: str, reason: str = "") -> dict:
        async with get_db() as conn:
            await conn.execute(
                "UPDATE campaigns SET state='paused' WHERE id=$1", campaign_id
            )
            await self._audit(conn, campaign_id, "campaign_paused", {"reason": reason})
        return {"state": "paused"}

    # ─── Investing ────────────────────────────────────────────────────────────

    async def invest(
        self, campaign_id: str, investor_id: str, amount: float
    ) -> dict:
        campaign = await self.get_campaign(campaign_id)
        if not campaign or campaign["state"] != "live":
            raise ValueError("Campaign is not accepting investments")

        # Check limits
        if campaign["min_investment"] and amount < float(campaign["min_investment"]):
            raise ValueError(f"Minimum investment is Rs {campaign['min_investment']}")
        if campaign["max_investment"] and amount > float(campaign["max_investment"]):
            raise ValueError(f"Maximum investment is Rs {campaign['max_investment']}")

        remaining = float(campaign["target_amount"]) - float(campaign["total_raised"])
        if amount > remaining + 0.01:
            raise ValueError(f"Investment exceeds remaining capacity of Rs {remaining:.2f}")

        investment_id = str(uuid.uuid4())

        async with get_db() as conn:
            inv = await conn.fetchrow(
                """INSERT INTO investments (id, campaign_id, investor_id, amount, status)
                   VALUES ($1,$2,$3,$4,'confirmed')
                   RETURNING *""",
                investment_id,
                campaign_id,
                investor_id,
                amount,
            )
            # Create matching escrow receipt
            await conn.execute(
                """INSERT INTO escrow_receipts (id, campaign_id, investment_id, amount, note)
                   VALUES ($1,$2,$3,$4,'Investment escrow receipt')""",
                str(uuid.uuid4()),
                campaign_id,
                investment_id,
                amount,
            )
            # Update totals
            await conn.execute(
                """UPDATE campaigns
                   SET total_raised = total_raised + $1,
                       total_held = total_held + $1
                   WHERE id = $2""",
                amount,
                campaign_id,
            )
            await self._audit(conn, campaign_id, "investment_made", {
                "investor_id": investor_id,
                "amount": amount,
            })

        await self._checker.run_for_campaign(campaign_id)
        return dict(inv)

    async def get_investments_for_campaign(self, campaign_id: str) -> list[dict]:
        async with get_db() as conn:
            rows = await conn.fetch(
                """SELECT i.*, inv.name as investor_name
                   FROM investments i
                   JOIN investors inv ON inv.id = i.investor_id
                   WHERE i.campaign_id=$1
                   ORDER BY i.created_at DESC""",
                campaign_id,
            )
        return [dict(r) for r in rows]

    async def get_investments_for_investor(self, investor_id: str) -> list[dict]:
        async with get_db() as conn:
            rows = await conn.fetch(
                """SELECT i.*, c.title as campaign_title, c.state as campaign_state,
                          c.outlet_type, c.target_amount, c.total_raised
                   FROM investments i
                   JOIN campaigns c ON c.id = i.campaign_id
                   WHERE i.investor_id=$1
                   ORDER BY i.created_at DESC""",
                investor_id,
            )
        return [dict(r) for r in rows]

    # ─── Helpers ──────────────────────────────────────────────────────────────

    @staticmethod
    async def _audit(conn, campaign_id: str, event_type: str, payload: dict) -> None:
        await conn.execute(
            """INSERT INTO audit_events (id, campaign_id, actor, event_type, payload)
               VALUES ($1, $2, 'system', $3, $4::jsonb)""",
            str(uuid.uuid4()),
            campaign_id,
            event_type,
            json.dumps(payload, default=str),
        )

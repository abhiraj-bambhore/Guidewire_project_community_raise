"""
Safety Checker — eight business rules enforced after every event.
Also runs as a background scan via APScheduler.
"""
from __future__ import annotations
import uuid
import json
from typing import Any
from app.database import get_db
from app.ai.gemini_client import GeminiClient


RULES = {
    1: "Confirmed investments equal escrow receipts",
    2: "Funded or Active campaign must have an in-force policy",
    3: "No fund release before first premium is paid",
    4: "Claim payments go only to the holding account",
    5: "Cancelled or lapsed policy forces campaign to Paused",
    6: "Total invested capital must balance with held, released, and refunded funds",
    7: "Investment limits respected and total raised never exceeds target",
    8: "Failed campaigns fully refunded",
}


class CheckerService:
    def __init__(self, gemini: GeminiClient) -> None:
        self._gemini = gemini

    async def run_for_campaign(self, campaign_id: str) -> list[dict]:
        """Run all eight rules for a single campaign. Return list of violations."""
        violations = []
        async with get_db() as conn:
            campaign = await conn.fetchrow(
                "SELECT * FROM campaigns WHERE id=$1", campaign_id
            )
            if not campaign:
                return []

            c = dict(campaign)
            violations += await self._rule1(conn, c)
            violations += await self._rule2(conn, c)
            violations += await self._rule3(conn, c)
            violations += await self._rule4(conn, c)
            violations += await self._rule5(conn, c)
            violations += await self._rule6(conn, c)
            violations += await self._rule7(conn, c)
            violations += await self._rule8(conn, c)

        # Persist violations (clear old auto ones first)
        await self._persist_violations(campaign_id, violations)
        return violations

    async def run_full_scan(self) -> dict[str, list[dict]]:
        """Run checker for all active campaigns. Called by APScheduler."""
        async with get_db() as conn:
            campaigns = await conn.fetch("SELECT id FROM campaigns")
        result = {}
        for row in campaigns:
            cid = str(row["id"])
            result[cid] = await self.run_for_campaign(cid)
        return result

    async def inject_fault(self, campaign_id: str) -> dict:
        """Deliberately create a Rule 1 violation for demo purposes."""
        async with get_db() as conn:
            # Insert a ghost escrow receipt not tied to any real investment
            await conn.execute(
                """
                INSERT INTO escrow_receipts (id, campaign_id, amount, note)
                VALUES ($1, $2, 99999, 'INJECTED FAULT — for demo only')
                """,
                str(uuid.uuid4()),
                campaign_id,
            )
            # Record as an injected violation
            ai_text = await self._gemini.explain_violation(
                1, RULES[1], "A ghost escrow receipt was injected that has no matching investment."
            )
            violation_id = str(uuid.uuid4())
            await conn.execute(
                """
                INSERT INTO checker_violations
                  (id, campaign_id, rule_number, rule_name,
                   description, ai_explanation, severity, injected)
                VALUES ($1,$2,1,$3,$4,$5,'critical',TRUE)
                """,
                violation_id,
                campaign_id,
                RULES[1],
                "A ghost escrow receipt (99,999) was injected with no matching investment.",
                ai_text,
            )
        return {"violation_id": violation_id, "rule": 1, "injected": True}

    async def fix_injected_faults(self, campaign_id: str) -> int:
        """Remove injected ghost receipts and resolve injected violations."""
        async with get_db() as conn:
            deleted = await conn.fetchval(
                """
                DELETE FROM escrow_receipts
                WHERE campaign_id=$1 AND note LIKE 'INJECTED FAULT%'
                RETURNING COUNT(*)
                """,
                campaign_id,
            )
            await conn.execute(
                """
                UPDATE checker_violations
                SET resolved=TRUE, resolved_at=NOW()
                WHERE campaign_id=$1 AND injected=TRUE AND resolved=FALSE
                """,
                campaign_id,
            )
        return deleted or 0

    async def get_violations(self, campaign_id: str | None = None) -> list[dict]:
        async with get_db() as conn:
            if campaign_id:
                rows = await conn.fetch(
                    """
                    SELECT * FROM checker_violations
                    WHERE campaign_id=$1 AND resolved=FALSE
                    ORDER BY created_at DESC
                    """,
                    campaign_id,
                )
            else:
                rows = await conn.fetch(
                    """
                    SELECT * FROM checker_violations
                    WHERE resolved=FALSE
                    ORDER BY created_at DESC
                    LIMIT 200
                    """,
                )
        return [dict(r) for r in rows]

    # ─── Rule implementations ────────────────────────────────────────────────

    async def _rule1(self, conn, c: dict) -> list[dict]:
        """Confirmed investments == escrow receipts."""
        inv_total = await conn.fetchval(
            "SELECT COALESCE(SUM(amount),0) FROM investments WHERE campaign_id=$1 AND status IN ('confirmed', 'refunded')",
            c["id"],
        )
        escrow_total = await conn.fetchval(
            "SELECT COALESCE(SUM(amount),0) FROM escrow_receipts WHERE campaign_id=$1",
            c["id"],
        )
        if abs(float(inv_total) - float(escrow_total)) > 0.01:
            diff = abs(float(inv_total) - float(escrow_total))
            return [self._make_violation(
                c["id"], 1,
                f"Documented investments of ₹{float(inv_total):,.2f} do not match escrow account balance of ₹{float(escrow_total):,.2f} (unaccounted discrepancy: ₹{diff:,.2f}).",
            )]
        return []

    async def _rule2(self, conn, c: dict) -> list[dict]:
        """Funded/Active must have in-force policy."""
        if c["state"] not in ("funded", "active", "under_claim"):
            return []
        policy = await conn.fetchrow(
            "SELECT status FROM pc_policies WHERE campaign_id=$1 ORDER BY created_at DESC LIMIT 1",
            c["id"],
        )
        if not policy or policy["status"] != "in_force":
            return [self._make_violation(
                c["id"], 2,
                f"Campaign is '{c['state']}' but no in-force policy found. Policy status: {policy['status'] if policy else 'none'}",
            )]
        return []

    async def _rule3(self, conn, c: dict) -> list[dict]:
        """No release before first premium paid."""
        released = await conn.fetchval(
            "SELECT COALESCE(SUM(amount),0) FROM releases WHERE campaign_id=$1",
            c["id"],
        )
        if float(released) <= 0:
            return []
        paid_invoices = await conn.fetchval(
            "SELECT COUNT(*) FROM bc_invoices WHERE campaign_id=$1 AND status='paid'",
            c["id"],
        )
        if (paid_invoices or 0) == 0:
            return [self._make_violation(
                c["id"], 3,
                f"Rs {released} was released but no invoice has been paid yet.",
            )]
        return []

    async def _rule4(self, conn, c: dict) -> list[dict]:
        """Claim payments go only to holding_account."""
        bad = await conn.fetchval(
            """
            SELECT COUNT(*) FROM cc_claim_payments
            WHERE campaign_id=$1 AND recipient != 'holding_account'
            """,
            c["id"],
        )
        if (bad or 0) > 0:
            return [self._make_violation(
                c["id"], 4,
                f"{bad} claim payment(s) found with recipient other than 'holding_account'.",
            )]
        return []

    async def _rule5(self, conn, c: dict) -> list[dict]:
        """Cancelled/lapsed policy forces Paused state."""
        policy = await conn.fetchrow(
            "SELECT status FROM pc_policies WHERE campaign_id=$1 ORDER BY created_at DESC LIMIT 1",
            c["id"],
        )
        if policy and policy["status"] in ("cancelled", "lapsed"):
            if c["state"] not in ("paused", "failed", "declined"):
                return [self._make_violation(
                    c["id"], 5,
                    f"Policy is '{policy['status']}' but campaign is '{c['state']}' instead of 'paused'.",
                )]
        return []

    async def _rule6(self, conn, c: dict) -> list[dict]:
        """Held + released + refunded == total invested."""
        total_inv = float(c["total_raised"])
        held = float(c["total_held"])
        released = float(c["total_released"])
        refunded = float(c["total_refunded"])
        if abs((held + released + refunded) - total_inv) > 1.0:
            total_accounted = held + released + refunded
            diff = abs(total_accounted - total_inv)
            return [self._make_violation(
                c["id"], 6,
                f"Ledger reconciliation mismatch: Total accounted funds (held ₹{held:,.2f}, released ₹{released:,.2f}, and refunded ₹{refunded:,.2f} equaling ₹{total_accounted:,.2f}) does not match total invested capital of ₹{total_inv:,.2f} (unbalanced variance: ₹{diff:,.2f}).",
            )]
        return []

    async def _rule7(self, conn, c: dict) -> list[dict]:
        """Total raised never exceeds target; per-investor limits respected."""
        violations = []
        if float(c["total_raised"]) > float(c["target_amount"]) + 0.01:
            violations.append(self._make_violation(
                c["id"], 7,
                f"Total raised ({c['total_raised']}) exceeds target ({c['target_amount']}).",
            ))
        if c["max_investment"]:
            bad = await conn.fetchval(
                """
                SELECT COUNT(*) FROM investments
                WHERE campaign_id=$1 AND amount > $2 AND status='confirmed'
                """,
                c["id"],
                c["max_investment"],
            )
            if (bad or 0) > 0:
                violations.append(self._make_violation(
                    c["id"], 7,
                    f"{bad} investment(s) exceed the per-investor limit of Rs {c['max_investment']}.",
                ))
        return violations

    async def _rule8(self, conn, c: dict) -> list[dict]:
        """Failed campaigns must be fully refunded."""
        if c["state"] != "failed":
            return []
        unrefunded = await conn.fetchval(
            "SELECT COUNT(*) FROM investments WHERE campaign_id=$1 AND status='confirmed'",
            c["id"],
        )
        if (unrefunded or 0) > 0:
            return [self._make_violation(
                c["id"], 8,
                f"{unrefunded} investment(s) still marked 'confirmed' in a Failed campaign.",
            )]
        return []

    # ─── Helpers ─────────────────────────────────────────────────────────────

    def _make_violation(self, campaign_id: str, rule: int, context: str) -> dict:
        return {
            "campaign_id": campaign_id,
            "rule_number": rule,
            "rule_name": RULES[rule],
            "context": context,
        }

    async def _persist_violations(self, campaign_id: str, violations: list[dict]) -> None:
        async with get_db() as conn:
            # Clear previous non-injected violations for this campaign
            await conn.execute(
                """
                UPDATE checker_violations
                SET resolved=TRUE, resolved_at=NOW()
                WHERE campaign_id=$1 AND injected=FALSE AND resolved=FALSE
                """,
                campaign_id,
            )
            for v in violations:
                ai_text = await self._gemini.explain_violation(
                    v["rule_number"], v["rule_name"], v["context"]
                )
                await conn.execute(
                    """
                    INSERT INTO checker_violations
                      (id, campaign_id, rule_number, rule_name,
                       description, ai_explanation, severity, injected)
                    VALUES ($1,$2,$3,$4,$5,$6,'critical',FALSE)
                    """,
                    str(uuid.uuid4()),
                    campaign_id,
                    v["rule_number"],
                    v["rule_name"],
                    v["context"],
                    ai_text,
                )

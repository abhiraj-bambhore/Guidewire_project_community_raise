"""
PolicyCenter — Guidewire practice module.

Responsibilities:
  - quote()           → calculate premium and return underwriting decision
  - issue_policy()    → persist in-force policy and emit policy_issued event
  - cancel_policy()   → set status to cancelled
  - lapse_policy()    → set status to lapsed

Swap path: replace this module with a real Guidewire PolicyCenter REST adapter.
The rest of the system calls only the methods below and expects the same return
shapes. No other file imports internal implementation details.
"""
from __future__ import annotations
import uuid
from datetime import date, timedelta
from typing import Any
from app.database import get_db
from app.ai.gemini_client import GeminiClient

# ─── Premium rate table ───────────────────────────────────────────────────────
BASE_RATES: dict[str, float] = {
    "cafe": 0.0035,
    "gym": 0.0045,
    "bakery": 0.0055,
    "salon": 0.0030,
    "restaurant": 0.0060,
}

SUPPORTED_TYPES = set(BASE_RATES.keys())

OUTLET_COVERAGES = {
    "bakery": [
        "Commercial Hearth & Deck Oven Breakdown",
        "Raw Material & Cold Storage Spoilage",
        "Combustible Dust & Fire Special Perils",
        "Business Interruption (Supply Chain Halts)",
        "Food Product Contamination & Customer Liability",
    ],
    "cafe": [
        "Espresso Steam Boiler & Grinder Breakdown",
        "Walk-In Milk & Beverage Perishable Spoilage",
        "Roasting Exhaust & Fire Special Perils",
        "Customer Slip & Fall Public Liability",
        "Business Interruption (Footfall Halts)",
    ],
    "gym": [
        "High-Intensity Athletic Rig & Motor Breakdown",
        "Member Traumatic Injury & Premises Liability",
        "Locker Room Pipe Burst & Water Ingress Peril",
        "Business Interruption (Membership Continuity)",
        "Professional Fitness Trainer Indemnity",
    ],
    "salon": [
        "Cosmetic Chemical Treatment & Scalp Liability",
        "Hydraulic Chairs & Laser Equipment Breakdown",
        "Electrical Surge & Special Fire Perils",
        "Water Supply Interruption Endorsement",
        "Business Interruption (Appointment Book Loss)",
    ],
    "restaurant": [
        "Commercial Grease Hood & Flue Fire Perils",
        "Walk-In Deep Freezer Spoilage Protection",
        "Foodborne Pathogen & Beverage Contamination",
        "Heavy Duty Range & HVAC Breakdown",
        "Dining Floor Public Bodily Injury Liability",
        "Peak-Hours Business Interruption Compensation",
    ],
}

DEFAULT_COVERAGE = [
    "Fire and Special Perils",
    "Business Interruption",
    "Equipment Breakdown",
    "Public Liability",
]

def get_custom_coverages(outlet_type: str, has_fire_safety_cert: bool = True, area_sqft: float = 0, insured_amount: float = 0) -> list[str]:
    ot = (outlet_type or "").lower().strip()
    covs = list(OUTLET_COVERAGES.get(ot, DEFAULT_COVERAGE))
    if has_fire_safety_cert:
        covs.append("Certified Municipal Fire Safety Warranty Credit")
    else:
        covs.append("Non-Certified Peril Surcharge Condition")
    if area_sqft > 2000:
        covs.append("Large Footprint Commercial Umbrella Floater")
    if insured_amount > 2_500_000:
        covs.append("High-Value Capital Asset Restoration Endorsement")
    return covs

MANUAL_REVIEW_THRESHOLD = 2_500_000   # 25 lakh in rupees


class PolicyCenter:
    """Practice implementation of Guidewire PolicyCenter."""

    def __init__(self, gemini: GeminiClient) -> None:
        self._gemini = gemini

    # ─── Public interface ────────────────────────────────────────────────────

    async def quote(
        self,
        campaign_id: str,
        outlet_type: str,
        insured_amount: float,
        area_sqft: float,
        has_fire_safety_cert: bool,
    ) -> dict[str, Any]:
        """
        Returns a quote dict:
          {
            "premium": float,
            "base_rate": float,
            "decision": "approved" | "manual_review" | "declined",
            "coverage": [...],
            "notes": str,
            "ai_explanation": str,
          }
        """
        outlet_type = outlet_type.lower()

        # Rule: decline unsupported outlet types
        if outlet_type not in SUPPORTED_TYPES:
            ai_text = await self._gemini.explain_underwriting(
                outlet_type, insured_amount, "declined", "Outlet type not supported"
            )
            return {
                "premium": 0.0,
                "base_rate": 0.0,
                "decision": "declined",
                "coverage": [],
                "notes": f"Outlet type '{outlet_type}' is not supported.",
                "ai_explanation": ai_text,
            }

        base_rate = BASE_RATES[outlet_type]
        rate = base_rate

        if not has_fire_safety_cert:
            rate += base_rate * 0.20  # +20%
        if area_sqft > 2000:
            rate += base_rate * 0.10  # +10%

        premium = insured_amount * rate

        # Rule: manual review if no cert and insured > 25 lakh
        if not has_fire_safety_cert and insured_amount > MANUAL_REVIEW_THRESHOLD:
            decision = "manual_review"
            notes = (
                "No fire safety certificate and insured amount exceeds 25 lakh. "
                "Sent for manual review."
            )
        else:
            decision = "approved"
            notes = "Underwriting approved automatically."

        ai_text = await self._gemini.explain_underwriting(
            outlet_type, insured_amount, decision, notes
        )

        return {
            "premium": round(premium, 2),
            "base_rate": rate,
            "decision": decision,
            "coverage": get_custom_coverages(outlet_type, has_fire_safety_cert, area_sqft, insured_amount),
            "notes": notes,
            "ai_explanation": ai_text,
        }

    async def issue_policy(
        self,
        campaign_id: str,
        quote: dict[str, Any],
        outlet_type: str,
        insured_amount: float,
    ) -> dict[str, Any]:
        """
        Persists the policy as in_force and emits a policy_issued event.
        Returns the created policy record.
        """
        policy_number = f"PCR-{uuid.uuid4().hex[:8].upper()}"
        today = date.today()
        expiry = today + timedelta(days=365)

        async with get_db() as conn:
            policy = await conn.fetchrow(
                """
                INSERT INTO pc_policies
                  (id, campaign_id, policy_number, status, outlet_type,
                   insured_amount, premium_amount, base_rate,
                   coverage_details, underwriting_notes,
                   underwriting_decision, effective_date, expiry_date)
                VALUES ($1,$2,$3,'in_force',$4,$5,$6,$7,$8,$9,$10,$11,$12)
                RETURNING *
                """,
                str(uuid.uuid4()),
                campaign_id,
                policy_number,
                outlet_type,
                insured_amount,
                quote["premium"],
                quote["base_rate"],
                str(quote["coverage"]),
                quote.get("notes", ""),
                quote["decision"],
                today,
                expiry,
            )
            await self._emit_event(conn, str(policy["id"]), "policy_issued", {
                "campaign_id": campaign_id,
                "policy_number": policy_number,
            })

        return dict(policy)

    async def cancel_policy(self, policy_id: str, reason: str = "") -> None:
        """Cancel a policy and emit the event."""
        async with get_db() as conn:
            await conn.execute(
                "UPDATE pc_policies SET status='cancelled' WHERE id=$1",
                policy_id,
            )
            await self._emit_event(conn, policy_id, "policy_cancelled", {"reason": reason})

    async def lapse_policy(self, policy_id: str) -> None:
        """Lapse a policy due to non-payment and emit the event."""
        async with get_db() as conn:
            await conn.execute(
                "UPDATE pc_policies SET status='lapsed' WHERE id=$1",
                policy_id,
            )
            await self._emit_event(conn, policy_id, "policy_lapsed", {})

    async def get_policy_for_campaign(self, campaign_id: str) -> dict | None:
        async with get_db() as conn:
            row = await conn.fetchrow(
                "SELECT * FROM pc_policies WHERE campaign_id=$1 ORDER BY created_at DESC LIMIT 1",
                campaign_id,
            )
        return dict(row) if row else None

    # ─── Internal ────────────────────────────────────────────────────────────

    @staticmethod
    async def _emit_event(
        conn, policy_id: str, event_type: str, payload: dict
    ) -> None:
        import json
        await conn.execute(
            """
            INSERT INTO pc_events (id, policy_id, event_type, payload)
            VALUES ($1, $2, $3, $4::jsonb)
            """,
            str(uuid.uuid4()),
            policy_id,
            event_type,
            json.dumps(payload),
        )

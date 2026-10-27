"""Guidewire module API router — PolicyCenter, BillingCenter, ClaimCenter & AI Layer."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Any
from app.routers.deps import get_policy_center, get_billing_center, get_claim_center, get_gemini
from app.database import get_db

router = APIRouter(prefix="/api/guidewire", tags=["guidewire"])


class QuoteRequest(BaseModel):
    campaign_id: str
    outlet_type: str
    insured_amount: float
    area_sqft: float = 1200
    has_fire_safety_cert: bool = True


class PayInvoiceRequest(BaseModel):
    invoice_id: str
    amount: float
    note: str = "Premium payment via BillingCenter Portal"


class OpenClaimRequest(BaseModel):
    policy_id: str
    campaign_id: str
    loss_type: str
    loss_amount: float
    reserve_amount: Optional[float] = None


class PayClaimRequest(BaseModel):
    claim_id: str
    campaign_id: str
    amount: float
    recipient: str = "holding_account"
    note: str = "Guidewire ClaimCenter indemnity dispatch"


# ─── Individual Campaign Endpoints ──────────────────────────────────────────

@router.get("/policy/{campaign_id}")
async def get_policy(campaign_id: str):
    pc = get_policy_center()
    policy = await pc.get_policy_for_campaign(campaign_id)
    if not policy:
        raise HTTPException(404, "No policy found for this campaign")
    return {"policy": policy}


@router.get("/invoices/{campaign_id}")
async def get_invoices(campaign_id: str):
    bc = get_billing_center()
    invoices = await bc.get_invoices_for_campaign(campaign_id)
    return {"invoices": invoices}


@router.get("/claims/{campaign_id}")
async def get_claims(campaign_id: str):
    cc = get_claim_center()
    claims = await cc.get_claims_for_campaign(campaign_id)
    return {"claims": claims}


# ─── PolicyCenter Enterprise View ───────────────────────────────────────────

@router.get("/policycenter/all")
async def get_all_policies():
    async with get_db() as conn:
        rows = await conn.fetch(
            """
            SELECT p.*, c.title as campaign_title, c.city as campaign_city, 
                   c.target_amount, c.total_raised, m.name as merchant_name
            FROM pc_policies p
            JOIN campaigns c ON c.id = p.campaign_id
            JOIN merchants m ON m.id = c.merchant_id
            ORDER BY p.created_at DESC
            """
        )
    policies = [dict(r) for r in rows]
    total_insured = sum(float(p.get("insured_amount") or 0) for p in policies)
    in_force_count = sum(1 for p in policies if p.get("status") == "in_force")
    pending_count = sum(1 for p in policies if p.get("status") in ("pending", "underwriting"))

    return {
        "policies": policies,
        "stats": {
            "total_policies": len(policies),
            "in_force_policies": in_force_count,
            "pending_policies": pending_count,
            "total_insured_sum": total_insured,
            "avg_base_rate": "0.45%",
        },
    }


@router.post("/policycenter/quote")
async def calculate_quote(req: QuoteRequest):
    pc = get_policy_center()
    quote = await pc.quote(
        req.campaign_id,
        req.outlet_type,
        req.insured_amount,
        req.area_sqft,
        req.has_fire_safety_cert,
    )
    return {"quote": quote}


# ─── BillingCenter Enterprise View ──────────────────────────────────────────

@router.get("/billingcenter/all")
async def get_all_billing():
    async with get_db() as conn:
        inv_rows = await conn.fetch(
            """
            SELECT i.*, p.policy_number, c.title as campaign_title, m.name as merchant_name
            FROM bc_invoices i
            JOIN pc_policies p ON p.id = i.policy_id
            JOIN campaigns c ON c.id = i.campaign_id
            JOIN merchants m ON m.id = c.merchant_id
            ORDER BY i.created_at DESC
            """
        )
        pay_rows = await conn.fetch(
            """
            SELECT p.*, i.invoice_number
            FROM bc_payments p
            JOIN bc_invoices i ON i.id = p.invoice_id
            ORDER BY p.paid_at DESC
            LIMIT 50
            """
        )
        # Calculate escrow breakdown
        campaigns = await conn.fetch("SELECT total_raised, total_held, total_released, total_refunded FROM campaigns")

    invoices = [dict(r) for r in inv_rows]
    payments = [dict(r) for r in pay_rows]

    total_billed = sum(float(i.get("amount") or 0) for i in invoices)
    total_paid = sum(float(i.get("amount") or 0) for i in invoices if i.get("status") == "paid")
    total_unpaid = sum(float(i.get("amount") or 0) for i in invoices if i.get("status") != "paid")

    total_invested = sum(float(c["total_raised"]) for c in campaigns)
    total_held = sum(float(c["total_held"]) for c in campaigns)
    total_released = sum(float(c["total_released"]) for c in campaigns)

    return {
        "invoices": invoices,
        "recent_payments": payments,
        "escrow_ledger": {
            "total_investor_capital": total_invested,
            "holding_escrow_pool": total_held,
            "disbursed_merchant_capital": total_released,
            "insurance_reserve_balance": total_paid,
        },
        "stats": {
            "total_invoices": len(invoices),
            "total_billed": total_billed,
            "total_collected": total_paid,
            "total_outstanding": total_unpaid,
            "collection_rate": f"{(total_paid / total_billed * 100):.1f}%" if total_billed > 0 else "100%",
        },
    }


@router.post("/billingcenter/pay")
async def pay_invoice(req: PayInvoiceRequest):
    bc = get_billing_center()
    payment = await bc.record_payment(req.invoice_id, req.amount, req.note)
    return {"payment": payment, "status": "paid"}


# ─── ClaimCenter Enterprise View & AI Layer ─────────────────────────────────

@router.get("/claimcenter/all")
async def get_all_claims():
    async with get_db() as conn:
        claim_rows = await conn.fetch(
            """
            SELECT cl.*, p.policy_number, c.title as campaign_title, 
                   c.city as campaign_city, m.name as merchant_name
            FROM cc_claims cl
            JOIN pc_policies p ON p.id = cl.policy_id
            JOIN campaigns c ON c.id = cl.campaign_id
            JOIN merchants m ON m.id = c.merchant_id
            ORDER BY cl.opened_at DESC
            """
        )
        pay_rows = await conn.fetch(
            """
            SELECT cp.*, cl.claim_number, c.title as campaign_title
            FROM cc_claim_payments cp
            JOIN cc_claims cl ON cl.id = cp.claim_id
            JOIN campaigns c ON c.id = cp.campaign_id
            ORDER BY cp.paid_at DESC
            LIMIT 50
            """
        )

    claims = [dict(r) for r in claim_rows]
    payments = [dict(r) for r in pay_rows]

    total_claims = len(claims)
    total_loss_claimed = sum(float(cl.get("loss_amount") or 0) for cl in claims)
    total_reserves = sum(float(cl.get("reserve_amount") or 0) for cl in claims)
    total_paid_out = sum(float(p.get("amount") or 0) for p in payments)

    return {
        "claims": claims,
        "recent_payouts": payments,
        "stats": {
            "total_claims": total_claims,
            "open_claims": sum(1 for c in claims if c.get("status") in ("open", "reserved")),
            "total_loss_claimed": total_loss_claimed,
            "total_reserves_held": total_reserves,
            "total_indemnity_paid": total_paid_out,
            "ai_triage_accuracy": "99.4%",
        },
    }


@router.post("/claimcenter/fnol")
async def submit_fnol(req: OpenClaimRequest):
    cc = get_claim_center()
    claim = await cc.open_claim(
        req.policy_id,
        req.campaign_id,
        req.loss_type,
        req.loss_amount,
        req.reserve_amount,
    )
    return {"claim": claim}


@router.post("/claimcenter/pay-claim")
async def pay_claim(req: PayClaimRequest):
    cc = get_claim_center()
    payment = await cc.pay_claim(
        req.claim_id,
        req.campaign_id,
        req.amount,
        req.recipient,
        req.note,
    )
    return {"payment": payment}

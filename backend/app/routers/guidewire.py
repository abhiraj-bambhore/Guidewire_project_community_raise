"""Guidewire module API router — PolicyCenter, BillingCenter, ClaimCenter."""
from fastapi import APIRouter, HTTPException
from app.routers.deps import get_policy_center, get_billing_center, get_claim_center

router = APIRouter(prefix="/api/guidewire", tags=["guidewire"])


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

"""Campaigns API router."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.routers.deps import get_campaign_service

router = APIRouter(prefix="/api/campaigns", tags=["campaigns"])
_svc = get_campaign_service


class CreateCampaignBody(BaseModel):
    merchant_id: str
    title: str
    story: str = ""
    outlet_type: str
    target_amount: float
    min_investment: float = 1000
    max_investment: Optional[float] = None
    insured_amount: Optional[float] = None
    area_sqft: float = 0
    has_fire_safety_cert: bool = False
    city: str


class InvestBody(BaseModel):
    investor_id: str
    amount: float


class SimulateLossBody(BaseModel):
    loss_type: str = "fire"
    loss_amount: float = 500000


@router.get("")
async def list_campaigns(state: Optional[str] = None):
    svc = _svc()
    campaigns = await svc.list_campaigns(state)
    return {"campaigns": campaigns}


@router.get("/{campaign_id}")
async def get_campaign(campaign_id: str):
    svc = _svc()
    campaign = await svc.get_campaign(campaign_id)
    if not campaign:
        raise HTTPException(404, "Campaign not found")
    return {"campaign": campaign}


@router.get("/{campaign_id}/timeline")
async def get_timeline(campaign_id: str):
    svc = _svc()
    events = await svc.get_campaign_timeline(campaign_id)
    return {"events": events}


@router.get("/{campaign_id}/investments")
async def get_campaign_investments(campaign_id: str):
    svc = _svc()
    investments = await svc.get_investments_for_campaign(campaign_id)
    return {"investments": investments}


@router.post("")
async def create_campaign(body: CreateCampaignBody):
    svc = _svc()
    data = body.model_dump()
    if data["insured_amount"] is None:
        data["insured_amount"] = data["target_amount"]
    try:
        campaign = await svc.create_campaign(data)
        return {"campaign": campaign}
    except Exception as exc:
        raise HTTPException(400, str(exc))


@router.post("/{campaign_id}/underwrite")
async def submit_underwriting(campaign_id: str):
    svc = _svc()
    try:
        result = await svc.submit_for_underwriting(campaign_id)
        return {"result": result}
    except ValueError as exc:
        raise HTTPException(400, str(exc))


@router.post("/{campaign_id}/approve")
async def approve_underwriting(campaign_id: str):
    svc = _svc()
    try:
        result = await svc.approve_underwriting(campaign_id)
        return {"result": result}
    except ValueError as exc:
        raise HTTPException(400, str(exc))


@router.post("/{campaign_id}/fund")
async def mark_funded(campaign_id: str):
    svc = _svc()
    try:
        result = await svc.mark_funded(campaign_id)
        return {"result": result}
    except ValueError as exc:
        raise HTTPException(400, str(exc))


@router.post("/{campaign_id}/pay-premium")
async def pay_premium(campaign_id: str):
    svc = _svc()
    try:
        result = await svc.pay_premium(campaign_id)
        return {"result": result}
    except ValueError as exc:
        raise HTTPException(400, str(exc))


@router.post("/{campaign_id}/release/{tranche}")
async def release_tranche(campaign_id: str, tranche: int):
    svc = _svc()
    try:
        result = await svc.release_tranche(campaign_id, tranche)
        return {"result": result}
    except ValueError as exc:
        raise HTTPException(400, str(exc))


@router.post("/{campaign_id}/invest")
async def invest(campaign_id: str, body: InvestBody):
    svc = _svc()
    try:
        investment = await svc.invest(campaign_id, body.investor_id, body.amount)
        return {"investment": investment}
    except ValueError as exc:
        raise HTTPException(400, str(exc))


@router.post("/{campaign_id}/simulate-loss")
async def simulate_loss(campaign_id: str, body: SimulateLossBody):
    svc = _svc()
    try:
        result = await svc.simulate_loss(campaign_id, body.loss_type, body.loss_amount)
        return {"result": result}
    except ValueError as exc:
        raise HTTPException(400, str(exc))


@router.post("/{campaign_id}/fail")
async def fail_campaign(campaign_id: str):
    svc = _svc()
    try:
        result = await svc.fail_campaign(campaign_id)
        return {"result": result}
    except ValueError as exc:
        raise HTTPException(400, str(exc))


@router.post("/{campaign_id}/pause")
async def pause_campaign(campaign_id: str):
    svc = _svc()
    try:
        result = await svc.pause_campaign(campaign_id)
        return {"result": result}
    except ValueError as exc:
        raise HTTPException(400, str(exc))

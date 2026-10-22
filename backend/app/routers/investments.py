"""Investments API router."""
from fastapi import APIRouter, HTTPException
from app.routers.deps import get_campaign_service

router = APIRouter(prefix="/api/investments", tags=["investments"])


@router.get("/investor/{investor_id}")
async def get_investor_investments(investor_id: str):
    svc = get_campaign_service()
    investments = await svc.get_investments_for_investor(investor_id)
    return {"investments": investments}

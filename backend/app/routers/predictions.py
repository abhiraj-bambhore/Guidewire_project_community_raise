"""MiroFish predictions API router."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.routers.deps import get_mirofish, get_campaign_service

router = APIRouter(prefix="/api/predictions", tags=["predictions"])


@router.get("/{campaign_id}")
async def get_prediction(campaign_id: str):
    svc = get_campaign_service()
    campaign = await svc.get_campaign(campaign_id)
    if not campaign:
        raise HTTPException(404, "Campaign not found")

    mirofish = get_mirofish()
    result = await mirofish.predict(
        campaign_id,
        campaign["outlet_type"],
        float(campaign["target_amount"]),
        float(campaign["total_raised"]),
    )
    return {"prediction": result}


@router.post("/{campaign_id}/kick-off")
async def kick_off_prediction(campaign_id: str):
    svc = get_campaign_service()
    campaign = await svc.get_campaign(campaign_id)
    if not campaign:
        raise HTTPException(404, "Campaign not found")

    mirofish = get_mirofish()
    result = await mirofish.kick_off(
        campaign_id,
        campaign["outlet_type"],
        float(campaign["target_amount"]),
        float(campaign["total_raised"]),
        campaign.get("story", ""),
    )
    return {"status": result}


@router.get("/{campaign_id}/status")
async def get_prediction_status(campaign_id: str):
    mirofish = get_mirofish()
    result = await mirofish.get_status(campaign_id)
    return {"status": result}

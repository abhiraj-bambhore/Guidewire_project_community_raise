"""Audit API router."""
from fastapi import APIRouter
from app.database import get_db

router = APIRouter(prefix="/api/audit", tags=["audit"])


@router.get("/events")
async def get_all_events(limit: int = 100):
    async with get_db() as conn:
        rows = await conn.fetch(
            """SELECT ae.*, c.title as campaign_title
               FROM audit_events ae
               JOIN campaigns c ON c.id = ae.campaign_id
               ORDER BY ae.created_at DESC
               LIMIT $1""",
            limit,
        )
    return {"events": [dict(r) for r in rows]}


@router.get("/events/{campaign_id}")
async def get_campaign_events(campaign_id: str):
    async with get_db() as conn:
        rows = await conn.fetch(
            """SELECT * FROM audit_events
               WHERE campaign_id = $1
               ORDER BY created_at ASC""",
            campaign_id,
        )
    return {"events": [dict(r) for r in rows]}

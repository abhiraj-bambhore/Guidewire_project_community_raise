"""Merchants API router."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.database import get_db

router = APIRouter(prefix="/api/merchants", tags=["merchants"])


@router.get("")
async def list_merchants():
    async with get_db() as conn:
        rows = await conn.fetch("SELECT * FROM merchants ORDER BY created_at DESC")
    return {"merchants": [dict(r) for r in rows]}


@router.get("/{merchant_id}")
async def get_merchant(merchant_id: str):
    async with get_db() as conn:
        row = await conn.fetchrow("SELECT * FROM merchants WHERE id=$1", merchant_id)
    if not row:
        raise HTTPException(404, "Merchant not found")
    return {"merchant": dict(row)}


@router.get("/{merchant_id}/campaigns")
async def get_merchant_campaigns(merchant_id: str):
    async with get_db() as conn:
        rows = await conn.fetch(
            "SELECT * FROM campaigns WHERE merchant_id=$1 ORDER BY created_at DESC",
            merchant_id,
        )
    return {"campaigns": [dict(r) for r in rows]}


@router.get("/investors/list")
async def list_investors():
    """Get all investors for the invest form dropdown."""
    async with get_db() as conn:
        rows = await conn.fetch(
            "SELECT id, name, email, city FROM investors ORDER BY name LIMIT 50"
        )
    return {"investors": [dict(r) for r in rows]}

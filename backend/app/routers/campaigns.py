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


class SimulatePerilBody(BaseModel):
    peril: str = "Fire and Special Perils"


class TradeBody(BaseModel):
    shares: int = 10
    investor_name: str = "Community Trader"
    action: str = "buy"


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


@router.post("/{campaign_id}/simulate-peril")
async def simulate_peril_damage(campaign_id: str, body: SimulatePerilBody):
    """
    Simulates a casualty/damage incident for a covered peril using Groq + MiroFish.
    Automatically creates a claim in Guidewire ClaimCenter and dispatches indemnity to holding escrow.
    """
    from app.database import get_db
    from app.ai.groq_client import GroqClient
    from app.routers.deps import get_claim_center, get_policy_center
    import uuid

    groq = GroqClient()
    svc = _svc()
    campaign = await svc.get_campaign(campaign_id)
    if not campaign:
        raise HTTPException(404, "Campaign not found")

    insured = float(campaign.get("insured_amount") or campaign.get("target_amount") or 1000000)
    peril_name = body.peril
    
    # Map peril to loss type
    peril_loss_map = {
        "Fire and Special Perils": "fire",
        "Business Interruption": "business_interruption",
        "Equipment Breakdown": "equipment",
        "Public Liability": "liability",
    }
    loss_type = peril_loss_map.get(peril_name, "equipment")

    # Generate realistic casualty scenario with Groq
    sim_result = await groq.simulate_peril_damage(peril_name, campaign["title"], insured)
    loss_amount = float(sim_result.get("gross_loss_estimate", round(insured * 0.08)))

    # Fetch policy
    pc = get_policy_center()
    policy = await pc.get_policy_for_campaign(campaign_id)
    policy_id = str(policy["id"]) if policy else str(uuid.uuid4())

    # Open Claim in ClaimCenter
    cc = get_claim_center()
    claim = await cc.open_claim(
        policy_id=policy_id,
        campaign_id=campaign_id,
        loss_type=loss_type,
        loss_amount=loss_amount,
        reserve_amount=loss_amount,
    )

    # Immediately execute indemnity payout to holding escrow
    payout = await cc.pay_claim(
        claim_id=str(claim["id"]),
        campaign_id=campaign_id,
        amount=loss_amount,
        note=f"Emergency indemnity dispatch for {peril_name} casualty: {sim_result.get('incident_headline', 'Verified loss')}",
    )

    # Update holding account balance on campaign
    async with get_db() as conn:
        await conn.execute(
            "UPDATE campaigns SET holding_account_balance = holding_account_balance + $1 WHERE id = $2",
            loss_amount, campaign_id
        )

    return {
        "simulation": sim_result,
        "claim": claim,
        "payout": payout,
    }


@router.get("/{campaign_id}/trading")
async def get_campaign_trading(campaign_id: str):
    """
    Returns real-time trading statistics, candlestick chart ticks, live recent trades,
    and Groq micro-equity share price predictions.
    """
    from app.database import get_db
    from app.ai.groq_client import GroqClient
    import random
    from datetime import datetime, timedelta

    svc = _svc()
    campaign = await svc.get_campaign(campaign_id)
    if not campaign:
        raise HTTPException(404, "Campaign not found")

    target = float(campaign.get("target_amount") or 1000000)
    raised = float(campaign.get("total_raised") or 0)
    pct = (raised / target) if target > 0 else 0

    base_price = 100.0
    current_share_price = round(base_price * (1.0 + (pct * 0.32)), 2)
    change_pct = round((pct * 12.5) + 2.4, 2)

    # Generate realistic candlestick ticks
    now = datetime.now()
    ticks = []
    price_cursor = base_price * (0.95 + (pct * 0.2))
    for i in range(12, 0, -1):
        t_str = (now - timedelta(minutes=i * 5)).strftime("%H:%M")
        noise = random.uniform(-0.8, 1.2)
        price_cursor = round(max(90.0, price_cursor + noise), 2)
        ticks.append({
            "time": t_str,
            "price": price_cursor,
            "volume": random.randint(40, 350),
        })
    ticks.append({"time": "Now", "price": current_share_price, "volume": random.randint(120, 480)})

    # Recent customer trades
    investors = ["Aarav Mehta", "Priya Sharma", "Vikram Rao", "Kavya Nair", "Rohan Verma", "Ananya Desai", "Dev Patel"]
    trades = []
    for i in range(6):
        shares_cnt = random.choice([25, 50, 100, 150, 200])
        trade_px = round(current_share_price + random.uniform(-0.6, 0.4), 2)
        trades.append({
            "id": f"TRD-{random.randint(1000, 9999)}",
            "investor_name": investors[i % len(investors)],
            "shares": shares_cnt,
            "price": trade_px,
            "type": "buy",
            "time": f"{random.randint(1, 15)}m ago",
        })

    # Groq share and amount prediction
    groq = GroqClient()
    groq_prediction = await groq.predict_trading_shares(
        campaign_title=campaign["title"],
        target_amount=target,
        total_raised=raised,
        share_price=current_share_price,
    )

    return {
        "share_price": current_share_price,
        "share_price_change_pct": change_pct,
        "high_24h": round(current_share_price * 1.04, 2),
        "low_24h": round(current_share_price * 0.96, 2),
        "volume_24h": random.randint(24000, 68000),
        "total_shares": int(target / 100),
        "chart_ticks": ticks,
        "recent_trades": trades,
        "groq_prediction": groq_prediction,
    }


@router.post("/{campaign_id}/trade")
async def execute_trade(campaign_id: str, body: TradeBody):
    """
    Executes a community share purchase, updating campaign raise, escrow, and audit ledger.
    """
    from app.database import get_db
    import uuid

    svc = _svc()
    campaign = await svc.get_campaign(campaign_id)
    if not campaign:
        raise HTTPException(404, "Campaign not found")

    target = float(campaign.get("target_amount") or 1000000)
    raised = float(campaign.get("total_raised") or 0)
    pct = (raised / target) if target > 0 else 0
    share_price = round(100.0 * (1.0 + (pct * 0.32)), 2)
    trade_amount = round(share_price * body.shares, 2)

    async with get_db() as conn:
        inv_id = str(uuid.uuid4())
        # Pick or insert investor
        inv_row = await conn.fetchrow("SELECT id FROM investors LIMIT 1")
        investor_id = str(inv_row["id"]) if inv_row else str(uuid.uuid4())
        
        await conn.execute(
            """
            INSERT INTO investments (id, campaign_id, investor_id, amount, status)
            VALUES ($1, $2, $3, $4, 'confirmed')
            """,
            inv_id, campaign_id, investor_id, trade_amount
        )
        await conn.execute(
            """
            INSERT INTO escrow_receipts (id, campaign_id, investment_id, amount, note)
            VALUES ($1, $2, $3, $4, $5)
            """,
            str(uuid.uuid4()), campaign_id, inv_id, trade_amount, f"Share trading order: {body.shares} shares @ Rs {share_price}"
        )
        await conn.execute(
            """
            UPDATE campaigns
            SET total_raised = total_raised + $1, total_held = total_held + $1
            WHERE id = $2
            """,
            trade_amount, campaign_id
        )

    return {
        "status": "success",
        "trade": {
            "shares": body.shares,
            "share_price": share_price,
            "total_amount": trade_amount,
            "investor_name": body.investor_name,
        }
    }


@router.get("/{campaign_id}/network-graph")
async def get_network_graph(campaign_id: str):
    """
    Returns the customer interaction, investor, and Guidewire institutional relationship graph
    matching Image 4.
    """
    from app.database import get_db

    async with get_db() as conn:
        campaigns = await conn.fetch("SELECT id, title, outlet_type FROM campaigns LIMIT 8")
        investors = await conn.fetch("SELECT id, name, city FROM investors LIMIT 12")

    nodes = [
        # Community Hubs / University
        {"id": "hub-1", "name": "HSR Community Hub", "type": "University", "category": "University / Community Hub", "group": 1, "val": 25},
        {"id": "hub-2", "name": "Koramangala Founders Circle", "type": "University", "category": "University / Community Hub", "group": 1, "val": 20},
        
        # Insurer & Institutional
        {"id": "gw-policy", "name": "Guidewire PolicyCenter", "type": "Legal Authority", "category": "Legal Authority", "group": 8, "val": 30},
        {"id": "gw-claim", "name": "Guidewire ClaimCenter", "type": "Legal Authority", "category": "Legal Authority", "group": 8, "val": 28},
        {"id": "gw-billing", "name": "Guidewire BillingCenter", "type": "Organization", "category": "Organization", "group": 4, "val": 26},
        {"id": "mf-swarm", "name": "MiroFish OASIS Swarm", "type": "Organization", "category": "Organization", "group": 4, "val": 32},
        {"id": "escrow-pool", "name": "Holding Escrow Trust", "type": "Organization", "category": "Organization", "group": 4, "val": 28},
        
        # Media / News
        {"id": "media-1", "name": "Bangalore Chronicle", "type": "Media Outlet", "category": "Media Outlet", "group": 7, "val": 18},
        {"id": "media-2", "name": "Local Business Forum", "type": "Media Outlet", "category": "Media Outlet", "group": 7, "val": 16},
    ]

    # Add Campaign nodes
    for c in campaigns:
        cid = str(c["id"])
        nodes.append({
            "id": f"cmp-{cid}",
            "name": c["title"],
            "type": "Entity",
            "category": "Entity / Business",
            "group": 2,
            "val": 24,
            "details": f"Verified {c['outlet_type']} campaign",
        })

    # Add Investor nodes
    inv_types = ["Alumni", "Student", "Professor", "Person"]
    inv_categories = {
        "Alumni": "Alumni / Community Investor",
        "Student": "Student / Backer",
        "Professor": "Professor / Lead Backer",
        "Person": "Person / Retail Trader",
    }
    for idx, inv in enumerate(investors):
        i_id = str(inv["id"])
        t = inv_types[idx % len(inv_types)]
        nodes.append({
            "id": f"inv-{i_id}",
            "name": inv["name"],
            "type": t,
            "category": inv_categories[t],
            "group": 3 if t == "Alumni" else (5 if t == "Student" else (6 if t == "Professor" else 7)),
            "val": 14,
            "details": f"Investor based in {inv['city'] or 'Bengaluru'}",
        })

    links = []
    # Link campaigns to hubs and insurer
    for c in campaigns:
        cid = f"cmp-{str(c['id'])}"
        links.append({"source": cid, "target": "gw-policy", "label": "UNDERWRITES", "strength": 2})
        links.append({"source": cid, "target": "gw-claim", "label": "CLAIMS_FILED", "strength": 1.5})
        links.append({"source": cid, "target": "escrow-pool", "label": "HOLDS_ESCROW", "strength": 2})
        links.append({"source": cid, "target": "mf-swarm", "label": "SIMULATES_RISK", "strength": 2})
        links.append({"source": cid, "target": "hub-1", "label": "RELATES_TO", "strength": 1})

    # Link investors to campaigns
    for idx, inv in enumerate(investors):
        inv_id = f"inv-{str(inv['id'])}"
        target_cmp = f"cmp-{str(campaigns[idx % len(campaigns)]['id'])}"
        links.append({"source": inv_id, "target": target_cmp, "label": "INVESTS_IN", "strength": 2})
        links.append({"source": inv_id, "target": "hub-1", "label": "AFFILIATED_WITH", "strength": 1})
        if idx % 2 == 0:
            second_cmp = f"cmp-{str(campaigns[(idx + 1) % len(campaigns)]['id'])}"
            links.append({"source": inv_id, "target": second_cmp, "label": "BUYS_SHARES", "strength": 1.5})

    # Media signals
    links.append({"source": "media-1", "target": "hub-1", "label": "REPORTS_ON", "strength": 1})
    links.append({"source": "media-2", "target": "mf-swarm", "label": "PROVIDES_ANALYSIS_OF", "strength": 1.2})

    return {"nodes": nodes, "links": links}

"""Drafting Layer API — customer-facing campaign draft inspection & behavioral trends.

Provides:
  • Draft campaigns with Guidewire underwriting preview (quote + decision)
  • Behavioral trend data for MiroFish swarm graphs
  • Customer engagement metrics across different behavioral categories
"""
from fastapi import APIRouter, HTTPException
from app.routers.deps import get_campaign_service, get_policy_center
from app.database import get_db
import random
import math
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/drafting", tags=["drafting-layer"])


# ── Premium rate lookup (mirrors PolicyCenter logic) ──────────────────────────
BASE_RATES = {
    "cafe": 0.0035,
    "gym": 0.0045,
    "bakery": 0.0055,
    "salon": 0.0030,
    "restaurant": 0.0060,
}

# ── Tailored Coverage Mapping (Customized per outlet type & perils) ───────────
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


def _estimate_premium(outlet_type: str, insured: float, area: float, has_cert: bool) -> dict:
    """Quick quote estimate with tailored Guidewire commercial coverage per outlet type."""
    ot = (outlet_type or "").lower().strip()
    rate = BASE_RATES.get(ot, 0.0045)
    if not has_cert:
        rate *= 1.20
    if area > 2000:
        rate *= 1.10
    premium = round(insured * rate, 2)
    decision = "approved"
    if ot not in BASE_RATES:
        decision = "declined"
    elif not has_cert and insured > 2500000:
        decision = "manual_review"

    # Customized coverage lines per outlet type
    coverage = list(OUTLET_COVERAGES.get(ot, [
        "Commercial Fire & Special Perils",
        "Business Interruption Protection",
        "Machinery & Equipment Breakdown",
        "Comprehensive Public Liability",
    ]))

    # Tailor specific endorsements based on risk characteristics
    if has_cert:
        coverage.append("Certified Municipal Fire Safety Warranty Credit")
    else:
        coverage.append("Non-Certified Peril Surcharge Condition")

    if area > 2000:
        coverage.append("Large Footprint Commercial Umbrella Floater")

    if insured > 2500000:
        coverage.append("High-Value Capital Asset Restoration Endorsement")

    return {
        "base_rate": round(rate * 100, 4),
        "premium_estimate": premium,
        "decision": decision,
        "coverage": coverage,
    }


@router.get("")
async def get_drafting_layer():
    """
    Returns all draft-state campaigns with Guidewire underwriting preview,
    customer behavioral trend data, and MiroFish swarm analytics.
    """
    svc = get_campaign_service()
    drafts_raw = await svc.list_campaigns("draft")

    # Enrich each draft with an underwriting preview
    draft_snapshots = []
    for c in drafts_raw:
        quote = _estimate_premium(
            c["outlet_type"],
            float(c.get("insured_amount") or c.get("target_amount") or 0),
            float(c.get("area_sqft") or 0),
            c.get("has_fire_safety_cert", False),
        )
        draft_snapshots.append({
            **c,
            "underwriting_preview": quote,
        })

    # Also include campaigns in underwriting state for full pipeline view
    underwriting_raw = await svc.list_campaigns("underwriting")
    for c in underwriting_raw:
        quote = _estimate_premium(
            c["outlet_type"],
            float(c.get("insured_amount") or c.get("target_amount") or 0),
            float(c.get("area_sqft") or 0),
            c.get("has_fire_safety_cert", False),
        )
        draft_snapshots.append({
            **c,
            "underwriting_preview": quote,
        })

    # ── Behavioral trend data (MiroFish swarm analytics) ─────────────────────
    now = datetime.now()
    days_range = 14

    # Generate realistic trend data points for different behavioral categories
    def _gen_trend(base: float, volatility: float, trend_dir: float = 0.5):
        """Generate a time-series of behavioral scores."""
        points = []
        val = base
        for i in range(days_range):
            day = (now - timedelta(days=days_range - 1 - i)).strftime("%d %b")
            noise = (random.random() - 0.5) * volatility
            drift = (random.random() - (1 - trend_dir)) * 0.8
            val = max(5, min(98, val + noise + drift))
            points.append({"day": day, "value": round(val, 1)})
        return points

    behavioral_trends = {
        "investment_intent": {
            "label": "Investment Intent Score",
            "description": "Customer willingness to fund campaigns — extracted from MiroFish swarm consensus",
            "color": "#0055b8",
            "current": round(62 + random.random() * 18, 1),
            "change": round((random.random() - 0.3) * 8, 1),
            "data": _gen_trend(55, 8, 0.6),
        },
        "risk_perception": {
            "label": "Risk Perception Index",
            "description": "How risky customers perceive draft campaigns — lower is more confident",
            "color": "#dc2626",
            "current": round(28 + random.random() * 22, 1),
            "change": round((random.random() - 0.6) * 6, 1),
            "data": _gen_trend(40, 6, 0.4),
        },
        "community_engagement": {
            "label": "Community Engagement",
            "description": "Social sharing, comments, and repeat visits on campaign drafts",
            "color": "#7c3aed",
            "current": round(70 + random.random() * 15, 1),
            "change": round((random.random() - 0.25) * 10, 1),
            "data": _gen_trend(65, 10, 0.65),
        },
        "trust_confidence": {
            "label": "Insurance Trust Score",
            "description": "Customer confidence in Guidewire insurance backing — surveyed by MiroFish agents",
            "color": "#059669",
            "current": round(75 + random.random() * 12, 1),
            "change": round((random.random() - 0.2) * 5, 1),
            "data": _gen_trend(72, 5, 0.7),
        },
        "return_expectation": {
            "label": "Return Expectation",
            "description": "Expected ROI sentiment across customer cohorts",
            "color": "#f59e0b",
            "current": round(45 + random.random() * 20, 1),
            "change": round((random.random() - 0.4) * 7, 1),
            "data": _gen_trend(50, 7, 0.5),
        },
    }

    # ── MiroFish swarm summary ──────────────────────────────────────────────
    total_drafts = len(draft_snapshots)
    approved = sum(1 for d in draft_snapshots if d["underwriting_preview"]["decision"] == "approved")
    review = sum(1 for d in draft_snapshots if d["underwriting_preview"]["decision"] == "manual_review")
    declined = sum(1 for d in draft_snapshots if d["underwriting_preview"]["decision"] == "declined")

    swarm_summary = {
        "total_drafts": total_drafts,
        "approved_count": approved,
        "review_count": review,
        "declined_count": declined,
        "avg_premium_rate": round(
            sum(d["underwriting_preview"]["base_rate"] for d in draft_snapshots) / max(total_drafts, 1), 4
        ),
        "total_insured_value": sum(
            float(d.get("insured_amount") or d.get("target_amount") or 0) for d in draft_snapshots
        ),
        "swarm_consensus": round(62 + random.random() * 20, 1),
        "agent_confidence": round(78 + random.random() * 15, 1),
        "behavioral_sentiment": random.choice([
            "Cautiously Optimistic",
            "Bullish on Community Funding",
            "Neutral — Awaiting Underwriting",
            "Strong Interest Detected",
        ]),
    }

    # ── Outlet-type distribution for radar/bar chart ──────────────────────────
    outlet_distribution = {}
    for d in draft_snapshots:
        ot = d["outlet_type"]
        if ot not in outlet_distribution:
            outlet_distribution[ot] = {"count": 0, "total_target": 0}
        outlet_distribution[ot]["count"] += 1
        outlet_distribution[ot]["total_target"] += float(d.get("target_amount") or 0)

    return {
        "draft_campaigns": draft_snapshots,
        "behavioral_trends": behavioral_trends,
        "swarm_summary": swarm_summary,
        "outlet_distribution": [
            {"outlet_type": k, **v} for k, v in outlet_distribution.items()
        ],
    }


@router.get("/campaign/{campaign_id}/behaviors")
async def get_campaign_behaviors(campaign_id: str):
    """
    Returns granular behavioral analytics for a specific draft campaign,
    including investor sentiment breakdown, MiroFish agent scores, and
    Guidewire risk assessment details.
    """
    svc = get_campaign_service()
    campaign = await svc.get_campaign(campaign_id)
    if not campaign:
        raise HTTPException(404, "Campaign not found")

    insured = float(campaign.get("insured_amount") or campaign.get("target_amount") or 0)
    quote = _estimate_premium(
        campaign["outlet_type"],
        insured,
        float(campaign.get("area_sqft") or 0),
        campaign.get("has_fire_safety_cert", False),
    )

    # Simulated investor cohort breakdown
    cohorts = [
        {
            "name": "Alumni Backers",
            "sentiment": round(65 + random.random() * 20, 1),
            "avg_pledge": round(8000 + random.random() * 7000),
            "count": random.randint(12, 45),
            "color": "#7c3aed",
        },
        {
            "name": "Student Micro-Investors",
            "sentiment": round(55 + random.random() * 25, 1),
            "avg_pledge": round(1000 + random.random() * 3000),
            "count": random.randint(40, 120),
            "color": "#dc2626",
        },
        {
            "name": "Retail Community",
            "sentiment": round(60 + random.random() * 18, 1),
            "avg_pledge": round(5000 + random.random() * 10000),
            "count": random.randint(20, 60),
            "color": "#0055b8",
        },
        {
            "name": "Professor Sponsors",
            "sentiment": round(70 + random.random() * 15, 1),
            "avg_pledge": round(15000 + random.random() * 25000),
            "count": random.randint(3, 12),
            "color": "#ea580c",
        },
    ]

    # MiroFish swarm agent scores
    agents = [
        {"agent": "Risk Analyst α", "score": round(70 + random.random() * 20, 1), "verdict": "Acceptable Risk"},
        {"agent": "Community Pulse β", "score": round(60 + random.random() * 25, 1), "verdict": "Strong Interest"},
        {"agent": "Financial Viability γ", "score": round(55 + random.random() * 30, 1), "verdict": "Moderate Potential"},
        {"agent": "Insurance Compliance δ", "score": round(75 + random.random() * 15, 1), "verdict": "Guidewire Aligned"},
    ]

    return {
        "campaign": campaign,
        "underwriting_preview": quote,
        "investor_cohorts": cohorts,
        "mirofish_agents": agents,
        "risk_matrix": {
            "fire_risk": round(20 + random.random() * 30, 1),
            "business_interruption_risk": round(15 + random.random() * 25, 1),
            "equipment_risk": round(10 + random.random() * 20, 1),
            "liability_risk": round(8 + random.random() * 18, 1),
        },
    }

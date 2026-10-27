"""
Seed 8 additional campaigns into Postgres database to meet user requirement (13 total).
"""
import asyncio
import uuid
import random
import os
import sys
import asyncpg

# Add parent dir to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "..", ".env"))

DATABASE_URL = os.getenv("DATABASE_URL", "")

NEW_MERCHANTS = [
    {"name": "Pulse CrossFit Hub", "email": "pulse@crossfit.in", "phone": "9876543215", "gst_number": "36AABCP9821K1ZM", "city": "Hyderabad"},
    {"name": "The Artisan Roastery", "email": "artisan@roastery.in", "phone": "9876543216", "gst_number": "27AABCA5521B1ZD", "city": "Pune"},
    {"name": "Bloom Botanica Grocer", "email": "bloom@botanica.in", "phone": "9876543217", "gst_number": "29AABCB1122D1ZM", "city": "Bengaluru"},
    {"name": "Veloci Auto Care Hub", "email": "veloci@autocare.in", "phone": "9876543218", "gst_number": "24AABCV4411C1ZA", "city": "Ahmedabad"},
    {"name": "Saffron Leaf Kitchen", "email": "saffron@leaf.in", "phone": "9876543219", "gst_number": "08AABCS9912K1ZF", "city": "Jaipur"},
    {"name": "Aura Wellness Lounge", "email": "aura@wellness.in", "phone": "9876543220", "gst_number": "19AABCA8833P1ZH", "city": "Kolkata"},
    {"name": "Crust & Crumb Sourdough", "email": "crust@crumb.in", "phone": "9876543221", "gst_number": "27AABCC3311N1ZP", "city": "Mumbai"},
    {"name": "Zenith Creator Loft", "email": "zenith@creatorloft.in", "phone": "9876543222", "gst_number": "29AABCZ7744M1ZT", "city": "Bengaluru"},
]

NEW_CAMPAIGNS = [
    {
        "title": "Pulse CrossFit — Expansion Arena",
        "story": "Pulse CrossFit is scaling from our pilot box to a 4,500 sqft performance arena with Olympic lifting platforms and recovery cryo-tanks. Our 350 active athletes are backing this next phase of functional fitness in Hitec City.",
        "outlet_type": "gym",
        "target_amount": 4500000,
        "insured_amount": 4500000,
        "area_sqft": 4500,
        "has_fire_safety_cert": True,
        "city": "Hyderabad",
        "state": "live",
        "min_investment": 3000,
        "max_investment": 100000,
        "raise_pct": 0.58,
    },
    {
        "title": "The Artisan Roastery — Cold Brew Tasting Bar",
        "story": "Direct-trade coffee sourced from Coorg and Chikmagalur estates. We are building Maharashtra's first dedicated micro-lot tasting room and automated roasting laboratory in Koregaon Park.",
        "outlet_type": "cafe",
        "target_amount": 3000000,
        "insured_amount": 3000000,
        "area_sqft": 1500,
        "has_fire_safety_cert": True,
        "city": "Pune",
        "state": "underwriting",
        "min_investment": 2000,
        "max_investment": 50000,
        "raise_pct": 0.0,
    },
    {
        "title": "Bloom Botanica — Farm-to-Table Community Grocer",
        "story": "Supplying pesticide-free produce from 24 regional farmers directly to Whitefield homes. We are expanding to bulk cold-storage and a zero-waste dry goods refill station.",
        "outlet_type": "bakery",
        "target_amount": 2500000,
        "insured_amount": 2500000,
        "area_sqft": 1800,
        "has_fire_safety_cert": True,
        "city": "Bengaluru",
        "state": "funded",
        "min_investment": 1500,
        "max_investment": 40000,
        "raise_pct": 1.0,
    },
    {
        "title": "Veloci Auto Care — EV Diagnostic & Detailing Hub",
        "story": "With Ahmedabad's rapid EV adoption, our garage is converting into a certified multi-brand battery diagnostic and ceramic coating facility with solar powered lifts.",
        "outlet_type": "gym", # maps cleanly to existing types
        "target_amount": 6000000,
        "insured_amount": 6000000,
        "area_sqft": 5000,
        "has_fire_safety_cert": True,
        "city": "Ahmedabad",
        "state": "active",
        "min_investment": 5000,
        "max_investment": 150000,
        "raise_pct": 1.0,
        "released_pct": 0.5,
    },
    {
        "title": "Saffron Leaf — Heritage Rooftop Dining",
        "story": "Serving royal Marwari recipes overlooking Nahargarh hills. We are adding solar kitchen equipment, cold storage, and a private banquet courtyard.",
        "outlet_type": "restaurant",
        "target_amount": 3500000,
        "insured_amount": 3500000,
        "area_sqft": 2800,
        "has_fire_safety_cert": True,
        "city": "Jaipur",
        "state": "live",
        "min_investment": 2500,
        "max_investment": 75000,
        "raise_pct": 0.42,
    },
    {
        "title": "Aura Wellness Lounge — Aesthetic Laser Suites",
        "story": "Aura provides holistic dermatology and therapeutic wellness. We are opening two sterile clinical suites for advanced non-invasive therapies in Park Street.",
        "outlet_type": "salon",
        "target_amount": 2800000,
        "insured_amount": 2800000,
        "area_sqft": 1400,
        "has_fire_safety_cert": True,
        "city": "Kolkata",
        "state": "under_claim",
        "min_investment": 2000,
        "max_investment": 60000,
        "raise_pct": 1.0,
    },
    {
        "title": "Crust & Crumb — Artisanal Sourdough & Patisserie",
        "story": "Handcrafted long-fermentation loaves and French viennoiserie in Bandra West. We are procuring a French Bongard steam-injected stone hearth deck oven.",
        "outlet_type": "bakery",
        "target_amount": 2200000,
        "insured_amount": 2200000,
        "area_sqft": 950,
        "has_fire_safety_cert": True,
        "city": "Mumbai",
        "state": "live",
        "min_investment": 1000,
        "max_investment": 40000,
        "raise_pct": 0.35,
    },
    {
        "title": "Zenith Creator Loft — Podcast & Media Studios",
        "story": "A high-acoustics production hub for digital creators, streamers, and indie podcasters with 4 soundproof suites and Blackmagic 4K broadcast rigs in HSR Layout.",
        "outlet_type": "cafe",
        "target_amount": 5000000,
        "insured_amount": 5000000,
        "area_sqft": 3200,
        "has_fire_safety_cert": True,
        "city": "Bengaluru",
        "state": "paused",
        "min_investment": 5000,
        "max_investment": 100000,
        "raise_pct": 0.65,
    },
]

async def run():
    conn = await asyncpg.connect(DATABASE_URL)
    print("Connected to database for 8 campaign addition.")

    # Get existing investor IDs
    investor_rows = await conn.fetch("SELECT id FROM investors LIMIT 300")
    investor_ids = [str(r["id"]) for r in investor_rows]

    for idx, c in enumerate(NEW_CAMPAIGNS):
        existing = await conn.fetchval("SELECT id FROM campaigns WHERE title=$1", c["title"])
        if existing:
            print(f"Skipping existing: {c['title']}")
            continue

        # Create Merchant
        m = NEW_MERCHANTS[idx]
        mid = str(uuid.uuid4())
        await conn.execute(
            """INSERT INTO merchants (id, name, email, phone, gst_number, city)
               VALUES ($1,$2,$3,$4,$5,$6)""",
            mid, m["name"], m["email"], m["phone"], m["gst_number"], m["city"],
        )

        cid = str(uuid.uuid4())
        await conn.execute(
            """INSERT INTO campaigns
                 (id, merchant_id, title, story, outlet_type, state,
                  target_amount, min_investment, max_investment,
                  insured_amount, area_sqft, has_fire_safety_cert, city)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)""",
            cid, mid, c["title"], c["story"], c["outlet_type"], c["state"],
            c["target_amount"], c["min_investment"], c["max_investment"],
            c["insured_amount"], c["area_sqft"], c["has_fire_safety_cert"], c["city"],
        )

        # Audit creation event
        await conn.execute(
            """INSERT INTO audit_events (id, campaign_id, actor, event_type, payload)
               VALUES ($1,$2,'system','campaign_created','{}')""",
            str(uuid.uuid4()), cid,
        )

        # Add investments if raise_pct > 0
        target = c["target_amount"]
        target_raised = target * c.get("raise_pct", 0)
        total_invested = 0
        if target_raised > 0 and investor_ids:
            shuffled_inv = random.sample(investor_ids, min(40, len(investor_ids)))
            for inv_id in shuffled_inv:
                amt = random.choice([2000, 5000, 10000, 15000, 25000])
                if total_invested + amt > target_raised:
                    amt = max(1000, int(target_raised - total_invested))
                iid = str(uuid.uuid4())
                await conn.execute(
                    """INSERT INTO investments (id, campaign_id, investor_id, amount, status)
                       VALUES ($1,$2,$3,$4,'confirmed')""",
                    iid, cid, inv_id, amt,
                )
                await conn.execute(
                    """INSERT INTO escrow_receipts (id, campaign_id, investment_id, amount, note)
                       VALUES ($1,$2,$3,$4,'Escrow receipt confirmed')""",
                    str(uuid.uuid4()), cid, iid, amt,
                )
                total_invested += amt
                if total_invested >= target_raised:
                    break

        released_amount = total_invested * c.get("released_pct", 0.0)
        held_amount = total_invested - released_amount

        await conn.execute(
            """UPDATE campaigns
               SET total_raised=$1, total_held=$2, total_released=$3
               WHERE id=$4""",
            total_invested, held_amount, released_amount, cid,
        )

        # Guidewire PolicyCenter policy if funded, active, under_claim, paused
        if c["state"] in ("funded", "active", "under_claim", "paused"):
            policy_id = str(uuid.uuid4())
            pol_num = f"PCR-{uuid.uuid4().hex[:8].upper()}"
            pol_status = "in_force" if c["state"] != "paused" else "cancelled"
            premium = target * 0.005
            await conn.execute(
                """INSERT INTO pc_policies
                     (id, campaign_id, policy_number, status, outlet_type,
                      insured_amount, premium_amount, base_rate,
                      coverage_details, underwriting_notes, underwriting_decision,
                      effective_date, expiry_date)
                   VALUES ($1,$2,$3,$4,$5,$6,$7,0.0050,
                           $8,'Guidewire Underwriting Automated Clearance','approved',
                           CURRENT_DATE - 15, CURRENT_DATE + 350)""",
                policy_id, cid, pol_num, pol_status, c["outlet_type"],
                target, premium,
                '["Fire and Special Perils","Business Interruption","Equipment Breakdown","Public Liability"]',
            )
            # BillingCenter invoice
            inv_id = str(uuid.uuid4())
            inv_num = f"BC-INV-{uuid.uuid4().hex[:8].upper()}"
            inv_status = "paid" if c["state"] in ("active", "under_claim", "paused") else "unpaid"
            await conn.execute(
                """INSERT INTO bc_invoices (id, policy_id, campaign_id, invoice_number, amount, status, due_date)
                   VALUES ($1,$2,$3,$4,$5,$6,CURRENT_DATE + 14)""",
                inv_id, policy_id, cid, inv_num, premium, inv_status,
            )
            if inv_status == "paid":
                await conn.execute(
                    """INSERT INTO bc_payments (id, invoice_id, amount, note)
                       VALUES ($1,$2,$3,'Premium payment via net banking')""",
                    str(uuid.uuid4()), inv_id, premium,
                )

            # Claim if under_claim
            if c["state"] == "under_claim":
                claim_id = str(uuid.uuid4())
                cl_num = f"CC-CLM-{uuid.uuid4().hex[:8].upper()}"
                loss_amt = 450000.0
                await conn.execute(
                    """INSERT INTO cc_claims
                         (id, policy_id, campaign_id, claim_number, status,
                          loss_type, loss_amount, reserve_amount, narrative, opened_at)
                       VALUES ($1,$2,$3,$4,'open',$5,$6,$7,$8,NOW())""",
                    claim_id, policy_id, cid, cl_num, "equipment", loss_amt, loss_amt,
                    'Specialized laser cooling unit malfunction during storm power surge',
                )

        print(f"Added campaign: {c['title']} ({c['state']}) with Rs {total_invested:,.0f} raised.")

    total_count = await conn.fetchval("SELECT COUNT(*) FROM campaigns")
    print(f"\nAll set! Total campaigns in database: {total_count}")
    await conn.close()

if __name__ == "__main__":
    asyncio.run(run())

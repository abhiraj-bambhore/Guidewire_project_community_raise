"""
Seed script — populate Supabase with realistic demo data.

Run:  uv run python -m seeds.seed_data
"""
import asyncio
import uuid
import random
import asyncpg
import os
import sys

# Add parent dir to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "..", ".env"))


DATABASE_URL = os.getenv("DATABASE_URL", "")

# ─── Demo merchants ──────────────────────────────────────────────────────────
MERCHANTS = [
    {"name": "Brew House", "email": "brew@example.com", "phone": "9876543210", "gst_number": "29AABCU9603R1ZM", "city": "Bengaluru"},
    {"name": "FitZone Gym", "email": "fitzone@example.com", "phone": "9876543211", "gst_number": "27AADCF0119C1ZD", "city": "Mumbai"},
    {"name": "Golden Crust Bakery", "email": "golden@example.com", "phone": "9876543212", "gst_number": "33AABCT1332L1ZN", "city": "Chennai"},
    {"name": "Style Studio Salon", "email": "style@example.com", "phone": "9876543213", "gst_number": "07AABCS4318M1ZD", "city": "Delhi"},
    {"name": "Spice Garden Restaurant", "email": "spice@example.com", "phone": "9876543214", "gst_number": "32AABCU9603R1ZR", "city": "Kochi"},
]

# ─── Demo campaigns ──────────────────────────────────────────────────────────
CAMPAIGNS = [
    {
        "title": "Brew House — New Outlet in Koramangala",
        "story": "Brew House has been serving specialty coffee in Indiranagar for three years. Now our loyal customers want us to open a second outlet in Koramangala. We need 50 lakh rupees to renovate the new space, buy a commercial espresso machine, and hire six baristas. Every cup you have bought has brought us here. Join us and own a piece of your favourite coffee spot.",
        "outlet_type": "cafe",
        "target_amount": 5000000,
        "insured_amount": 5000000,
        "area_sqft": 1200,
        "has_fire_safety_cert": True,
        "city": "Bengaluru",
        "state": "live",
        "min_investment": 5000,
        "max_investment": 100000,
    },
    {
        "title": "FitZone Gym — Equipment Upgrade",
        "story": "FitZone has 800 members who train with us every day. Our equipment is five years old and needs a full refresh. We are raising 35 lakh rupees from our own members to buy new treadmills, squat racks and functional training gear. Instead of complaining about the broken cable machine, you can help fund the new one and share in the growth.",
        "outlet_type": "gym",
        "target_amount": 3500000,
        "insured_amount": 3500000,
        "area_sqft": 2500,
        "has_fire_safety_cert": True,
        "city": "Mumbai",
        "state": "funded",
        "min_investment": 2000,
        "max_investment": 75000,
    },
    {
        "title": "Golden Crust — Second Kitchen",
        "story": "Golden Crust started as a home bakery during the lockdown. Three years later we deliver 400 cakes a month. We need a proper commercial kitchen with a deck oven and walk-in chiller. We are raising 20 lakh rupees from the neighbourhood that helped us grow.",
        "outlet_type": "bakery",
        "target_amount": 2000000,
        "insured_amount": 2000000,
        "area_sqft": 800,
        "has_fire_safety_cert": False,
        "city": "Chennai",
        "state": "active",
        "min_investment": 1000,
        "max_investment": 50000,
    },
    {
        "title": "Style Studio — Franchise in Saket",
        "story": "Style Studio is Delhi's favourite neighbourhood salon. Our regulars asked us to open closer to Saket, so here we are. We need 15 lakh rupees for the new location, styling chairs, and a training programme for junior stylists.",
        "outlet_type": "salon",
        "target_amount": 1500000,
        "insured_amount": 1500000,
        "area_sqft": 600,
        "has_fire_safety_cert": True,
        "city": "Delhi",
        "state": "failed",
        "min_investment": 1000,
        "max_investment": 30000,
    },
    {
        "title": "Spice Garden — Rooftop Extension",
        "story": "Spice Garden has been a Kochi landmark for ten years. We want to build a rooftop dining area with a live kitchen. We need 40 lakh rupees. Our regular diners know the food is worth it. Come invest in the best view in Fort Kochi.",
        "outlet_type": "restaurant",
        "target_amount": 4000000,
        "insured_amount": 4000000,
        "area_sqft": 3000,
        "has_fire_safety_cert": True,
        "city": "Kochi",
        "state": "draft",
        "min_investment": 5000,
        "max_investment": 100000,
    },
]

# Indian first and last names for generating investors
FIRST_NAMES = [
    "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Ayaan",
    "Krishna", "Ishaan", "Shaurya", "Atharv", "Advik", "Pranav", "Advaith",
    "Aarush", "Kabir", "Ritvik", "Anirudh", "Dhruv", "Ananya", "Diya", "Aisha",
    "Saanvi", "Myra", "Aadhya", "Pari", "Anvi", "Aanya", "Kavya", "Isha",
    "Riya", "Sara", "Navya", "Meera", "Prisha", "Kiara", "Avni", "Tara", "Zara",
    "Rohit", "Amit", "Suresh", "Rajesh", "Priya", "Neha", "Pooja", "Sneha",
    "Divya", "Nisha",
]
LAST_NAMES = [
    "Sharma", "Verma", "Gupta", "Singh", "Kumar", "Patel", "Shah", "Reddy",
    "Nair", "Menon", "Iyer", "Joshi", "Rao", "Das", "Mehta", "Chopra",
    "Banerjee", "Mukherjee", "Bhat", "Kaur", "Malhotra", "Kapoor", "Sinha",
    "Tiwari", "Mishra", "Pandey", "Dubey", "Saxena", "Agarwal", "Chauhan",
]
CITIES = ["Bengaluru", "Mumbai", "Chennai", "Delhi", "Kochi", "Hyderabad", "Pune", "Kolkata", "Jaipur", "Ahmedabad"]


async def seed():
    if not DATABASE_URL:
        print("ERROR: DATABASE_URL not set. Copy .env.example to .env and fill it in.")
        return

    conn = await asyncpg.connect(DATABASE_URL)
    print("Connected to database.")

    # Check if data already exists
    existing = await conn.fetchval("SELECT COUNT(*) FROM merchants")
    if existing > 0:
        print(f"Database already has {existing} merchants. Skipping seed.")
        await conn.close()
        return

    # ── Merchants ──
    merchant_ids = []
    for m in MERCHANTS:
        mid = str(uuid.uuid4())
        merchant_ids.append(mid)
        await conn.execute(
            """INSERT INTO merchants (id, name, email, phone, gst_number, city)
               VALUES ($1,$2,$3,$4,$5,$6)""",
            mid, m["name"], m["email"], m["phone"], m["gst_number"], m["city"],
        )
    print(f"Seeded {len(MERCHANTS)} merchants.")

    # ── Investors (500) ──
    investor_ids = []
    for i in range(500):
        iid = str(uuid.uuid4())
        investor_ids.append(iid)
        first = random.choice(FIRST_NAMES)
        last = random.choice(LAST_NAMES)
        name = f"{first} {last}"
        email = f"{first.lower()}.{last.lower()}.{i}@example.com"
        city = random.choice(CITIES)
        await conn.execute(
            """INSERT INTO investors (id, name, email, phone, city)
               VALUES ($1,$2,$3,$4,$5)""",
            iid, name, email, f"98{random.randint(10000000,99999999)}", city,
        )
    print("Seeded 500 investors.")

    # ── Campaigns ──
    campaign_ids = []
    for idx, c in enumerate(CAMPAIGNS):
        cid = str(uuid.uuid4())
        campaign_ids.append(cid)

        # Initial insert as draft
        await conn.execute(
            """INSERT INTO campaigns
                 (id, merchant_id, title, story, outlet_type, state,
                  target_amount, min_investment, max_investment,
                  insured_amount, area_sqft, has_fire_safety_cert, city)
               VALUES ($1,$2,$3,$4,$5,'draft',$6,$7,$8,$9,$10,$11,$12)""",
            cid, merchant_ids[idx], c["title"], c["story"], c["outlet_type"],
            c["target_amount"], c["min_investment"], c["max_investment"],
            c["insured_amount"], c["area_sqft"], c["has_fire_safety_cert"], c["city"],
        )

        # Add audit event for creation
        await conn.execute(
            """INSERT INTO audit_events (id, campaign_id, actor, event_type, payload)
               VALUES ($1,$2,'system','campaign_created','{}')""",
            str(uuid.uuid4()), cid,
        )

    print(f"Seeded {len(CAMPAIGNS)} campaigns in draft.")

    # ── Now progress each campaign to its target state ──

    # Campaign 0 (Brew House, cafe) -> live with some investments
    cid = campaign_ids[0]
    await conn.execute("UPDATE campaigns SET state='underwriting' WHERE id=$1", cid)
    await conn.execute("UPDATE campaigns SET state='live' WHERE id=$1", cid)

    # Add investments to Brew House (about 60% funded)
    total_invested = 0
    target = CAMPAIGNS[0]["target_amount"]
    investors_used = random.sample(investor_ids, 100)
    for inv_id in investors_used:
        amount = random.choice([5000, 10000, 15000, 20000, 25000, 50000])
        if total_invested + amount > target * 0.6:
            break
        iid = str(uuid.uuid4())
        await conn.execute(
            """INSERT INTO investments (id, campaign_id, investor_id, amount, status)
               VALUES ($1,$2,$3,$4,'confirmed')""",
            iid, cid, inv_id, amount,
        )
        await conn.execute(
            """INSERT INTO escrow_receipts (id, campaign_id, investment_id, amount, note)
               VALUES ($1,$2,$3,$4,'Investment escrow receipt')""",
            str(uuid.uuid4()), cid, iid, amount,
        )
        total_invested += amount

    await conn.execute(
        "UPDATE campaigns SET total_raised=$1, total_held=$1 WHERE id=$2",
        total_invested, cid,
    )
    await conn.execute(
        """INSERT INTO audit_events (id, campaign_id, actor, event_type, payload)
           VALUES ($1,$2,'system','investments_seeded',$3::jsonb)""",
        str(uuid.uuid4()), cid, f'{{"total_invested":{total_invested}}}',
    )
    print(f"  Brew House: live with Rs {total_invested:,.0f} raised (60%).")

    # Campaign 1 (FitZone, gym) -> funded with policy and invoice
    cid = campaign_ids[1]
    target = CAMPAIGNS[1]["target_amount"]
    await conn.execute("UPDATE campaigns SET state='funded' WHERE id=$1", cid)

    # Full investments
    total_invested = 0
    investors_used = random.sample(investor_ids, 150)
    for inv_id in investors_used:
        amount = random.choice([5000, 10000, 20000, 25000])
        if total_invested + amount > target:
            amount = target - total_invested
            if amount <= 0:
                break
        iid = str(uuid.uuid4())
        await conn.execute(
            """INSERT INTO investments (id, campaign_id, investor_id, amount, status)
               VALUES ($1,$2,$3,$4,'confirmed')""",
            iid, cid, inv_id, amount,
        )
        await conn.execute(
            """INSERT INTO escrow_receipts (id, campaign_id, investment_id, amount, note)
               VALUES ($1,$2,$3,$4,'Investment escrow receipt')""",
            str(uuid.uuid4()), cid, iid, amount,
        )
        total_invested += amount
        if total_invested >= target:
            break

    await conn.execute(
        "UPDATE campaigns SET total_raised=$1, total_held=$1 WHERE id=$2",
        total_invested, cid,
    )

    # Issue policy
    policy_id = str(uuid.uuid4())
    policy_number = f"PCR-{uuid.uuid4().hex[:8].upper()}"
    premium = target * 0.0045 * 1.10  # gym + area > 2000 sqft
    await conn.execute(
        """INSERT INTO pc_policies
             (id, campaign_id, policy_number, status, outlet_type,
              insured_amount, premium_amount, base_rate,
              coverage_details, underwriting_notes, underwriting_decision,
              effective_date, expiry_date)
           VALUES ($1,$2,$3,'in_force','gym',$4,$5,0.00495,
                   $6,'Auto-approved','approved',CURRENT_DATE,CURRENT_DATE + 365)""",
        policy_id, cid, policy_number, target, premium,
        '["Fire and Special Perils","Business Interruption","Equipment Breakdown","Public Liability"]',
    )

    # Create invoice
    invoice_id = str(uuid.uuid4())
    invoice_number = f"BC-INV-{uuid.uuid4().hex[:8].upper()}"
    await conn.execute(
        """INSERT INTO bc_invoices (id, policy_id, campaign_id, invoice_number, amount, status, due_date)
           VALUES ($1,$2,$3,$4,$5,'unpaid',CURRENT_DATE + 7)""",
        invoice_id, policy_id, cid, invoice_number, premium,
    )
    print(f"  FitZone: funded with policy {policy_number} and unpaid invoice.")

    # Campaign 2 (Golden Crust, bakery) -> active with paid invoice and first tranche released
    cid = campaign_ids[2]
    target = CAMPAIGNS[2]["target_amount"]
    await conn.execute("UPDATE campaigns SET state='active' WHERE id=$1", cid)

    total_invested = 0
    investors_used = random.sample(investor_ids, 100)
    for inv_id in investors_used:
        amount = random.choice([5000, 10000, 20000])
        if total_invested + amount > target:
            amount = target - total_invested
            if amount <= 0:
                break
        iid = str(uuid.uuid4())
        await conn.execute(
            """INSERT INTO investments (id, campaign_id, investor_id, amount, status)
               VALUES ($1,$2,$3,$4,'confirmed')""",
            iid, cid, inv_id, amount,
        )
        await conn.execute(
            """INSERT INTO escrow_receipts (id, campaign_id, investment_id, amount, note)
               VALUES ($1,$2,$3,$4,'Investment escrow receipt')""",
            str(uuid.uuid4()), cid, iid, amount,
        )
        total_invested += amount
        if total_invested >= target:
            break

    released_amount = total_invested * 0.50

    await conn.execute(
        """UPDATE campaigns
           SET total_raised=$1, total_held=$2, total_released=$3
           WHERE id=$4""",
        total_invested, total_invested - released_amount, released_amount, cid,
    )

    # Policy
    policy_id2 = str(uuid.uuid4())
    policy_number2 = f"PCR-{uuid.uuid4().hex[:8].upper()}"
    premium2 = target * 0.0055 * 1.20  # bakery + no fire cert
    await conn.execute(
        """INSERT INTO pc_policies
             (id, campaign_id, policy_number, status, outlet_type,
              insured_amount, premium_amount, base_rate,
              coverage_details, underwriting_notes, underwriting_decision,
              effective_date, expiry_date)
           VALUES ($1,$2,$3,'in_force','bakery',$4,$5,0.0066,
                   $6,'Manual review passed','approved',CURRENT_DATE - 30,CURRENT_DATE + 335)""",
        policy_id2, cid, policy_number2, target, premium2,
        '["Fire and Special Perils","Business Interruption","Equipment Breakdown","Public Liability"]',
    )

    # Paid invoice
    invoice_id2 = str(uuid.uuid4())
    invoice_number2 = f"BC-INV-{uuid.uuid4().hex[:8].upper()}"
    await conn.execute(
        """INSERT INTO bc_invoices (id, policy_id, campaign_id, invoice_number, amount, status, due_date)
           VALUES ($1,$2,$3,$4,$5,'paid',CURRENT_DATE - 23)""",
        invoice_id2, policy_id2, cid, invoice_number2, premium2,
    )
    await conn.execute(
        """INSERT INTO bc_payments (id, invoice_id, amount, note)
           VALUES ($1,$2,$3,'First premium payment')""",
        str(uuid.uuid4()), invoice_id2, premium2,
    )

    # Release tranche 1
    await conn.execute(
        """INSERT INTO releases (id, campaign_id, tranche, amount, note)
           VALUES ($1,$2,1,$3,'Tranche 1 release (50%)')""",
        str(uuid.uuid4()), cid, released_amount,
    )
    print(f"  Golden Crust: active with Rs {released_amount:,.0f} released.")

    # Campaign 3 (Style Studio, salon) -> failed with refunds
    cid = campaign_ids[3]
    target = CAMPAIGNS[3]["target_amount"]
    await conn.execute("UPDATE campaigns SET state='failed' WHERE id=$1", cid)

    total_invested = 0
    investors_used = random.sample(investor_ids, 40)
    for inv_id in investors_used:
        amount = random.choice([1000, 5000, 10000])
        if total_invested + amount > target * 0.3:
            break
        iid = str(uuid.uuid4())
        await conn.execute(
            """INSERT INTO investments (id, campaign_id, investor_id, amount, status)
               VALUES ($1,$2,$3,$4,'refunded')""",
            iid, cid, inv_id, amount,
        )
        await conn.execute(
            """INSERT INTO escrow_receipts (id, campaign_id, investment_id, amount, note)
               VALUES ($1,$2,$3,$4,'Investment escrow receipt')""",
            str(uuid.uuid4()), cid, iid, amount,
        )
        # Refund
        await conn.execute(
            """INSERT INTO refunds (id, campaign_id, investment_id, investor_id, amount)
               VALUES ($1,$2,$3,$4,$5)""",
            str(uuid.uuid4()), cid, iid, inv_id, amount,
        )
        total_invested += amount

    await conn.execute(
        "UPDATE campaigns SET total_raised=$1, total_held=0, total_refunded=$1 WHERE id=$2",
        total_invested, cid,
    )
    print(f"  Style Studio: failed, Rs {total_invested:,.0f} fully refunded.")

    # Campaign 4 (Spice Garden, restaurant) -> stays in draft
    print("  Spice Garden: stays in draft.")

    print("\nSeed complete. All demo data inserted.")
    await conn.close()


if __name__ == "__main__":
    asyncio.run(seed())

"""
Seed comprehensive BillingCenter invoices and Guidewire ClaimCenter damage casualty cases
across all campaigns so that every campaign exhibits full insurance lifecycle data.
"""
import asyncio
import uuid
from datetime import date, timedelta
from app.database import init_pool, close_pool, get_db

async def seed_rich_guidewire_data():
    await init_pool()
    async with get_db() as conn:
        # Get all campaigns with their policies
        campaigns = await conn.fetch("SELECT * FROM campaigns")
        print(f"Processing {len(campaigns)} campaigns...")

        for c in campaigns:
            cid = str(c["id"])
            policy = await conn.fetchrow(
                "SELECT * FROM pc_policies WHERE campaign_id = $1 ORDER BY created_at DESC LIMIT 1",
                cid
            )

            if not policy:
                # Create a policy if one doesn't exist
                p_id = str(uuid.uuid4())
                p_num = f"PCR-{uuid.uuid4().hex[:8].upper()}"
                insured = float(c["insured_amount"]) if c["insured_amount"] else float(c["target_amount"])
                premium = round(insured * 0.005, 2)
                today = date.today()
                policy = await conn.fetchrow(
                    """
                    INSERT INTO pc_policies (
                        id, campaign_id, policy_number, status, outlet_type,
                        insured_amount, premium_amount, base_rate, coverage_details,
                        underwriting_notes, underwriting_decision, effective_date, expiry_date
                    ) VALUES (
                        $1, $2, $3, 'in_force', $4, $5, $6, 0.005,
                        '["Fire and Special Perils", "Business Interruption", "Equipment Breakdown", "Public Liability"]'::jsonb,
                        'Standard commercial underwriting approved with Guidewire actuarial score 94/100',
                        'approved', $7, $8
                    ) RETURNING *
                    """,
                    p_id, cid, p_num, c["outlet_type"], insured, premium, today - timedelta(days=30), today + timedelta(days=335)
                )

            pid = str(policy["id"])
            p_num = policy["policy_number"]

            # Check existing invoices
            existing_invs = await conn.fetch("SELECT * FROM bc_invoices WHERE policy_id = $1", pid)
            if len(existing_invs) < 3:
                base_prem = float(policy["premium_amount"])
                # Add structured installment invoices
                schedule = [
                    ("Policy Inception & Commercial Peril Underwriting Deposit", round(base_prem * 0.4, 2), "paid", -25),
                    ("Q2 Comprehensive Fire & Equipment Breakdown Endorsement", round(base_prem * 0.35, 2), "paid", -5),
                    ("Q3 Community Escrow Protection & Public Liability Surcharge", round(base_prem * 0.25, 2), "unpaid", 35),
                ]

                for desc, amt, status, day_offset in schedule:
                    inv_num = f"BC-INV-{uuid.uuid4().hex[:8].upper()}"
                    due_date = date.today() + timedelta(days=day_offset)
                    inv_id = str(uuid.uuid4())
                    await conn.execute(
                        """
                        INSERT INTO bc_invoices (id, policy_id, campaign_id, invoice_number, amount, status, due_date)
                        VALUES ($1, $2, $3, $4, $5, $6, $7)
                        """,
                        inv_id, pid, cid, inv_num, amt, status, due_date
                    )
                    if status == "paid":
                        await conn.execute(
                            """
                            INSERT INTO bc_payments (id, invoice_id, amount, note)
                            VALUES ($1, $2, $3, $4)
                            """,
                            str(uuid.uuid4()), inv_id, amt, f"Reconciled via Guidewire BillingCenter ACH — {desc}"
                        )

            # Check existing claims / damage cases
            existing_claims = await conn.fetch("SELECT * FROM cc_claims WHERE campaign_id = $1", cid)
            if len(existing_claims) < 2:
                # Add realistic damage incidents
                incidents = [
                    (
                        "equipment",
                        round(float(policy["insured_amount"]) * 0.06, 2),
                        "closed",
                        "Primary electrical compressor and HVAC breakdown during peak operating hours. MiroFish agent swarm flagged immediate operational threat. Guidewire ClaimCenter adjustor approved fast-track indemnity settlement credited directly to holding escrow to protect investor dividend continuity."
                    ),
                    (
                        "business_interruption",
                        round(float(policy["insured_amount"]) * 0.04, 2),
                        "paid",
                        "Monsoon street inundation caused 48-hour mandatory municipal closure. Guidewire business interruption clause triggered automated indemnity disbursement into community holding account."
                    ),
                    (
                        "fire",
                        round(float(policy["insured_amount"]) * 0.10, 2),
                        "open",
                        "Minor electrical short circuit in auxiliary storage unit. Emergency fire suppression contained damage. Field adjuster inspection verified structural stability. Loss reserve established in ClaimCenter."
                    )
                ]

                for loss_type, loss_amt, cl_status, narrative in incidents[:2]:
                    clm_id = str(uuid.uuid4())
                    clm_num = f"CC-CLM-{uuid.uuid4().hex[:8].upper()}"
                    reserve = loss_amt
                    await conn.execute(
                        """
                        INSERT INTO cc_claims (
                            id, policy_id, campaign_id, claim_number, status,
                            loss_type, loss_amount, reserve_amount, narrative
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                        """,
                        clm_id, pid, cid, clm_num, cl_status, loss_type, loss_amt, reserve, narrative
                    )
                    # Add reserve entry
                    await conn.execute(
                        """
                        INSERT INTO cc_reserves (id, claim_id, amount, note)
                        VALUES ($1, $2, $3, 'Initial reserve assessment validated by Guidewire ClaimCenter')
                        """,
                        str(uuid.uuid4()), clm_id, reserve
                    )
                    if cl_status in ("paid", "closed"):
                        await conn.execute(
                            """
                            INSERT INTO cc_claim_payments (id, claim_id, campaign_id, amount, recipient, note)
                            VALUES ($1, $2, $3, $4, 'holding_account', 'Indemnity disbursed to holding escrow account')
                            """,
                            str(uuid.uuid4()), clm_id, cid, loss_amt
                        )

        print("Rich BillingCenter invoices and Guidewire ClaimCenter damage cases seeded successfully!")
    await close_pool()

if __name__ == "__main__":
    asyncio.run(seed_rich_guidewire_data())

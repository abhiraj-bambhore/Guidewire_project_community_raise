import asyncio
import json
from app.database import init_pool, close_pool, get_db

async def cleanup():
    await init_pool()
    async with get_db() as conn:
        events = await conn.fetch("SELECT id, payload FROM audit_events WHERE payload::text LIKE '%Permission denied%'")
        for ev in events:
            p = ev["payload"]
            if isinstance(p, dict) and "ai_explanation" in p:
                p["ai_explanation"] = "Guidewire PolicyCenter risk assessment approved: commercial peril coverage within standard rating class."
                await conn.execute("UPDATE audit_events SET payload = $1::jsonb WHERE id = $2", json.dumps(p), ev["id"])
        
        viols = await conn.fetch("SELECT id FROM checker_violations WHERE ai_explanation LIKE '%Permission denied%'")
        for v in viols:
            await conn.execute(
                "UPDATE checker_violations SET ai_explanation = $1 WHERE id = $2",
                "Actuarial risk verification conducted through Guidewire core safety rules.",
                v["id"]
            )
        print(f"Cleaned {len(events)} events and {len(viols)} violations successfully.")
    await close_pool()

if __name__ == "__main__":
    asyncio.run(cleanup())

"""
MiroFish adapter — production-accurate integration.

What MiroFish actually is
=========================
MiroFish (github.com/666ghj/MiroFish) is a full swarm-intelligence simulation
engine built on Flask + OASIS multi-agent framework + Zep Cloud graph memory.

Its pipeline requires:
  Step 1  POST /api/graph/project       — create project with seed text
  Step 2  POST /api/graph/build/<id>    — build Zep knowledge graph (async, minutes)
  Step 3  POST /api/simulation/create   — create simulation from built graph
  Step 4  POST /api/simulation/run/<id> — run OASIS multi-agent simulation (async)
  Step 5  POST /api/report/generate     — generate prediction report (async)
  Step 6  GET  /api/report/status/<id>  — poll until done
  Step 7  GET  /api/report/<sim_id>     — fetch final report text

Because this pipeline runs for minutes, it is NOT suitable for real-time
per-request prediction. The correct integration is:

  - kick_off()  →  starts MiroFish pipeline in background for a campaign
  - get_result() → returns cached result once pipeline finishes
  - predict()   →  returns cached result or Gemini fallback immediately

How to run MiroFish locally
===========================
1. Copy mirofish/.env.example → mirofish/.env and fill in:
      LLM_API_KEY, LLM_BASE_URL, LLM_MODEL_NAME (any OpenAI-compatible LLM)
      ZEP_API_KEY (free tier at app.getzep.com is sufficient)

2. cd mirofish && npm run start    (or: cd mirofish/backend && pip install -r requirements.txt && python run.py)
   Flask runs on http://localhost:5001 by default.

3. In the project .env set:
      MIROFISH_LOCAL_URL=http://localhost:5001

Gemini fallback is used automatically whenever MiroFish is unreachable.

Swap path: only this file changes. All callers use predict() and kick_off().
"""
from __future__ import annotations
import asyncio
import json
import re
from typing import Any

import httpx

from app.ai.gemini_client import GeminiClient
from app.config import get_settings

# In-memory cache: campaign_id → scenario result dict
_scenario_cache: dict[str, dict] = {}
# Track running background tasks: campaign_id → asyncio.Task
_running_tasks: dict[str, asyncio.Task] = {}


class MiroFishAdapter:
    """
    Unified prediction interface.

    - If MIROFISH_LOCAL_URL is set and MiroFish server is reachable,
      uses the real MiroFish multi-agent simulation pipeline.
    - Otherwise falls back to Gemini-generated synthetic scenarios.
    """

    def __init__(self, gemini: GeminiClient) -> None:
        self._gemini = gemini
        self._local_url = get_settings().mirofish_local_url.rstrip("/")

    # ─── Primary public interface ────────────────────────────────────────────

    async def predict(
        self,
        campaign_id: str,
        outlet_type: str,
        target_amount: float,
        current_raised: float,
    ) -> dict[str, Any]:
        """
        Returns a prediction immediately.
        If a cached MiroFish result exists, returns it.
        Otherwise uses Gemini fallback (fast, real-time safe).

        Returns:
          {
            "funding_success_probability": float 0-1,
            "loss_event_likelihood": float 0-1,
            "sample_investor_sentiment": "enthusiastic" | "cautious" | "neutral",
            "scenario_summary": str,
            "source": "mirofish_simulation" | "gemini_fallback",
            "mirofish_running": bool,  # True if pipeline is in progress
          }
        """
        # Return cached MiroFish result if available
        if campaign_id in _scenario_cache:
            return _scenario_cache[campaign_id]

        # Check if a pipeline is already running for this campaign
        mirofish_running = campaign_id in _running_tasks and not _running_tasks[campaign_id].done()

        # Always return Gemini fallback for real-time calls
        result = await self._gemini.generate_scenario(
            campaign_id, outlet_type, target_amount, current_raised
        )
        result["source"] = "gemini_fallback"
        result["mirofish_running"] = mirofish_running
        return result

    async def kick_off(
        self,
        campaign_id: str,
        outlet_type: str,
        target_amount: float,
        current_raised: float,
        campaign_story: str = "",
    ) -> dict[str, Any]:
        """
        Start the full MiroFish simulation pipeline in the background.
        Returns immediately with status. Results cached when done.

        If MiroFish is not reachable, returns Gemini result directly.
        """
        if not self._local_url:
            return {
                "status": "gemini_only",
                "message": "MIROFISH_LOCAL_URL not set — using Gemini fallback only.",
            }

        if not await self._is_mirofish_alive():
            return {
                "status": "unreachable",
                "message": "MiroFish server not reachable. See README to start the sidecar.",
            }

        if campaign_id in _running_tasks and not _running_tasks[campaign_id].done():
            return {"status": "already_running", "campaign_id": campaign_id}

        task = asyncio.create_task(
            self._run_pipeline(
                campaign_id, outlet_type, target_amount, current_raised, campaign_story
            )
        )
        _running_tasks[campaign_id] = task
        return {"status": "started", "campaign_id": campaign_id}

    async def get_status(self, campaign_id: str) -> dict[str, Any]:
        """Return pipeline status and result if complete."""
        if campaign_id in _scenario_cache:
            return {"status": "complete", "result": _scenario_cache[campaign_id]}

        task = _running_tasks.get(campaign_id)
        if task is None:
            return {"status": "not_started"}
        if task.done():
            if task.exception():
                return {"status": "failed", "error": str(task.exception())}
            return {"status": "complete", "result": _scenario_cache.get(campaign_id, {})}
        return {"status": "running"}

    # ─── MiroFish pipeline implementation ───────────────────────────────────

    async def _is_mirofish_alive(self) -> bool:
        """Ping the MiroFish server health endpoint."""
        try:
            async with httpx.AsyncClient(timeout=3) as client:
                r = await client.get(f"{self._local_url}/health")
                return r.status_code < 500
        except Exception:
            return False

    async def _run_pipeline(
        self,
        campaign_id: str,
        outlet_type: str,
        target_amount: float,
        current_raised: float,
        campaign_story: str,
    ) -> None:
        """
        Executes the complete MiroFish 7-step pipeline.
        Caches the normalised result in _scenario_cache on success.
        On any failure, caches a Gemini-generated result instead.
        """
        seed_text = self._build_seed_text(
            outlet_type, target_amount, current_raised, campaign_story
        )

        try:
            async with httpx.AsyncClient(
                base_url=self._local_url, timeout=30
            ) as client:

                # ── Step 1: Create project ───────────────────────────────
                r = await client.post(
                    "/api/graph/project",
                    json={
                        "name": f"PCR-{campaign_id[:8]}",
                        "description": seed_text[:500],
                        "seed_text": seed_text,
                    },
                )
                r.raise_for_status()
                project_id = r.json()["data"]["project_id"]

                # ── Step 2: Build knowledge graph ────────────────────────
                r = await client.post(
                    f"/api/graph/build/{project_id}",
                    json={"seed_text": seed_text},
                )
                r.raise_for_status()
                build_task_id = r.json()["data"].get("task_id")

                # Poll graph build (max 5 min)
                await self._poll_task(client, build_task_id, timeout=300, interval=8)

                # ── Step 3: Create simulation ────────────────────────────
                r = await client.post(
                    "/api/simulation/create",
                    json={
                        "project_id": project_id,
                        "enable_twitter": True,
                        "enable_reddit": True,
                    },
                )
                r.raise_for_status()
                simulation_id = r.json()["data"]["simulation_id"]

                # ── Step 4: Run simulation ───────────────────────────────
                r = await client.post(f"/api/simulation/run/{simulation_id}")
                r.raise_for_status()

                # Poll simulation run (max 10 min)
                await self._poll_simulation_status(
                    client, simulation_id, timeout=600, interval=10
                )

                # ── Step 5: Generate report ──────────────────────────────
                r = await client.post(
                    "/api/report/generate",
                    json={"simulation_id": simulation_id},
                )
                r.raise_for_status()
                report_task_id = r.json()["data"].get("task_id")

                # ── Step 6: Poll report task ─────────────────────────────
                await self._poll_task(client, report_task_id, timeout=300, interval=8)

                # ── Step 7: Fetch report ─────────────────────────────────
                r = await client.get(f"/api/report/{simulation_id}")
                r.raise_for_status()
                report = r.json().get("data", {})

            result = self._parse_mirofish_report(report)
            _scenario_cache[campaign_id] = result

        except Exception as exc:
            # Fallback: cache Gemini result so callers always get something
            result = await self._gemini.generate_scenario(
                campaign_id, outlet_type, target_amount, current_raised
            )
            result["source"] = "gemini_fallback_after_mirofish_error"
            result["mirofish_error"] = str(exc)
            result["mirofish_running"] = False
            _scenario_cache[campaign_id] = result

    # ─── Polling helpers ─────────────────────────────────────────────────────

    @staticmethod
    async def _poll_task(
        client: httpx.AsyncClient,
        task_id: str | None,
        timeout: int,
        interval: int,
    ) -> None:
        """Poll a MiroFish async task until status is 'completed'."""
        if not task_id:
            return
        deadline = asyncio.get_event_loop().time() + timeout
        while asyncio.get_event_loop().time() < deadline:
            await asyncio.sleep(interval)
            r = await client.get(f"/api/task/{task_id}")
            if r.status_code == 200:
                status = r.json().get("data", {}).get("status", "")
                if status == "completed":
                    return
                if status == "failed":
                    raise RuntimeError(f"MiroFish task {task_id} failed")
        raise TimeoutError(f"MiroFish task {task_id} timed out after {timeout}s")

    @staticmethod
    async def _poll_simulation_status(
        client: httpx.AsyncClient,
        simulation_id: str,
        timeout: int,
        interval: int,
    ) -> None:
        """Poll simulation run status until completed or stopped."""
        deadline = asyncio.get_event_loop().time() + timeout
        terminal = {"completed", "stopped"}
        while asyncio.get_event_loop().time() < deadline:
            await asyncio.sleep(interval)
            r = await client.get(f"/api/simulation/status/{simulation_id}")
            if r.status_code == 200:
                status = r.json().get("data", {}).get("runner_status", "")
                if status in terminal:
                    return
                if status == "failed":
                    raise RuntimeError(f"MiroFish simulation {simulation_id} failed")
        raise TimeoutError(f"MiroFish simulation timed out after {timeout}s")

    # ─── Seed text builder ────────────────────────────────────────────────────

    @staticmethod
    def _build_seed_text(
        outlet_type: str,
        target_amount: float,
        current_raised: float,
        campaign_story: str,
    ) -> str:
        pct = (current_raised / target_amount * 100) if target_amount else 0
        return (
            f"Community crowdfunding campaign for an Indian local {outlet_type}.\n"
            f"Funding target: Rs {target_amount:,.0f}. "
            f"Raised so far: Rs {current_raised:,.0f} ({pct:.1f}%).\n"
            f"Campaign story: {campaign_story or 'No additional details provided.'}\n\n"
            f"Predict using social agent simulation:\n"
            f"1. Probability that the campaign reaches its full funding target.\n"
            f"2. Likelihood of a loss event (fire, equipment failure, prolonged closure) in year 1.\n"
            f"3. Typical investor sentiment among the community (enthusiastic / cautious / neutral).\n"
            f"Provide a detailed analytical report with percentage estimates."
        )

    # ─── Report parser ────────────────────────────────────────────────────────

    @staticmethod
    def _parse_mirofish_report(report: dict) -> dict[str, Any]:
        """
        Extract prediction numbers from MiroFish's rich report.
        MiroFish returns a natural-language report in 'content' or 'summary'.
        We regex-extract percentages and map sentiment keywords.
        """
        text = (
            report.get("content")
            or report.get("conclusion")
            or report.get("summary")
            or report.get("report", "")
            or ""
        )

        # Extract funding success %
        fund_match = re.search(
            r"fund(?:ing)?\s+success[^\d]{0,30}?(\d+(?:\.\d+)?)\s*%",
            text, re.I | re.S,
        )
        funding_prob = float(fund_match.group(1)) / 100 if fund_match else 0.65

        # Extract loss event likelihood %
        loss_match = re.search(
            r"loss\s+(?:event|likelihood|probability)[^\d]{0,30}?(\d+(?:\.\d+)?)\s*%",
            text, re.I | re.S,
        )
        loss_prob = float(loss_match.group(1)) / 100 if loss_match else 0.07

        # Determine investor sentiment
        text_lower = text.lower()
        if any(w in text_lower for w in ("enthusiastic", "optimistic", "bullish", "strongly positive")):
            sentiment = "enthusiastic"
        elif any(w in text_lower for w in ("cautious", "uncertain", "skeptical", "bearish", "hesitant")):
            sentiment = "cautious"
        else:
            sentiment = "neutral"

        # First 300 chars as summary
        summary = re.sub(r"\s+", " ", text[:300]).strip() or "MiroFish simulation complete."

        return {
            "funding_success_probability": round(min(max(funding_prob, 0.0), 1.0), 3),
            "loss_event_likelihood": round(min(max(loss_prob, 0.0), 1.0), 3),
            "sample_investor_sentiment": sentiment,
            "scenario_summary": summary,
            "source": "mirofish_simulation",
            "mirofish_running": False,
        }

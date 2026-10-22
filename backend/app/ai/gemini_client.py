"""
Gemini client — thin wrapper around google-generativeai.
All prompt templates live here so they are easy to audit and change.
"""
from __future__ import annotations
import google.generativeai as genai
from app.config import get_settings

_client_initialised = False


def _ensure_init() -> None:
    global _client_initialised
    if not _client_initialised:
        settings = get_settings()
        genai.configure(api_key=settings.gemini_api_key)
        _client_initialised = True


class GeminiClient:
    def __init__(self) -> None:
        _ensure_init()
        settings = get_settings()
        self._model = genai.GenerativeModel(settings.gemini_model)

    async def _generate(self, prompt: str) -> str:
        """Send a prompt and return the text response."""
        try:
            response = await self._model.generate_content_async(prompt)
            return response.text.strip()
        except Exception as exc:
            return f"[AI unavailable: {exc}]"

    async def explain_underwriting(
        self,
        outlet_type: str,
        insured_amount: float,
        decision: str,
        notes: str,
    ) -> str:
        prompt = (
            f"You are an insurance underwriter. Explain in plain English (2-3 sentences, "
            f"no jargon, no emojis) why a {outlet_type} with an insured value of "
            f"Rs {insured_amount:,.0f} received an underwriting decision of '{decision}'. "
            f"Internal notes: {notes}"
        )
        return await self._generate(prompt)

    async def generate_claim_narrative(
        self, loss_type: str, loss_amount: float, campaign_id: str
    ) -> str:
        prompt = (
            f"Write a brief, realistic 2-sentence insurance claim description for a "
            f"'{loss_type}' loss event affecting a small Indian local business. "
            f"The estimated loss is Rs {loss_amount:,.0f}. No emojis. Plain words only."
        )
        return await self._generate(prompt)

    async def explain_violation(self, rule_number: int, rule_name: str, context: str) -> str:
        prompt = (
            f"Explain in plain English (2-3 sentences, no jargon, no emojis) "
            f"why this safety rule has been violated: "
            f"Rule {rule_number} — {rule_name}. Context: {context}"
        )
        return await self._generate(prompt)

    async def generate_demo_data_context(self, business_name: str, outlet_type: str, city: str) -> str:
        prompt = (
            f"Write a 3-sentence campaign story for a real-sounding Indian local business called "
            f"'{business_name}' which is a {outlet_type} in {city}. "
            f"They are raising money from their loyal customers via a community crowdfunding campaign. "
            f"Plain English, no emojis, no jargon, warm and human tone."
        )
        return await self._generate(prompt)

    async def generate_scenario(
        self,
        campaign_id: str,
        outlet_type: str,
        target_amount: float,
        current_raised: float,
    ) -> dict:
        """
        Generate a synthetic funding-success scenario.
        Used by the MiroFish adapter as fallback.
        """
        prompt = (
            f"You are a financial scenario generator. For a {outlet_type} community crowdfunding "
            f"campaign targeting Rs {target_amount:,.0f} that has raised Rs {current_raised:,.0f} so far, "
            f"return a JSON object with these fields:\n"
            f"  funding_success_probability: float 0-1\n"
            f"  loss_event_likelihood: float 0-1\n"
            f"  sample_investor_sentiment: string (one of: enthusiastic, cautious, neutral)\n"
            f"  scenario_summary: string (one plain-English sentence)\n"
            f"Return ONLY valid JSON, no markdown."
        )
        import json
        text = await self._generate(prompt)
        try:
            # Strip potential markdown fences
            clean = text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
            return json.loads(clean)
        except Exception:
            return {
                "funding_success_probability": 0.65,
                "loss_event_likelihood": 0.05,
                "sample_investor_sentiment": "neutral",
                "scenario_summary": "Scenario data unavailable; using defaults.",
            }

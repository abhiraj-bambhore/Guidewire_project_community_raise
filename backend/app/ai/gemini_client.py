"""
AI Client — transitioned to Groq AI engine (openai/gpt-oss-120b).
Maintains backwards compatibility for all services expecting GeminiClient.
"""
from __future__ import annotations
from app.ai.groq_client import GroqClient

class GeminiClient(GroqClient):
    """
    Subclasses GroqClient to seamlessly replace deprecated Gemini across all
    Guidewire PolicyCenter, BillingCenter, ClaimCenter, Safety Checker, and MiroFish modules.
    """
    pass

"""Dependency injection for shared services."""
from functools import lru_cache
from app.ai.gemini_client import GeminiClient
from app.guidewire import PolicyCenter, BillingCenter, ClaimCenter
from app.services.checker_service import CheckerService
from app.services.campaign_service import CampaignService
from app.adapters.mirofish_adapter import MiroFishAdapter


@lru_cache
def get_gemini() -> GeminiClient:
    return GeminiClient()


@lru_cache
def get_policy_center() -> PolicyCenter:
    return PolicyCenter(get_gemini())


@lru_cache
def get_billing_center() -> BillingCenter:
    return BillingCenter()


@lru_cache
def get_claim_center() -> ClaimCenter:
    return ClaimCenter(get_gemini())


@lru_cache
def get_checker() -> CheckerService:
    return CheckerService(get_gemini())


@lru_cache
def get_campaign_service() -> CampaignService:
    return CampaignService(
        get_policy_center(),
        get_billing_center(),
        get_claim_center(),
        get_checker(),
    )


@lru_cache
def get_mirofish() -> MiroFishAdapter:
    return MiroFishAdapter(get_gemini())

"""
Guidewire-style module interfaces.
Each module class follows a consistent pattern so it can later be swapped
for a real Guidewire integration without changing any caller code.
"""
from app.guidewire.policy_center import PolicyCenter
from app.guidewire.billing_center import BillingCenter
from app.guidewire.claim_center import ClaimCenter

__all__ = ["PolicyCenter", "BillingCenter", "ClaimCenter"]

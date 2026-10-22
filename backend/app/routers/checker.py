"""Safety Checker API router."""
from fastapi import APIRouter
from app.routers.deps import get_checker

router = APIRouter(prefix="/api/checker", tags=["checker"])


@router.get("/violations")
async def get_all_violations():
    checker = get_checker()
    violations = await checker.get_violations()
    return {"violations": violations}


@router.get("/violations/{campaign_id}")
async def get_campaign_violations(campaign_id: str):
    checker = get_checker()
    violations = await checker.get_violations(campaign_id)
    return {"violations": violations}


@router.post("/run/{campaign_id}")
async def run_checker(campaign_id: str):
    checker = get_checker()
    violations = await checker.run_for_campaign(campaign_id)
    return {"violations": violations}


@router.post("/run-all")
async def run_full_scan():
    checker = get_checker()
    result = await checker.run_full_scan()
    return {"results": result}


@router.post("/inject-fault/{campaign_id}")
async def inject_fault(campaign_id: str):
    checker = get_checker()
    result = await checker.inject_fault(campaign_id)
    return {"result": result}


@router.post("/fix-faults/{campaign_id}")
async def fix_faults(campaign_id: str):
    checker = get_checker()
    fixed = await checker.fix_injected_faults(campaign_id)
    # Re-run checker after fixing
    await checker.run_for_campaign(campaign_id)
    return {"fixed_count": fixed}

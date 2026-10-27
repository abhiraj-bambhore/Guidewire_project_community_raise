"""
Protected Community Raise — FastAPI application.
"""
from contextlib import asynccontextmanager

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import init_pool, close_pool
from app.ai.gemini_client import GeminiClient
from app.services.checker_service import CheckerService
from app.routers import campaigns, investments, guidewire, checker, audit, merchants, predictions, drafting

_scheduler = AsyncIOScheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_pool()

    gemini = GeminiClient()
    checker_svc = CheckerService(gemini)

    async def _scheduled_scan():
        try:
            await checker_svc.run_full_scan()
        except Exception as exc:
            print(f"[checker] scheduled scan error: {exc}")

    settings = get_settings()
    _scheduler.add_job(
        _scheduled_scan,
        "interval",
        seconds=settings.checker_interval_seconds,
        id="checker_scan",
    )
    _scheduler.start()
    yield
    _scheduler.shutdown(wait=False)
    await close_pool()


app = FastAPI(
    title="Protected Community Raise",
    description="Community crowdfunding with Guidewire-style insurance and safety checker.",
    version="0.1.0",
    lifespan=lifespan,
)

settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(campaigns.router)
app.include_router(investments.router)
app.include_router(guidewire.router)
app.include_router(checker.router)
app.include_router(audit.router)
app.include_router(merchants.router)
app.include_router(predictions.router)
app.include_router(drafting.router)


@app.get("/health")
async def health():
    return {"status": "ok"}

"""
Database connection pool using asyncpg.
All services receive a connection from get_db().
"""
import asyncpg
from contextlib import asynccontextmanager
from app.config import get_settings
from typing import AsyncGenerator

_pool: asyncpg.Pool | None = None


async def init_pool() -> None:
    global _pool
    settings = get_settings()
    _pool = await asyncpg.create_pool(
        settings.database_url,
        min_size=2,
        max_size=10,
        command_timeout=30,
    )


async def close_pool() -> None:
    global _pool
    if _pool:
        await _pool.close()
        _pool = None


@asynccontextmanager
async def get_db() -> AsyncGenerator[asyncpg.Connection, None]:
    if _pool is None:
        raise RuntimeError("Database pool not initialised")
    async with _pool.acquire() as conn:
        yield conn

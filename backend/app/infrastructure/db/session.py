"""Async SQLAlchemy engine and session factory."""

from __future__ import annotations

import os
import ssl
from collections.abc import AsyncGenerator

from sqlalchemy import text
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import Settings

_engine: AsyncEngine | None = None
_session_factory: async_sessionmaker[AsyncSession] | None = None


def _asyncpg_connect_args(database_url: str) -> dict:
    """
    Railway public TCP proxy (*.proxy.rlwy.net) presents a cert chain that
    fails default verification. Internal Docker / Railway private hosts skip SSL.
    Opt-in: DATABASE_SSL=1|require|true.
    """
    flag = (os.getenv("DATABASE_SSL") or "").strip().lower()
    force = flag in {"1", "true", "yes", "on", "require"}
    public_proxy = "proxy.rlwy.net" in database_url
    if not force and not public_proxy:
        return {}
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    return {"ssl": ctx}


def init_db(settings: Settings) -> AsyncEngine:
    global _engine, _session_factory

    connect_args = _asyncpg_connect_args(settings.database_url)
    _engine = create_async_engine(
        settings.database_url,
        echo=settings.app_debug,
        pool_pre_ping=True,
        connect_args=connect_args,
    )
    _session_factory = async_sessionmaker(
        bind=_engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False,
    )
    return _engine


async def close_db() -> None:
    global _engine, _session_factory
    if _engine is not None:
        await _engine.dispose()
    _engine = None
    _session_factory = None


def get_engine() -> AsyncEngine:
    if _engine is None:
        raise RuntimeError("Database engine is not initialized")
    return _engine


def get_session_factory() -> async_sessionmaker[AsyncSession]:
    if _session_factory is None:
        raise RuntimeError("Database session factory is not initialized")
    return _session_factory


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    factory = get_session_factory()
    async with factory() as session:
        yield session


async def ping_database() -> bool:
    engine = get_engine()
    async with engine.connect() as conn:
        await conn.execute(text("SELECT 1"))
    return True

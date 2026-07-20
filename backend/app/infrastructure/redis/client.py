"""Async Redis client lifecycle."""

from redis.asyncio import Redis

from app.core.config import Settings

_redis: Redis | None = None


async def init_redis(settings: Settings) -> Redis:
    global _redis
    _redis = Redis.from_url(
        settings.redis_url,
        encoding="utf-8",
        decode_responses=True,
    )
    return _redis


async def close_redis() -> None:
    global _redis
    if _redis is not None:
        await _redis.aclose()
    _redis = None


def get_redis() -> Redis:
    if _redis is None:
        raise RuntimeError("Redis client is not initialized")
    return _redis


async def ping_redis() -> bool:
    client = get_redis()
    return bool(await client.ping())

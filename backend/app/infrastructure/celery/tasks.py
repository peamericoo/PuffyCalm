"""Celery tasks — smoke tests and future background jobs."""

from app.infrastructure.celery.app import celery_app


@celery_app.task(name="app.ping")
def ping() -> str:
    """Smoke-test task used by Docker Compose verification."""
    return "pong"

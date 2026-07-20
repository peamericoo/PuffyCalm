"""SQLAlchemy declarative base for domain models (Phase 2)."""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Base class for all ORM models."""

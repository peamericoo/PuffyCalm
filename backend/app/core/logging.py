"""Structured logging setup (structlog → stdlib).

Phase O: checkout/webhook paths emit JSON fields (prod) with order_id / event_id.
Never log card data, full PAN, CVV, or full shipping address.
"""

from __future__ import annotations

import logging
import sys

import structlog

from app.core.config import Settings


def setup_logging(settings: Settings) -> None:
    level = logging.DEBUG if settings.app_debug else logging.INFO

    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=level,
    )

    shared_processors: list[structlog.types.Processor] = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
    ]

    if settings.is_development:
        renderer: structlog.types.Processor = structlog.dev.ConsoleRenderer()
    else:
        renderer = structlog.processors.JSONRenderer()

    structlog.configure(
        processors=[
            *shared_processors,
            structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
        ],
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )

    formatter = structlog.stdlib.ProcessorFormatter(
        processors=[
            structlog.stdlib.ProcessorFormatter.remove_processors_meta,
            renderer,
        ],
    )

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)

    root = logging.getLogger()
    root.handlers.clear()
    root.addHandler(handler)
    root.setLevel(level)

    # Quiet noisy libraries
    logging.getLogger("uvicorn.access").setLevel(logging.INFO)
    logging.getLogger("sqlalchemy.engine").setLevel(
        logging.INFO if settings.app_debug else logging.WARNING
    )


def get_logger(name: str | None = None) -> structlog.stdlib.BoundLogger:
    return structlog.get_logger(name)


def email_domain(email: str | None) -> str:
    """Safe log field: domain only (no local-part / PII)."""
    raw = (email or "").strip().lower()
    if "@" not in raw:
        return ""
    return raw.rsplit("@", 1)[-1]


def redact_email(email: str | None) -> str:
    """
    Redacted email for logs: first char of local-part + ***@domain.

    Prefer ``email_domain`` when the local-part is unnecessary.
    """
    raw = (email or "").strip().lower()
    if "@" not in raw:
        return ""
    local, domain = raw.rsplit("@", 1)
    if not local:
        return f"***@{domain}"
    return f"{local[0]}***@{domain}"

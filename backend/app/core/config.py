"""Application settings loaded from environment variables."""

from functools import lru_cache

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "PuffyCalm API"
    app_env: str = "development"
    app_debug: bool = True
    app_version: str = "0.1.0"
    api_v1_prefix: str = "/api/v1"
    secret_key: str = Field(
        default="change-me-in-production-min-32-chars!!",
        min_length=16,
    )

    # Comma-separated origins, e.g. "http://localhost:3000,http://127.0.0.1:3000"
    cors_origins: str = "http://localhost:3000"

    database_url: str = (
        "postgresql+asyncpg://puffycalm:puffycalm_dev@localhost:5432/puffycalm"
    )
    # Sync URL for Alembic (asyncpg → psycopg not required if we use async URL rewrite)
    database_url_sync: str | None = None

    redis_url: str = "redis://localhost:6379/0"
    celery_broker_url: str = "redis://localhost:6379/1"
    celery_result_backend: str = "redis://localhost:6379/2"

    # --- Auth (Phase 4) ---
    # Prefer HttpOnly cookies for browser admin; Bearer still accepted for scripts.
    jwt_algorithm: str = "HS256"
    access_token_minutes: int = 15
    refresh_token_days: int = 7
    cookie_access_name: str = "pc_access"
    cookie_refresh_name: str = "pc_refresh"
    # Secure cookies only outside local HTTP dev
    cookie_secure: bool | None = None  # None = auto from app_env
    cookie_samesite: str = "lax"  # lax | strict | none
    cookie_domain: str | None = None  # None = host-only (best for localhost)

    # Bootstrap admin (seeded if missing). Password login remains for scripts/dev.
    admin_email: str = "paletot.business@gmail.com"
    admin_password: str = "changeme-admin-dev"
    admin_full_name: str = "PuffyCalm Admin"
    # Optional second staff user for RBAC tests
    staff_email: str = "staff@puffycalm.com"
    staff_password: str = "changeme-staff-dev"
    staff_full_name: str = "PuffyCalm Staff"

    # --- Admin Google bridge (Phase E / E1) ---
    # Comma-separated allowlists for POST /auth/google-exchange → JWT cookies.
    # If ADMIN_EMAILS is empty, falls back to ADMIN_EMAIL (single).
    admin_emails: str = ""
    # Extra staff emails for Google bridge (optional). Seed STAFF_EMAIL also allowed.
    staff_emails: str = ""
    # Google OAuth Web client ID (audience for ID token). Same value as AUTH_GOOGLE_ID on web.
    google_client_id: str = ""

    # --- Stripe (Phase 6) — secret never leaves the API process ---
    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""
    # Pin when upgrading; empty = SDK default
    # Required >= 2025-03-31.basil for Checkout Session ui_mode=custom
    stripe_api_version: str = "2025-03-31.basil"
    # Public storefront URL for return_url (no trailing slash)
    storefront_url: str = "http://localhost:3000"
    # Free shipping threshold / flat rate (USD cents) — server source of truth
    free_shipping_threshold_cents: int = 7500
    flat_shipping_cents: int = 699

    # --- Media / object storage (Phase I) — Railway S3-compatible bucket ---
    # Prefer Railway bucket credentials (never commit secrets).
    # When S3_BUCKET + keys set → S3 backend; else local filesystem (dev/test).
    s3_endpoint_url: str = ""
    s3_bucket: str = ""
    s3_access_key_id: str = ""
    s3_secret_access_key: str = ""
    s3_region: str = "auto"
    # Public URL base stored in product_images (API media proxy). Trailing slash optional.
    # Railway buckets are private — do NOT use the raw storage endpoint as public base.
    # Example prod: https://api-production-4f01.up.railway.app/media
    s3_public_base_url: str = ""
    # Max upload size in bytes (default 5 MiB)
    media_max_bytes: int = 5 * 1024 * 1024
    # Local fallback root (dev/test when S3 not configured)
    media_local_dir: str = "uploads"
    # Public base for local files when served by API (no trailing slash)
    # e.g. http://localhost:8000/media
    media_local_public_base_url: str = "http://localhost:8000/media"

    @field_validator("app_debug", mode="before")
    @classmethod
    def parse_bool(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip().lower() in {"1", "true", "yes", "on"}
        return value

    @property
    def s3_configured(self) -> bool:
        return bool(
            self.s3_bucket.strip()
            and self.s3_access_key_id.strip()
            and self.s3_secret_access_key.strip()
            and self.s3_endpoint_url.strip()
        )

    def resolved_s3_public_base_url(self) -> str:
        """
        Public URL base for stored objects (served via GET /media proxy).

        Prefer S3_PUBLIC_BASE_URL. Fallback: {storefront is wrong} —
        use MEDIA_LOCAL-style path on API when only endpoint known is not enough.
        """
        if self.s3_public_base_url.strip():
            return self.s3_public_base_url.strip().rstrip("/")
        # Dev default when S3 configured but public base forgotten: local media path
        if self.media_local_public_base_url.strip():
            return self.media_local_public_base_url.strip().rstrip("/")
        return ""

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def is_development(self) -> bool:
        return self.app_env.lower() in {"development", "dev", "local"}

    @property
    def stripe_configured(self) -> bool:
        return bool(self.stripe_secret_key.strip())

    @property
    def cookies_secure(self) -> bool:
        if self.cookie_secure is not None:
            return self.cookie_secure
        return not self.is_development

    @staticmethod
    def _split_emails(raw: str) -> frozenset[str]:
        return frozenset(
            e.strip().lower() for e in (raw or "").split(",") if e.strip()
        )

    @property
    def admin_email_set(self) -> frozenset[str]:
        """Emails allowed as role=admin via Google bridge (and seed primary)."""
        parsed = self._split_emails(self.admin_emails)
        if parsed:
            return parsed
        single = (self.admin_email or "").strip().lower()
        return frozenset({single}) if single else frozenset()

    @property
    def staff_email_set(self) -> frozenset[str]:
        """Emails allowed as role=staff via Google bridge (excludes admin set)."""
        parsed = set(self._split_emails(self.staff_emails))
        seed = (self.staff_email or "").strip().lower()
        if seed:
            parsed.add(seed)
        # Never treat an admin email as staff-only
        return frozenset(parsed - set(self.admin_email_set))

    def role_for_google_email(self, email: str) -> str | None:
        """Return admin|staff if email is allowlisted; else None (not authorized)."""
        e = (email or "").strip().lower()
        if not e:
            return None
        if e in self.admin_email_set:
            return "admin"
        if e in self.staff_email_set:
            return "staff"
        return None

    def alembic_database_url(self) -> str:
        """Alembic prefers a sync driver; map asyncpg → psycopg (v3) if needed."""
        if self.database_url_sync:
            return self.database_url_sync
        url = self.database_url
        if url.startswith("postgresql+asyncpg://"):
            # Alembic env uses create_async_engine for online migrations in our setup,
            # but offline/default scripts may need a plain postgresql:// form.
            return url.replace("postgresql+asyncpg://", "postgresql://", 1)
        return url


@lru_cache
def get_settings() -> Settings:
    return Settings()

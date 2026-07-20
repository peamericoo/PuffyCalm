# PuffyCalm Backend

FastAPI backend for **PuffyCalm / PuffyEasy** — Clean Architecture with Postgres, Redis, Celery, and Nginx gateway.

> **Phase 4:** Admin **JWT + RBAC** with **HttpOnly cookies** (preferred for browser) + optional Bearer. Catalog read API is Phase 3.

## Stack

| Layer | Tech |
|-------|------|
| API | FastAPI + Uvicorn |
| DB | PostgreSQL 16 + SQLAlchemy 2 (async) + Alembic |
| Cache / broker | Redis 7 |
| Workers | Celery |
| Gateway | Nginx (rate limit + reverse proxy) |

## Layout

```text
backend/
  app/
    api/v1/           # HTTP routers + Pydantic schemas (camelCase)
    application/      # catalog + reviews use cases
    domain/           # entities
    infrastructure/   # DB models, seed, Redis, Celery
    core/             # config, logging, security
    main.py
  alembic/
  tests/
  Dockerfile
  pyproject.toml
```

## Quick start (Docker — recommended)

From the **monorepo root** (`PuffCalm/`):

```bash
cp .env.example .env
docker compose up --build -d
```

### Verify

```bash
# Liveness
curl -sS http://localhost:8000/health | jq
curl -sS http://localhost:8080/health | jq

# Readiness (Postgres + Redis)
curl -sS http://localhost:8080/ready | jq

# API meta
curl -sS http://localhost:8080/api/v1/ | jq

# OpenAPI docs
open http://localhost:8000/docs
# or via gateway:
open http://localhost:8080/docs
```

### Celery smoke

```bash
docker compose exec api python -c \
  "from app.infrastructure.celery.tasks import ping; print(ping.delay().get(timeout=15))"
# → pong
```

### Tests

```bash
docker compose exec -e REQUIRE_READY=1 api pytest -q
```

### Stop

```bash
docker compose down
# wipe DB/Redis volumes:
docker compose down -v
```

## Migrations & seed (Phase 2)

```bash
# Apply migrations
docker compose exec api alembic upgrade head

# Seed 4 categories + 8 products + reviews + admin/staff users (idempotent)
docker compose exec api python -m app.infrastructure.db.seed
# wipe then seed:
docker compose exec api python -m app.infrastructure.db.seed --reset
# only admin users:
docker compose exec api python -m app.infrastructure.db.seed --users-only

# New migration after model changes
docker compose exec api alembic revision --autogenerate -m "message"
docker compose exec api alembic upgrade head
```

Tables: `categories`, `products`, `product_categories`, `product_images`, `product_specs`, `reviews`, `users`.

## Catalog API (Phase 3)

All responses use **camelCase** (`imageUrl`, `categorySlugs`, `pageSize`, …) to match the storefront TypeScript contracts.

| Method | Path | Notes |
|--------|------|--------|
| GET | `/api/v1/catalog` | Query: `categorySlug`, `sort`, `stock`, `types`, `sale` → `CatalogPage` |
| GET | `/api/v1/categories` | List (incl. virtual `all` + `productCount`) |
| GET | `/api/v1/categories/{slug}` | 404 if missing |
| GET | `/api/v1/products/{slug}?related=4` | PDP + optional related |
| GET | `/api/v1/products/{id}/reviews` | Paginated reviews (`page`, `pageSize`, `sort`, `tag`) |
| GET | `/api/v1/search?q=&limit=` | Header autocomplete |

### Example curls (gateway :8080)

```bash
# Catalog — recovery collection
curl -sS 'http://localhost:8080/api/v1/catalog?categorySlug=recovery' | jq '.category.slug, .total, .facets'

# Catalog — sale only, sort by price
curl -sS 'http://localhost:8080/api/v1/catalog?categorySlug=all&sale=true&sort=price-asc' | jq '.products[].name'

# Categories
curl -sS http://localhost:8080/api/v1/categories | jq '.[].slug'

# Product PDP + related
curl -sS 'http://localhost:8080/api/v1/products/shiatsu-neck-shoulder-massager?related=4' \
  | jq '{id: .product.id, images: (.product.images|length), related: (.related|length)}'

# Reviews page 1
curl -sS 'http://localhost:8080/api/v1/products/prod_001/reviews?page=1&pageSize=4&sort=featured' \
  | jq '{page, totalItems, hasNext, avg: .summary.average}'

# Search
curl -sS 'http://localhost:8080/api/v1/search?q=massager&limit=6' | jq '.items[].name'
```

OpenAPI: http://localhost:8000/docs

## Auth API (Phase 4) — cookies first

**Why cookies?** For the Next.js **admin** in the browser, **HttpOnly** cookies are better than `localStorage` JWTs: JS cannot read the token (reduces XSS theft). Refresh stays on `/api/v1/auth/*` only. CORS already uses `allow_credentials=True` — the FE must call `fetch(url, { credentials: "include" })`.

| Channel | Use |
|---------|-----|
| `pc_access` cookie (HttpOnly) | Primary for browser admin |
| `pc_refresh` cookie (HttpOnly, path `/api/v1/auth`) | Rotation + logout |
| `Authorization: Bearer` | Optional for curl/scripts; login also returns `accessToken` in JSON |

| Method | Path | Notes |
|--------|------|--------|
| POST | `/api/v1/auth/login` | body `{email,password}` → cookies + user |
| POST | `/api/v1/auth/refresh` | needs refresh cookie |
| POST | `/api/v1/auth/logout` | revoke refresh jti in Redis, clear cookies |
| GET | `/api/v1/auth/me` | cookie or Bearer |
| GET | `/api/v1/admin/ping` | roles `admin` \| `staff` |
| GET | `/api/v1/admin/only-admin` | role `admin` only |

Roles: `admin`, `staff`. Default seed (change in prod):

- `admin@puffycalm.com` / `changeme-admin-dev`
- `staff@puffycalm.com` / `changeme-staff-dev`

### Cookie login curl

```bash
# Login (saves cookies to jar)
curl -sS -c /tmp/pc.txt -b /tmp/pc.txt \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@puffycalm.com","password":"changeme-admin-dev"}' \
  http://localhost:8080/api/v1/auth/login | jq '.user'

# Session via cookie
curl -sS -b /tmp/pc.txt http://localhost:8080/api/v1/auth/me | jq
curl -sS -b /tmp/pc.txt http://localhost:8080/api/v1/admin/ping | jq

# Refresh + logout
curl -sS -c /tmp/pc.txt -b /tmp/pc.txt -X POST http://localhost:8080/api/v1/auth/refresh | jq '.user.role'
curl -sS -c /tmp/pc.txt -b /tmp/pc.txt -X POST http://localhost:8080/api/v1/auth/logout | jq

# Bearer alternative (from login JSON accessToken)
TOKEN=...  # paste accessToken
curl -sS -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/v1/auth/me | jq
```

## Local (without Docker)

Requires Python 3.12+, Postgres, and Redis running.

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"

export DATABASE_URL=postgresql+asyncpg://puffycalm:puffycalm_dev@localhost:5432/puffycalm
export REDIS_URL=redis://localhost:6379/0
export CELERY_BROKER_URL=redis://localhost:6379/1
export CELERY_RESULT_BACKEND=redis://localhost:6379/2

uvicorn app.main:app --reload --port 8000
# other terminal:
celery -A app.infrastructure.celery.app.celery_app worker -l INFO
```

## Roadmap

| Phase | Focus |
|-------|--------|
| 1 | Scaffold + Compose ✅ |
| 2 | Domain models + seed (8 products) ✅ |
| 3 | Catalog / reviews API ✅ |
| **4** | Admin JWT + RBAC (HttpOnly cookies) ✅ |
| **5** | Orders + checkout sessions (server prices) ✅ |
| **6** | Stripe Checkout Session (`ui_mode=custom`) + webhooks ✅ |
| 7 | WebSockets live sales |
| 8–9 | Admin UI + FE Payment Element + mock removal |

### Checkout / Stripe (Phase 5–6)

| Method | Path | Notes |
|--------|------|--------|
| `POST` | `/api/v1/checkout/sessions` | Guest; body: email, lines[{productId, quantity}], shipping |
| `GET` | `/api/v1/orders/{id}?email=` | Guest privacy via email match |
| `POST` | `/api/v1/webhooks/stripe` | Raw body; `STRIPE_WEBHOOK_SECRET` |

Env (API only for secret): `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STOREFRONT_URL`.

Local webhook:

```bash
stripe listen --forward-to localhost:8080/api/v1/webhooks/stripe
# copy whsec_… into .env as STRIPE_WEBHOOK_SECRET
```

## Frontend

Next.js storefront stays on `npm run dev` (port 3000) with mocks until Phase 9.  
Optional: `NEXT_PUBLIC_API_URL=http://localhost:8080`.

# PuffyCalm (repo: PuffyCalm)

Premium storefront for **PuffyCalm / PuffyEasy** — products that make everyday life better.

## Stack

| Layer | Tech |
|-------|------|
| Storefront | Next.js (App Router) + React 19 + TypeScript + Tailwind CSS v4 |
| Backend | **FastAPI** (Python 3.12) in `/backend` |
| DB / cache | PostgreSQL 16 + Redis 7 |
| Workers | Celery |
| Gateway (local) | Nginx |
| Data (current) | Mock fixtures in `src/lib/mock` until API migration |

Stable frontend mock tag: **`v1.0-frontend-mock-complete`**

## Develop — frontend

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Develop — backend (Docker)

```bash
cp .env.example .env
docker compose up --build -d
```

| Endpoint | URL |
|----------|-----|
| Health | http://localhost:8080/health |
| Ready | http://localhost:8080/ready |
| API v1 | http://localhost:8080/api/v1/ |
| Docs | http://localhost:8000/docs |

Full backend docs: [`backend/README.md`](./backend/README.md)

## Current focus

1. ~~Frontend mock complete~~ (`v1.0-frontend-mock-complete`)
2. ~~Backend scaffold~~ (Phase 1) — Compose + health
3. ~~Domain models + seed~~ (Phase 2) — 8 products in Postgres
4. Catalog / reviews API (Phase 3)
5. Admin JWT + live sales dashboard
6. Remove mocks and wire storefront to API

See `AGENTS.md` for brand, stack, credentials, and folder conventions.

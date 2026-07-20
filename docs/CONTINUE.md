# CONTINUE — Handoff para agentes (compact / nova sessão)

> **Use este arquivo** após compactar o chat, em `/new`, ou quando o contexto estiver cheio.  
> Cole o bloco **PROMPT DE RETOMADA** no início da mensagem + diga o que fazer (ex.: “fase 3”).

---

## PROMPT DE RETOMADA (copiar e colar)

```text
Projeto: PuffyCalm / PuffyEasy (repo peamericoo/PuffyCalm)
Workdir: /Users/paletotcode/Documents/Projects/PuffCalm

Leia docs/CONTINUE.md e AGENTS.md §4 (stack). NÃO recomeçar o backend do zero.

ESTADO ATUAL (já feito):
- Tag estável mock FE: v1.0-frontend-mock-complete → commit 0f3e8be
- Etapa 1 commit: 67237eb — FastAPI scaffold + Docker Compose (postgres, redis, api, worker, nginx)
- Fase 2 commit: 6540c1e — models SQLAlchemy + Alembic d0f5da7772b5 + seed (4 cats, 8 products, 96 reviews)
- Fase 3 commit: catalog/reviews read API (camelCase)
- Fase 4: admin JWT+RBAC com **HttpOnly cookies** (pc_access/pc_refresh) + Bearer opcional; roles admin/staff; refresh jti no Redis; migration users a1b2c3d4e5f6
- Stack BE: Python 3.12, FastAPI, SQLAlchemy async, Alembic, Redis, Celery, Nginx gateway :8080
- FE: Next.js 16 mock em src/ — AINDA usa src/lib/mock (não migrar até Fase 9)
- Admin UI: será Next.js app/admin consumindo API com credentials:include (não Django Admin)
- Auth admin BE: cookies HttpOnly JWT; storefront: Auth.js Google OAuth (client PuffyCalm Web)
- Admin Google: paletot.business@gmail.com → role admin; guest checkout intacto

OBJETIVO FINAL:
Backend real + painel admin com operação/vendas ao vivo + storefront sem mock,
integrado a Postgres/Redis, Celery, pagamentos (Stripe/PayPal), guest checkout.
MVP vendável dropshipping PuffyEasy (US/UK/AU/CA), copy em inglês.

ROADMAP:
0–4 ✅ tag, scaffold, seed, catalog API, JWT+RBAC cookies
5 ✅ orders + checkout session create (server prices)
6 ✅ Stripe Checkout Session (ui_mode=custom) + webhooks + order GET
7 WebSockets vendas ao vivo  ← AGORA (opcional)
8 Admin UI Next
9 FE Payment Element + success poll order  ← próximo storefront
10 observabilidade (Prometheus/Grafana opcional)

FASE 4 (concluída):
POST /auth/login|refresh|logout, GET /auth/me, GET /admin/ping|only-admin
— cookies HttpOnly + optional Bearer; seed admin@ / staff@

FASES 5–6 (concluídas no BE):
POST /api/v1/checkout/sessions — guest, productId+qty only; Stripe Session custom
GET  /api/v1/orders/{id}?email= — guest lookup
POST /api/v1/webhooks/stripe — signature + idempotent stripe_events
Migration e7f8a9b0c1d2 (orders, order_items, stripe_events)
Env: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STOREFRONT_URL
FE: Payment Element no step 3 + poll GET order no success (dumb FE)

Comandos úteis:
  docker compose up -d --build
  docker compose exec api alembic upgrade head
  docker compose exec api python -m app.infrastructure.db.seed
  docker compose exec -e REQUIRE_DB=1 api pytest -q tests/test_checkout_*.py
  stripe listen --forward-to localhost:8080/api/v1/webhooks/stripe
  curl -s -X POST http://localhost:8080/api/v1/checkout/sessions \
    -H 'Content-Type: application/json' \
    -d '{"email":"buyer@example.com","lines":[{"productId":"prod_001","quantity":1}],"shipping":{"fullName":"A","line1":"1 St","city":"SF","region":"CA","postal":"94105","country":"US"}}'

Próxima ação: FE Payment Element (dumb) + poll order paid; ou Fase 7/8.
```

---

## 1. Objetivo final (não perder de vista)

Construir o **backend completo** do e-commerce **PuffyEasy** (repo/ops: PuffyCalm) e **substituir o mock do frontend** por integração real, com:

| Meta | Detalhe |
|------|---------|
| Backend | `/backend` FastAPI, Clean Architecture, Postgres, Redis, Celery |
| Gateway | Nginx local (rate limit); prod Railway |
| Admin | Painel poderoso no **Next.js** (`app/admin`) + API; **vendas em tempo real** (WebSockets + Redis) |
| Auth | Admin: JWT + refresh + RBAC; Storefront: guest checkout obrigatório (+ Auth.js/Google depois) |
| Pagamentos | Stripe (+ PayPal), webhooks |
| FE | Remover `src/lib/mock` de domínio; services (`catalog`, `reviews`, product) apontam para API |
| Negócio | Dropshipping MVP, 8 produtos seed, mercados EN, primeiras vendas |

**Não é** “reescrever o frontend do zero”. O mock FE já está completo e estável na tag acima.

---

## 2. Estado do repositório (checkpoint)

| Item | Valor |
|------|--------|
| Workdir | `/Users/paletotcode/Documents/Projects/PuffCalm` |
| Branch | `main` (pode estar ahead do origin — commits locais) |
| Tag rollback FE | `v1.0-frontend-mock-complete` @ `0f3e8be` |
| Commit Etapa 1 | `67237eb` — scaffold Compose + health |
| Commit Fase 2 | `6540c1e` — models + migration + seed |
| Commit Fase 3 | catalog/reviews API |
| Commit Fase 4 | JWT+RBAC cookies (ver `git log --oneline -5`) |
| Migrations | `d0f5da7772b5` catalog · `a1b2c3d4e5f6` users |
| Seed | catalog + `admin@puffycalm.com` / `staff@puffycalm.com` (dev passwords) |

### Serviços locais

```bash
docker compose up -d
# API :8000  |  Gateway :8080  |  Postgres :5432  |  Redis :6379  |  Celery worker
curl -s http://localhost:8080/health
curl -s http://localhost:8080/ready   # postgres+redis
```

### Layout backend

```text
backend/app/
  api/v1/              # health, catalog, products, reviews, search + schemas/
  application/
    catalog/           # get_catalog_page, product, search, filter_sort, mappers
    reviews/           # get_product_reviews_page
  domain/              # ProductEntity, CategoryEntity
  infrastructure/
    db/models/         # Category, Product, ProductImage, ProductSpec, Review
    db/seed.py         # python -m app.infrastructure.db.seed [--reset]
    db/seed_data.py    # fixtures = mock FE
    redis/ celery/
  core/                # config, logging, security stub
  main.py
```

### Tabelas Postgres

- `categories` — `is_virtual=true` só em `slug=all`
- `products` — ids `prod_001`…`prod_008`, JSONB `badges`/`features`
- `product_categories` — M2M **sem** categoria `all`
- `product_images`, `product_specs`, `reviews`

---

## 3. Contratos do frontend (fonte da verdade da API)

| Contract | Path FE |
|----------|---------|
| `Product`, `Category` | `src/types/product.ts` |
| `CatalogQuery`, `CatalogPage`, `CatalogFacets`, sorts | `src/lib/catalog/types.ts` |
| `filterProducts`, `buildFacets` | `src/lib/catalog/filter.ts` |
| `sortProducts` | `src/lib/catalog/sort.ts` |
| `ReviewsQuery`, `ReviewsPage`, `ProductReview` | `src/types/review.ts` |
| Facades atuais (ainda mock) | `src/lib/catalog/service.ts`, `src/lib/reviews/service.ts` |
| Mock data (só referência / seed) | `src/lib/mock/*` |

**Imports mock no FE (não tocar até Fase 9):** product page, home, header, search-overlay, catalog/reviews services, etc.

**Cart/wishlist:** Zustand client-side — ok até checkout server (Fase 5).

---

## 4. Decisões já tomadas (não reabrir sem pedido)

1. **FastAPI em `/backend`**, não Drizzle-only no Next (`AGENTS.md` §4.3 atualizado).
2. **Admin UI = Next.js**, API = FastAPI.
3. **Compose local** para dev; Railway Postgres/Redis já existem para prod depois.
4. **Gateway Nginx** porta 8080.
5. **Etapas numeradas** — nunca “backend completo de uma vez”.
6. **IDs do seed = IDs do mock** (`prod_001`, `cat_recovery`) para migração suave.
7. Categoria **`all` é virtual** no DB.

---

## 5. Fase 3 — especificação operacional

### Objetivo da fase

API HTTP de **leitura** do catálogo e reviews, consumível pelo FE depois, com shapes compatíveis com TypeScript atual.

### Endpoints (mínimo)

| Method | Path | Notas |
|--------|------|--------|
| GET | `/api/v1/catalog` | Query: `categorySlug`, `sort`, `stock`, `types`, `sale` → shape `CatalogPage` |
| GET | `/api/v1/categories` | Lista (incl. virtual all; `productCount` calculado) |
| GET | `/api/v1/categories/{slug}` | 404 se não existir |
| GET | `/api/v1/products/{slug}` | PDP + opcional `?related=4` |
| GET | `/api/v1/products/by-id/{id}/reviews` ou `/api/v1/products/{id}/reviews` | Paginação server-side |
| GET | `/api/v1/search?q=&limit=` | Autocomplete header |

### Implementação sugerida

```text
backend/app/application/catalog/     # get_catalog_page, get_product_by_slug, search
backend/app/application/reviews/     # get_product_reviews_page
backend/app/api/v1/catalog.py
backend/app/api/v1/products.py
backend/app/api/v1/reviews.py
backend/app/api/v1/search.py
backend/app/api/v1/schemas/          # Pydantic = espelho FE (camelCase via alias se necessário)
```

**JSON:** preferir **camelCase** nos responses se o FE espera `imageUrl`, `categorySlugs`, etc. (Pydantic `serialization_alias` / `model_config populate_by_name`). Alternativa documentada: snake_case + adapter no FE na Fase 9 — **preferir camelCase na API** para menos atrito.

### Critérios de aceite Fase 3

- [x] Endpoints respondem 200 com seed
- [x] `GET /catalog?categorySlug=recovery` filtra e monta facets
- [x] `GET /products/shiatsu-neck-shoulder-massager` retorna galeria + specs
- [x] Reviews paginadas (`page`, `pageSize`, `hasNext`, `summary`)
- [x] Search retorna subset por nome/features
- [x] pytest cobre happy path + 404
- [x] `backend/README.md` com curls
- [x] Commit `feat(backend): catalog and reviews API (phase 3)`
- [x] FE mock **intocado**

### Fora da Fase 3

JWT, RBAC, orders, cart server, Stripe, WebSockets, admin UI, delete de `src/lib/mock`, TanStack Query no FE.

---

## 6. Fases seguintes (resumo para não “esquecer o final”)

| Fase | Entrega |
|------|---------|
| 4 | Admin JWT + refresh + roles (`admin`, `staff`, …) |
| 5 | Orders + checkout server (validar preço/estoque; guest email) |
| 6 | Stripe PaymentIntent + webhooks → status `paid` |
| 7 | WebSocket `/ws/admin/live` + Redis pub/sub em nova venda |
| 8 | Next `app/admin` dashboard (pedidos, produtos, live feed) |
| 9 | Trocar `lib/catalog/service` e `lib/reviews/service` + product loaders para `fetch` API; banir import mock em UI; search async |
| 10 | Métricas básicas (opcional Prometheus/Grafana) |

---

## 7. Comandos de recuperação / smoke

```bash
cd /Users/paletotcode/Documents/Projects/PuffCalm

# Voltar ao mock FE se algo explodir
git checkout v1.0-frontend-mock-complete

# Stack BE
cp .env.example .env   # se necessário
docker compose up --build -d
docker compose exec api alembic upgrade head
docker compose exec api python -m app.infrastructure.db.seed --reset
docker compose exec -e REQUIRE_READY=1 api pytest -q

# Docs API
open http://localhost:8000/docs
```

---

## 8. Segurança

- Não commitar `.env` (senhas dev locais).
- Não copiar secrets do `AGENTS.md` (Railway) para o repo em texto novo.
- `SECRET_KEY` dev só local; JWT real na Fase 4.

---

## 9. Como o humano deve compactar

1. Abrir este arquivo: `docs/CONTINUE.md`
2. Compactar / nova sessão no Grok
3. Colar o **PROMPT DE RETOMADA** (secção no topo)
4. Acrescentar: `Implemente a Fase 5 (orders+checkout), teste e commite.`

O agente deve **ler este arquivo** e continuar sem re-scaffolding / sem refazer fases 1–4.

### Auth admin (decisão Fase 4)

- **Preferir cookies HttpOnly** (`pc_access`, `pc_refresh`) para o browser admin — melhor que localStorage contra XSS.
- Bearer opcional (curl/scripts); login devolve `accessToken` no JSON também.
- FE futuro: `fetch(API, { credentials: "include" })` + CORS origins já configurados.
- Refresh jti allowlist no Redis; logout revoga.

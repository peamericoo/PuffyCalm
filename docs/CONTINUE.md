# CONTINUE — Handoff para agentes (compact / nova sessão)

> **Use este arquivo** após compactar o chat, em `/new`, ou quando o contexto estiver cheio.  
> Cole o bloco **PROMPT DE RETOMADA** no início da mensagem + diga o que fazer (ex.: “execute Fase B”).
>
> **Roadmap canônico (auditoria 2026-07-21):** [`docs/ECOMMERCE_MASTER_PLAN.md`](./ECOMMERCE_MASTER_PLAN.md)  
> **Prompts copy-paste por fase (sessões descartáveis):** [`docs/PHASE_PROMPTS.md`](./PHASE_PROMPTS.md)  
> **Status entre IAs:** [`docs/phases/STATUS.md`](./phases/STATUS.md)  
> **Contratos congelados + env:** [`docs/ops/CONTRACTS.md`](./ops/CONTRACTS.md) · [`docs/ops/ENV_CHECKLIST.md`](./ops/ENV_CHECKLIST.md)  
> As fases antigas 7–10 foram **substituídas** pelas fases **A–P** do master plan.  
> **Só Frontend (craft/polish)?** Use **`/compact-fe`** ou `docs/FRONTEND_CRAFT.md`  
> (persona **CalmCraft** — não reabre backend).

---

## PROMPT DE RETOMADA (copiar e colar)

```text
Projeto: PuffyCalm / PuffyEasy (repo peamericoo/PuffyCalm)
Workdir Windows: C:\Users\pedro.torres\Projects\PuffyCalm

Leia docs/ECOMMERCE_MASTER_PLAN.md + docs/CONTINUE.md + docs/phases/STATUS.md + AGENTS.md §4.
Leia docs/ops/CONTRACTS.md + docs/ops/ENV_CHECKLIST.md + PHASE_E_COMPLETE.md.
NÃO recomeçar o backend do zero. NÃO recriar o checkout Stripe.

ESTADO ATUAL (2026-07-21, pós Fase J):
- Fase A–I DONE — contratos, catalog/reviews/search, money, admin, orders, products, media
- Fase J DONE — CMS-lite home: promo ticker + hero slides (content_blocks);
  ver PHASE_J_COMPLETE.md · admin /admin/content · GET /api/v1/content/home
- Prod Railway: migration content_blocks aplicada; redeploy **api + web** para código J
- BE: catalog + products + media + **home content REAL**
- FE: home/promo consomem API; revalidate tags `home`/`content`
- Guest checkout sagrado
- Owner: ADMIN_EMAILS + GOOGLE_CLIENT_ID + COOKIE_SAMESITE=none no api (Fase E)
- Rollback storefront data: NEXT_PUBLIC_USE_API_CATALOG=0 (rebuild web)

ROADMAP (master plan A–P):
  A ✅ → B ✅ → C ✅ → D ✅ → E ✅ → F ✅ → G ✅ → H ✅ → I ✅ → J CMS-lite ✅
  K account orders → L inventory → M remove mocks → N legal → O obs → P go-live

Próxima ação: execute Fase K (account orders) ou L (inventory). Uma fase por vez.

Stripe contract (não quebrar) — ver docs/ops/CONTRACTS.md:
- Confirm SEM returnUrl no FE (return_url só no Session.create BE)
- Session create 1x por sessionKey
- GET /orders/{id}?sync=true se webhook atrasar
- Lines: productId+qty only (preço no BE)

Comandos úteis:
  docker compose up -d --build
  docker compose exec api alembic upgrade head
  docker compose exec api python -m app.infrastructure.db.seed
  docker compose exec -e REQUIRE_DB=1 api pytest -q tests/test_checkout_*.py
  stripe listen --forward-to localhost:8080/api/v1/webhooks/stripe
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

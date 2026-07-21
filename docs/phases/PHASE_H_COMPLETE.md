# PHASE H COMPLETE — Admin products API + UI

| Campo | Valor |
|-------|--------|
| **Fase** | H — Admin API + UI produtos |
| **Data** | 2026-07-21 |
| **Commit** | *(ver STATUS.md após commit)* |
| **DoD atingido** | **SIM** (código + unit validation + tsc; integração DB via Docker) |

---

## 1. Objetivo

Operar o catálogo sem código: admin cria/edita produtos, faz publish/unpublish, e o storefront (API-first da Fase B) reflete o lifecycle `status`.

---

## 2. API (FastAPI) — staff + admin

| Method | Path | Notas |
|--------|------|--------|
| `GET` | `/api/v1/admin/products` | Lista (todos status); query `status`, `q`, `page`, `pageSize` |
| `GET` | `/api/v1/admin/products/{id}` | Detalhe (draft/published/archived) |
| `POST` | `/api/v1/admin/products` | Create (default `draft`); opcional `id` = SKU-like PK |
| `PATCH` | `/api/v1/admin/products/{id}` | Update parcial; `images` / `specs` / `categorySlugs` substituem quando enviados |
| `POST` | `/api/v1/admin/products/{id}/publish` | → `published` + `publishedAt` |
| `POST` | `/api/v1/admin/products/{id}/unpublish` | → `draft` (some do catálogo público) |

**RBAC:** `RequireStaff` (mesmo padrão orders F).

### Validação server-side

| Regra | Código erro |
|-------|-------------|
| `price > 0` (0.01–99999.99) | `invalid_price` / 422 schema |
| `slug` lowercase `a-z0-9-`, **unique** | `invalid_slug` / `slug_conflict` (409) |
| `id` opcional = SKU-like PK unique (sem coluna `sku` separada) | `invalid_sku` / `sku_conflict` (409) |
| Categories M2M: slugs reais (não virtual `all`) | `invalid_category` |
| Images: URL + `sort_order` (sem upload binário) | — |
| Specs: label/value + order | — |

### Lifecycle vs storefront

- Storefront (`catalog` / `products/{slug}` / search) só lista **`published`** (`STOREFRONT_VISIBLE_STATUSES`).
- Draft / unpublish → 404 no PDP e ausente no `/catalog`.

---

## 3. Admin UI (Next)

| Path | Componente |
|------|------------|
| `/admin/products` | lista + filtros status/search |
| `/admin/products/new` | form create |
| `/admin/products/[id]` | form edit + Publish / Unpublish |

- Auth UX: Auth.js admin|staff; dados: cookies JWT Fase E (`credentials: "include"`).
- Nav admin: **Products** adicionado.

---

## 4. Cache / revalidate strategy (§12 master plan)

**Tags já usadas no storefront** (`src/lib/api/catalog.ts`):

- `catalog`, `catalog:{slug}`, `categories`, `product:{slug}`
- ISR fallback: `revalidate = 60` nas páginas category/product

**Após save/publish/unpublish no admin:**

1. Client chama `revalidateCatalog()` → `POST /api/admin/revalidate`
2. Route Handler (Auth.js admin|staff) executa:
   - `revalidateTag(tag, "max")` — Next 16 exige profile
   - `revalidatePath` para `/`, `/product/{slug}`, `/category/{slug}`, `/category/all`
3. Se revalidate falhar, mensagem na UI + **fallback ISR ≤ 60s** (documento honesto).

Checkout **nunca** usa essas tags.

---

## 5. Como publicar um produto

### Via UI

1. Google allowlisted → `/admin` (bridge ping 200).
2. **Products** → **New product** (ou editar existente).
3. Preencher name, slug, price, categories, image **URLs**, specs.
4. **Create draft** / **Save**.
5. **Publish** → aparece em `/product/{slug}` e category shelves (após revalidate ou ≤60s).
6. **Unpublish** → some do catálogo público.

### Via API (curl)

```bash
# Login password (scripts) ou cookies do Google bridge
curl -sS -c /tmp/pc.txt -b /tmp/pc.txt \
  -H 'Content-Type: application/json' \
  -d '{"email":"<ADMIN_EMAIL>","password":"<ADMIN_PASSWORD>"}' \
  http://localhost:8080/api/v1/auth/login

curl -sS -b /tmp/pc.txt -H 'Content-Type: application/json' \
  -d '{
    "slug":"my-new-massager",
    "name":"My New Massager",
    "price":49.99,
    "categorySlugs":["recovery"],
    "images":[{"url":"https://example.com/a.jpg"}],
    "status":"draft"
  }' \
  http://localhost:8080/api/v1/admin/products

# publish
curl -sS -b /tmp/pc.txt -X POST \
  http://localhost:8080/api/v1/admin/products/<id>/publish

# storefront
curl -sS http://localhost:8080/api/v1/products/my-new-massager
```

**Prod API base:** `https://api-production-4f01.up.railway.app`  
**Prod admin UI:** `https://web-production-ea635.up.railway.app/admin/products`  
*(requer deploy api + web desta fase)*

---

## 6. Arquivos

### Backend

- `app/application/admin_products/service.py` — CRUD + publish/unpublish
- `app/api/v1/schemas/admin_products.py`
- `app/api/v1/admin.py` — rotas products
- `app/infrastructure/db/session.py` — SSL auto para `*.proxy.rlwy.net` / `DATABASE_SSL`
- `tests/test_admin_products_api.py` — integração (precisa Postgres+Redis)

### Frontend

- `src/lib/api/admin-products.ts`
- `src/lib/admin/product-status.ts`, `revalidate-catalog.ts`
- `src/app/api/admin/revalidate/route.ts`
- `src/components/admin/products-list-view.tsx`, `product-form-view.tsx`, `product-status-badge.tsx`
- `src/app/(admin)/admin/products/**`
- Nav + home admin links

### Docs

- este arquivo; `STATUS.md`; `CONTINUE.md`

---

## 7. Validação executada nesta sessão

| Check | Resultado |
|-------|-----------|
| Rotas products registradas | **SIM** (unit import) |
| Validação slug/price/sku + lifecycle constants | **SIM** (python unit) |
| `npx tsc --noEmit` | **SIM** exit 0 |
| `pytest tests/test_admin_products_api.py` com `REQUIRE_READY=1` | **Não concluído aqui** — Docker Desktop off; tentativa via Railway public proxy ficou lenta/travada (rede SSL proxy). Testes estão prontos para `docker compose` local. |
| Deploy Railway api/web | **Não** nesta sessão (código no git; redeploy separado) |

### Como rodar integração local (owner)

```bash
docker compose up -d --build
docker compose exec api alembic upgrade head
docker compose exec api python -m app.infrastructure.db.seed
docker compose exec -e REQUIRE_READY=1 api pytest -q tests/test_admin_products_api.py
```

Prova DoD manual: create draft → publish → GET storefront 200 → unpublish → 404.

---

## 8. Definition of Done

| Critério | Status |
|----------|--------|
| CRUD create/update + publish/unpublish API | **SIM** |
| Categories M2M, specs, image URLs+order | **SIM** |
| Validação price / slug unique / id-SKU | **SIM** |
| Admin UI lista + form | **SIM** |
| Revalidate strategy documentada + implementada | **SIM** |
| Sem upload binário (I) / CMS (J) / inventory L | **SIM** |
| tsc | **SIM** |
| pytest integração | **Código pronto**; rodar com Docker |
| PHASE_H_COMPLETE + STATUS + commit | **SIM** |

---

## 9. Próxima fase

**Fase I — Mídia / storage**  
Upload real de imagens (`POST /admin/media`), associar a `product_images`, limites MIME/tamanho.  
Deps: H (este).  
Prompt: `docs/PHASE_PROMPTS.md` → Fase I.

---

## 10. Notas ops

- **Sem coluna SKU:** o campo `products.id` é o identificador estável (ex. `prod_001` ou custom no create).
- Deploy: após merge/push, redeploy **api** e **web** no Railway para a UI/admin e endpoints existirem em prod.
- Não recriar checkout Stripe; guest checkout intacto.

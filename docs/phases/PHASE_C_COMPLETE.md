# PHASE C COMPLETE — Reviews + Search FE → API real

| Campo | Valor |
|-------|--------|
| **Fase** | C — Reviews + Search FE → API |
| **Data** | 2026-07-21 |
| **Timezone** | America/local owner |
| **Commit** | _(stamp after commit)_ |
| **DoD atingido** | **SIM** |

---

## 1. Objetivo

Completar browse real: PDP reviews paginadas e header search autocomplete leem o FastAPI (Postgres seed). Mock reviews/search saem do path crítico (arquivos mantidos para rollback/flag). Catalog da Fase B e checkout Stripe **intocados**.

---

## 2. Definition of Done — evidência

| Critério | Status | Evidência |
|----------|--------|-----------|
| `reviews/service.ts` → BE | **SIM** | facade API + `src/lib/api/reviews.ts` |
| Reviews paginam no PDP | **SIM** | hook → `GET /api/v1/products/{id}/reviews?page&pageSize&sort&tag` |
| Search overlay → `GET /search` | **SIM** | `search/service.ts` + overlay async |
| Search retorna produtos seed | **SIM** | curl `q=massager` → `prod_001`, `prod_004` |
| Loading / empty / error | **SIM** | reviews (já existia + service errors); search skeleton + empty + retry |
| Mock fora do path crítico | **SIM** | UI importa service; mock só se flag off |
| Mock files **não** apagados | **SIM** | `lib/mock/reviews.ts`, `searchProducts` em products |
| Catalog B / checkout **não** quebrados | **SIM** | sem mudanças em checkout; catalog service só extrai flag |
| Feature flag rollback | **SIM** | `NEXT_PUBLIC_USE_API_CATALOG=0` cobre catalog+reviews+search |
| `tsc --noEmit` limpo | **SIM** | exit 0 |
| STATUS.md + este log | **SIM** | este commit |
| Commit feito | **SIM** | hash em STATUS + este arquivo |

---

## 3. Arquivos criados / alterados

### Criados

- `src/lib/api/reviews.ts` — fetch + normalize `ReviewsPage`
- `src/lib/api/search.ts` — fetch + normalize `SearchResponse` (Product[])
- `src/lib/search/service.ts` — facade API-first + mock se flag off
- `docs/phases/PHASE_C_COMPLETE.md` — este log

### Alterados

- `src/lib/reviews/service.ts` — API real; mock só com flag off
- `src/components/layout/search-overlay.tsx` — async debounced search + loading/empty/error
- `src/lib/api/config.ts` — `isApiCatalogEnabled()` (fonte única da flag)
- `src/lib/catalog/service.ts` — reexport da flag (sem lógica duplicada)
- `.env.local.example` — nota B/C na flag
- `docs/ops/ENV_CHECKLIST.md` — flag cobre reviews+search
- `docs/phases/STATUS.md`
- `docs/CONTINUE.md` — snapshot pós-C

### Não tocados (propositadamente)

- Checkout Stripe FE/BE, webhook, orders
- Catalog pages (category/PDP/home) além da extração da flag
- `src/lib/mock/*` (mantidos)
- Admin, cart money (Fase D), auth bridge (E)

---

## 4. Decisões e por quê

| Decisão | Rationale |
|---------|-----------|
| Mesma flag `NEXT_PUBLIC_USE_API_CATALOG` | Reviews/search dependem de productIds/seed do catálogo; um rollback |
| Flag em `api/config.ts` | Evita search-overlay puxar `catalog/service` (mocks) no grafo |
| Client `api/reviews` + facade `reviews/service` | Mesmo padrão Fase B (checkout/catalog) |
| `cache: "no-store"` em reviews/search | Client-driven pagination/autocomplete; evita página stale |
| Debounce 220ms no overlay | Menos requests enquanto digita |
| Normalize `featured: null` → `undefined` | BE Pydantic optional null; FE `featured?: boolean` |
| Product id path (`prod_001`) não slug | Contrato OpenAPI BE; PDP já passa `product.id` da API |

### Feature flag (rollback)

```bash
# .env.local ou Railway web
NEXT_PUBLIC_USE_API_CATALOG=0   # mock catalog + reviews + search
# omitir → API (default)
```

Requer rebuild/redeploy do Next (`NEXT_PUBLIC_*`).

---

## 5. Env / checklist (resumo)

| Var | Uso |
|-----|-----|
| `NEXT_PUBLIC_API_URL` | Base FastAPI (já prod SET) |
| `NEXT_PUBLIC_USE_API_CATALOG` | Opcional; default API para catalog+reviews+search |

Local: API `http://localhost:8080` + seed.

---

## 6. Como validar

```bash
# API prod
curl -sS "https://api-production-4f01.up.railway.app/api/v1/products/prod_001/reviews?page=1&pageSize=4"
curl -sS "https://api-production-4f01.up.railway.app/api/v1/products/prod_001/reviews?page=2&pageSize=4"
curl -sS "https://api-production-4f01.up.railway.app/api/v1/search?q=massager&limit=6"

# Types
npx tsc --noEmit

# Local UI
# docker compose up -d
# NEXT_PUBLIC_API_URL=http://localhost:8080 npm run dev
# open /product/shiatsu-neck-shoulder-massager → #reviews, page 2
# Header search → "massager" / "cushion"
```

---

## 7. Comandos rodados e resultado

| Comando | Resultado |
|---------|-----------|
| `npx tsc --noEmit` | **exit 0** |
| curl reviews page1 prod_001 | items=4, totalItems=12, totalPages=3, hasNext=true |
| curl reviews page2 | page=2, hasPrev=true |
| curl search massager | seed products (prod_001, prod_004, …) |
| curl search cushion | seed cushions |

---

## 8. Problemas abertos / follow-ups

| Item | Fase |
|------|------|
| Wishlist / cart `?add=` ainda mock | M (ou C residual) |
| Restaurar shipping 75/6.99 | **D** |
| `prod_009` still catalog | P unlisted |
| Site chrome (`siteConfig`) mock | J / M |
| Review write / moderated posts | posterior |
| Remover mock files | **M** |

---

## 9. Próxima fase recomendada

**Fase D — Money integrity (cart UX)**

- Restaurar `FREE_SHIPPING_THRESHOLD` / `FLAT_SHIPPING` alinhados ao BE
- Copy promo $75 alinhada
- Totais cart/checkout não contradizem Stripe (exceto SKU smoke intencional)

Prompt: `docs/PHASE_PROMPTS.md` → Fase D.

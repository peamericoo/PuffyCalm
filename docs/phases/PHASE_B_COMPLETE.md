# PHASE B COMPLETE — Catalog FE → API real

| Campo | Valor |
|-------|--------|
| **Fase** | B — Catalog FE → API real |
| **Data** | 2026-07-21 |
| **Timezone** | America/local owner |
| **Commit** | `66ae6d9` |
| **DoD atingido** | **SIM** |

---

## 1. Objetivo

Storefront lê catálogo do Postgres via FastAPI: category, PDP (+ related) e rails de produtos da home. Shapes TypeScript mantidos; mock saiu do path crítico (não apagado). Guest checkout + IDs `prod_00x` intactos.

---

## 2. Definition of Done — evidência

| Critério | Status | Evidência |
|----------|--------|-----------|
| Client/service catalog → API | **SIM** | `src/lib/api/catalog.ts` + `src/lib/catalog/service.ts` |
| Category page usa service (sem mock no path default) | **SIM** | `category/[slug]/page.tsx` → `getCatalogPage` |
| PDP by slug + related via service | **SIM** | `product/[slug]/page.tsx` → `getProductDetail` |
| Home product rails via service | **SIM** | `shop-now.tsx` → `getHomeProductRail`; `categories-strip.tsx` → `listCategories` |
| Loading/error states | **SIM** | Suspense skeleton category; `error.tsx` em category + product; empty/error UI na home |
| Feature flag rollback | **SIM** | `NEXT_PUBLIC_USE_API_CATALOG=0\|false\|off` → mock; **default = API ON** |
| `src/lib/mock` **não** apagado | **SIM** | ainda usado em search/reviews/site/cart deep-link / flag fallback |
| Checkout / Stripe **não** recriados | **SIM** | só catálogo; `product.id` do PDP continua no cart → lines |
| tsc limpo | **SIM** | `npx tsc --noEmit` exit 0 |
| STATUS.md atualizado | **SIM** | este commit |
| Commit feito | **SIM** | hash em STATUS + este arquivo |

---

## 3. Arquivos criados / alterados

### Criados

- `src/lib/api/catalog.ts` — fetch + normalize CatalogPage / Product / Category
- `src/app/(storefront)/category/[slug]/error.tsx`
- `src/app/(storefront)/product/[slug]/error.tsx`
- `docs/phases/PHASE_B_COMPLETE.md` — este log

### Alterados

- `src/lib/catalog/service.ts` — facade API-first + mock se flag off
- `src/app/(storefront)/category/[slug]/page.tsx` — ISR `revalidate=60`
- `src/app/(storefront)/product/[slug]/page.tsx` — API detail + ISR
- `src/components/home/shop-now.tsx` — async RSC + `getHomeProductRail`
- `src/components/home/categories-strip.tsx` — async RSC + `listCategories`
- `.env.local.example` — nota da flag
- `docs/ops/ENV_CHECKLIST.md` — `NEXT_PUBLIC_USE_API_CATALOG`
- `docs/phases/STATUS.md`
- `docs/CONTINUE.md` — snapshot pós-B

### Não tocados (propositadamente)

- Checkout Stripe FE/BE, webhook, orders
- `src/lib/reviews/*`, search-overlay (Fase **C**)
- `src/lib/mock/*` (mantidos)
- Admin
- Cart store / guest checkout contract

---

## 4. Decisões e por quê

| Decisão | Rationale |
|---------|-----------|
| API **default ON** | DoD: zero mock no path de domínio; flag só para rollback rápido |
| Flag `NEXT_PUBLIC_USE_API_CATALOG` | Valores `0`/`false`/`off`/`no` forçam mock; unset = API |
| Facade em `catalog/service.ts` + client em `api/catalog.ts` | Mesmo padrão do checkout; UI importa service, não fetch cru |
| Normalização de JSON no client | Defesa se campo faltar; badges filtrados para union FE |
| `GET /catalog` com stock=all (sem sale/types) | Client continua filter/sort via URL (sem RSC re-run) |
| ISR `revalidate = 60` | Evita SSG build frágil se API offline; tags Next para cache |
| `list*Slugs` fallback mock | `generateStaticParams` não quebra build se API down |
| Reviews/search ainda mock | Fora do escopo B → Fase **C** |
| Cart `?add=slug` ainda mock lookup | Edge deep-link; add normal no PDP usa Product da API (`id` real) |

### Feature flag (rollback)

```bash
# .env.local ou Railway web service
NEXT_PUBLIC_USE_API_CATALOG=0   # força mock fixtures
# omitir ou qualquer outro valor → API
```

Requer rebuild/redeploy do Next (env embutida em bundle `NEXT_PUBLIC_*`).

---

## 5. Env / checklist (resumo)

| Var | Uso |
|-----|-----|
| `NEXT_PUBLIC_API_URL` | Base FastAPI (já prod SET) |
| `NEXT_PUBLIC_USE_API_CATALOG` | Opcional; default API |

Local: API em `http://localhost:8080` (Compose) + seed.

---

## 6. Como validar

```bash
# API prod (seed)
curl -sS "https://api-production-4f01.up.railway.app/api/v1/catalog?categorySlug=recovery" | head -c 200
curl -sS "https://api-production-4f01.up.railway.app/api/v1/products/shiatsu-neck-shoulder-massager?related=2"

# Types
npx tsc --noEmit

# Local
# docker compose up -d
# NEXT_PUBLIC_API_URL=http://localhost:8080 npm run dev
# open /category/recovery · /product/shiatsu-neck-shoulder-massager · /

# Smoke mental checkout
# PDP product.id === cart line productId === POST /checkout/sessions lines[].productId
# Ex.: shiatsu → prod_001
```

---

## 7. Comandos rodados e resultado

| Comando | Resultado |
|---------|-----------|
| `npx tsc --noEmit` | **exit 0** |
| curl product prod | `id=prod_001`, related ≥1 |
| curl catalog recovery | products com ids seed |
| curl categories | all/recovery/comfort/everyday |

---

## 8. Problemas abertos / follow-ups

| Item | Fase |
|------|------|
| Reviews FE → API | **C** |
| Search overlay → `GET /search` | **C** |
| Wishlist / cart `?add=` ainda mock | C ou M |
| Restaurar shipping 75/6.99 | **D** |
| `prod_009` still in catalog (count all=9) | P unlisted |
| Site chrome (`siteConfig`, nav) still mock | J / M |

---

## 9. Próxima fase recomendada

**Fase C — Reviews + Search FE → API**

- `reviews/service.ts` → BE reviews paginadas
- Search overlay → `GET /api/v1/search`
- Manter mock files até Fase M

Prompt: `docs/PHASE_PROMPTS.md` → Fase C.

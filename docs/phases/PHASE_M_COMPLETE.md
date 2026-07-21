# PHASE M COMPLETE — Remoção definitiva de mocks de domínio

| Campo | Valor |
|-------|--------|
| **Fase** | M — Remove domain mocks |
| **Data** | 2026-07-21 |
| **DoD atingido** | **SIM** — zero imports `src/lib/mock/*`; pasta apagada; domain services API-only |

---

## 1. Objetivo

Limpar `src/lib/mock` dos caminhos de negócio (catalog, reviews, search, home product rail, cart deep-link, wishlist suggestions). Fixtures de domínio vivem só no seed BE.

**Deps confirmadas:** B, C, D, J done (STATUS).

---

## 2. Definition of Done — evidência

| Critério | Status | Evidência |
|----------|--------|-----------|
| Sem import `lib/mock` em domain services | **SIM** | `catalog/service`, `reviews/service`, `search/service` |
| Sem import `lib/mock` em components de domínio | **SIM** | cart/wishlist usam catalog API via server props |
| Órfãos `mock/cart.ts`, `mock/orders.ts` | **SIM** | pasta `src/lib/mock/` **apagada** |
| Home merch (J) sem mock | **SIM** | promo/hero = content API; product rail = catalog API |
| Checkout path intocado | **SIM** | Stripe Custom / guest / webhooks não alterados |
| BE seed preservado | **SIM** | `backend/.../seed_data.py` não tocado |
| `tsc --noEmit` | **SIM** | exit 0 |
| STATUS + este log + commit | **SIM** | este commit |

---

## 3. O que mudou (código)

### Domain services → API only

| File | Antes | Depois |
|------|-------|--------|
| `src/lib/catalog/service.ts` | Flag + mock fallback | FastAPI only; empty/null offline |
| `src/lib/reviews/service.ts` | Flag + `getProductReviewsPageMock` | FastAPI only |
| `src/lib/search/service.ts` | Flag + `mockSearchProducts` | FastAPI only |
| `src/lib/api/config.ts` | `isApiCatalogEnabled` podia forçar mock | always `true` (deprecated) |

### Cart / wishlist (deixaram de ler mock products)

| Path | Mudança |
|------|---------|
| `src/app/(storefront)/cart/page.tsx` | RSC resolve `?add=slug` via `getProductDetail` |
| `src/components/cart/cart-page-view.tsx` | Recebe `prefillProduct` do server |
| `src/app/(storefront)/wishlist/page.tsx` | RSC passa `getHomeProductRail(4)` |
| `src/components/wishlist/wishlist-view.tsx` | `suggestions` prop (API), sem mock |

### Chrome estático (não é mock de catálogo)

Movido de `src/lib/mock/site.ts` → **`src/lib/site.ts`**:

- `siteConfig`, `mainNav`, `footerNav`, `lifestyleCollections`, tipos de nav
- Promo/hero **não** re-exportados (já vivem em content API + `lib/content/defaults`)

Consumidores: root layout, header, footer, lifestyle-collections, metadata de category/PDP.

### Apagado

```text
src/lib/mock/
  cart.ts
  orders.ts
  products.ts
  categories.ts
  reviews.ts
  site.ts
  index.ts
```

---

## 4. Grep residual (justificado)

### Runtime / imports

```text
grep -r "lib/mock" src/   →  0 matches
```

### Comentários “mock” em `src/` (não são fixtures)

| Local | Por quê |
|-------|---------|
| `lib/api/config.ts` | deprecação da flag |
| `lib/catalog/service.ts` | docstring “no mock fixtures” |
| `lib/reviews/service.ts` | docstring |
| `components/cart/cart-page-view.tsx` | docstring |
| `types/product.ts`, `types/cart.ts`, `types/review.ts` | comentários históricos de shape |
| `lib/catalog/sort.ts`, `lib/reviews/paginate.ts` | comentários “safe for mock and API” |

### Residual **não-domínio** (intencional, não mock de produto)

| Item | Onde | Por quê permanece |
|------|------|-------------------|
| Nav mega-menu / footer links | `src/lib/site.ts` | chrome estático; CMS de nav fora de J/M |
| Lifestyle collections tiles | `src/lib/site.ts` | editorial links; não product IDs |
| Brand `siteConfig` | `src/lib/site.ts` | metadata / footer |
| Home promo + hero fallback | `src/lib/content/defaults.ts` | Phase J offline safety (API content) |
| Cart lines client | Zustand | snapshot UX; charge real no BE checkout |
| BE seed catalog | `backend/.../seed_data.py` | **proibido apagar** nesta fase |

### Docs antigas

Referências a `src/lib/mock` em PHASE_A–L / plan / AGENTS / CONTINUE são histórico; ops atualizados: `CONTRACTS.md`, `ENV_CHECKLIST.md`, `.env.local.example`, `README.md`.

---

## 5. Validação

| Check | Resultado |
|-------|-----------|
| `npx tsc --noEmit` | **exit 0** |
| `grep lib/mock` em `src/` | **0** |
| Domain services sem branch mock | **SIM** |
| Checkout / Stripe code paths | **não modificados** |

---

## 6. Deploy notes

- Redeploy **web** só (FE). Sem migration API nesta fase.
- Se `NEXT_PUBLIC_USE_API_CATALOG=0` ainda existir no Railway web: **ignorar** (função always-true). Pode remover a var.
- `NEXT_PUBLIC_API_URL` continua obrigatório para storefront.

---

## 7. Fora de escopo (proposital)

- CMS de nav/footer/lifestyle (permanece código)
- Páginas legais / empty-error (Fase **N**)
- Observabilidade / testes expandidos (Fase **O**)
- Unlist `prod_009` / go-live hardening (Fase **P**)
- Restock on cancel (defer L)

---

## 8. Próxima fase

**N** (legal + empty/error) em paralelo possível; **O** (obs + tests); **P** (go-live) prefere M done.

Prompt: `docs/PHASE_PROMPTS.md` → Fase N / O / P.

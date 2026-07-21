# PHASE N COMPLETE — Legal pages + empty/error states

| Campo | Valor |
|-------|--------|
| **Fase** | N — Legal + empty/error states |
| **Data** | 2026-07-21 |
| **Commit** | `1d37eba` |
| **DoD atingido** | **SIM** — about/help/returns/privacy/terms sem ComingSoon; error boundaries compartilhados |

---

## 1. Objetivo

Páginas trust com conteúdo real EN + resiliência UX quando a API falha (sem redesign total).

**Deps:** nenhuma dura (STATUS).

---

## 2. Definition of Done — evidência

| Critério | Status | Evidência |
|----------|--------|-----------|
| about, help, returns, privacy, terms ≠ ComingSoon | **SIM** | páginas usam `ContentPage` + seções EN |
| Erros de API não quebram layout | **SIM** | `ErrorState` + storefront/product/category `error.tsx` |
| Compliance legal inventado | **NÃO** | privacy/terms marcados como *operational summary*; returns realista D2C |
| `tsc --noEmit` | **SIM** | exit 0 |
| STATUS + este log + commit | **SIM** | este commit |

---

## 3. Páginas (lista)

| Rota | Conteúdo |
|------|----------|
| `/about` | História, curadoria, shipping regions, contato |
| `/help` | Orders/tracking, shipping, payments, returns link, contact (+ anchors `#shipping` `#contact` etc.) |
| `/returns` | Damaged 7d, change-of-mind 14d (sem free easy return garantido), processo por e-mail |
| `/privacy` | Coleta/uso/cookies/retention/choices — **placeholder operacional D2C** |
| `/terms` | Pedidos, pagamento, shipping, returns ref, disclaimer — **placeholder operacional D2C** |

### Placeholders honestos (sem counsel)

- **Privacy** e **Terms**: copy concisa de loja D2C; header “Operational summary · not a substitute for formal legal counsel”.
- **Returns**: alinhado ao negócio (sem free easy return no começo); case-by-case + defects prioritários.
- Não há texto multi-jurisdição (CCPA/GDPR full clauses, etc.) inventado.

---

## 4. Empty / error states

| Peça | Mudança |
|------|---------|
| `components/shared/error-state.tsx` | **Novo** — painel compartilhado (retry + home + browse) |
| `app/(storefront)/error.tsx` | **Novo** — boundary global do storefront |
| `product/[slug]/error.tsx` | Usa `ErrorState` |
| `category/[slug]/error.tsx` | Usa `ErrorState` |
| `(storefront)/not-found.tsx` | 404 real (sem ComingSoon) |
| `home/shop-now` CatalogUnavailable | Copy + `role="status"` um pouco mais clara |
| `home/categories-strip` empty | Idem |

**Fora de escopo (ainda ComingSoon):** `/forgot-password` (auth flow, não Fase N).

---

## 5. Componentes novos

```text
src/components/shared/content-page.tsx   # ContentPage + ContentSection
src/components/shared/error-state.tsx    # ErrorState (client)
```

---

## 6. Validação

- Grep `ComingSoon` nas 5 rotas trust: **zero imports**.
- `npx tsc --noEmit`: **pass**.
- Checkout / Stripe / webhooks: **não tocados**.

---

## 7. Próxima fase

**O** — Observability + tests (`docs/PHASE_PROMPTS.md` → Fase O).  
Depois **P** go-live.

Prompt: `docs/PHASE_PROMPTS.md` → Fase O / P.

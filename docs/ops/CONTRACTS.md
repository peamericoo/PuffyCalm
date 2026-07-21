# Contratos congelados (Fase A)

> Fonte operacional. **Não alterar** sem decisão explícita do owner.  
> Master plan: `docs/ECOMMERCE_MASTER_PLAN.md` · Handoff: `docs/CONTINUE.md`  
> Congelado em: **Fase A** (`docs/phases/PHASE_A_COMPLETE.md`)

---

## 1. Stripe Custom Checkout (NÃO recriar)

### Fluxo

```text
Cart (Zustand, prices for UX only)
  → POST /api/v1/checkout/sessions
       body: { email, lines[{ productId, quantity }], shipping }
  → BE: prices from DB + Order + Stripe Session (ui_mode=custom)
  → Payment Element / Express Checkout → checkout.confirm()
  → Webhook Stripe → order paid (idempotent stripe_events)
  → Success: GET /api/v1/orders/{id}?email=&sync=true
```

### Regras imutáveis

| # | Regra | Onde |
|---|--------|------|
| 1 | Lines enviam **apenas** `productId` + `quantity` | FE `lib/api/checkout.ts` · BE session create |
| 2 | **Preço autoritativo só no BE** (DB) | `application/checkout/service.py` |
| 3 | **Nunca** passar `returnUrl` em `confirm()` no FE | `return_url` só em `Session.create` no BE |
| 4 | **Nunca** passar `email` em `confirm()` | `customer_email` no Session.create |
| 5 | Uma Checkout Session **por** `sessionKey` (remount = nova session) | `stripe-payment-section.tsx` |
| 6 | Express Checkout deve passar `expressCheckoutConfirmEvent` | `payment-form.tsx` |
| 7 | Webhook: verificar assinatura + idempotência `stripe_events` | BE webhooks |
| 8 | Guest checkout obrigatório | nunca forçar login para comprar |

### Endpoints

| Method | Path | Notas |
|--------|------|--------|
| POST | `/api/v1/checkout/sessions` | Guest; server prices |
| GET | `/api/v1/orders/{id}` | `?email=` required; `?sync=true` se webhook atrasar |
| POST | `/api/v1/webhooks/stripe` | Raw body + signature |

---

## 2. Shipping FE vs BE (desalinhamento consciente)

### Valores canônicos de negócio (alvo pós-smoke)

| Conceito | Valor | Unidade |
|----------|-------|---------|
| Free shipping threshold | **75** | USD (BE: **7500** cents) |
| Flat shipping under threshold | **6.99** | USD (BE: **699** cents) |
| Copy marketing | “free shipping over $75” | UI home/PDP |

### Estado atual (2026-07-21, pós Fase A)

| Camada | Threshold | Flat | Notas |
|--------|-----------|------|--------|
| BE **defaults no código** | 7500 ¢ | 699 ¢ | `backend/app/core/config.py` |
| BE **prod Railway env** | **0** | **0** | Override para smoke `$0.50` |
| FE `src/lib/cart/constants.ts` | **0** | **0** | Alinhado ao override prod smoke |
| Copy UI (home/PDP) | copy $75 | — | **Desalinhada** dos numbers atuais |

### Decisão Fase A

- **Não restaurar 75/6.99 ainda** — smoke `prod_009` ($0.50) exige frete zero no BE e no FE para o charge ficar no mínimo Stripe.
- FE já está em 0/0 como o prod BE; **não** “alinhar” FE ao default do código (7500/699) enquanto o env prod for 0.
- **Dívida Fase D (Money integrity):**
  1. Railway `api`: `FREE_SHIPPING_THRESHOLD_CENTS=7500`, `FLAT_SHIPPING_CENTS=699`
  2. FE: `FREE_SHIPPING_THRESHOLD = 75`, `FLAT_SHIPPING = 6.99`
  3. Garantir copy $75 coerente com constants
  4. Smoke com `prod_009` sozinho passará a cobrar **$0.50 + $6.99** (ou usar cupom/flag futura)

### Fonte de verdade no pagamento

Sempre o **BE** (`compute_shipping_cents`). Totais do cart Zustand são **UX only**.

---

## 3. Política SKU smoke `prod_009`

| Campo | Valor |
|-------|--------|
| ID | `prod_009` |
| Slug | `stripe-min-test-charge` |
| Preço | **$0.50 USD** (mínimo Stripe USD) |
| Propósito | Smoke E2E checkout (card test mode) |
| Retail | **Não** — produto interno de teste |

### Onde existe

- FE mock: `src/lib/mock/products.ts` (`featured: true` hoje)
- BE seed: `backend/app/infrastructure/db/seed_data.py` (`featured: True`)
- Visível no catálogo mock/seed se listado (não há flag unlisted no model ainda)

### Política (congelada na Fase A)

1. **Manter** em seed/mock enquanto smoke de pagamento for necessário.
2. Tratar como **dev / unlisted intent**: não usar em marketing, ads ou merchandising real.
3. **Não remover** no meio das fases B–C (IDs estáveis).
4. **Antes de go-live real (Fase P ou antes):**  
   - unpublish / `in_stock=false` / remover de featured; ou  
   - apagar do seed prod e reseed; ou  
   - gate por env (`APP_ENV` / flag) se implementado.
5. Open question do master plan permanece até P: unlisted em prod vs remover do seed.

### Como smoke

```text
Add prod_009 to cart → guest checkout → test card 4242…
Com frete 0/0: charge ≈ $0.50
Com frete 75/6.99: charge ≈ $7.49 (mínimo produto + flat)
```

---

## 4. Guest checkout

Obrigatório. Conta Google é opcional (account UX), nunca blocker de compra.

---

## 5. Catalog mock (intocado na Fase A)

Home / category / PDP / search / reviews ainda leem `src/lib/mock/*`.  
API read real já existe (`GET /catalog`, `/products`, `/search`, `/reviews`).  
Migração = **Fases B–C**. Não recriar shapes TS.

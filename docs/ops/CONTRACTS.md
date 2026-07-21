# Contratos congelados (Fase A + updates D)

> Fonte operacional. **Não alterar** sem decisão explícita do owner.  
> Master plan: `docs/ECOMMERCE_MASTER_PLAN.md` · Handoff: `docs/CONTINUE.md`  
> Congelado em: **Fase A** · Shipping alinhado em: **Fase D** (`docs/phases/PHASE_D_COMPLETE.md`)

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
|--------|------|-------|
| POST | `/api/v1/checkout/sessions` | Guest; server prices; response includes `subtotalCents`, `shippingCents`, `totalCents` |
| GET | `/api/v1/orders/{id}` | `?email=` required; `?sync=true` se webhook atrasar |
| POST | `/api/v1/webhooks/stripe` | Raw body + signature |

---

## 2. Shipping FE vs BE (alinhados — Fase D)

### Valores canônicos de negócio (prod + código)

| Conceito | Valor | Unidade |
|----------|-------|---------|
| Free shipping threshold | **75** | USD (BE: **7500** cents) |
| Flat shipping under threshold | **6.99** | USD (BE: **699** cents) |
| Copy marketing | “free shipping over $75” | UI home/PDP/promo |

### Estado atual (pós Fase D)

| Camada | Threshold | Flat | Notas |
|--------|-----------|------|--------|
| BE **defaults no código** | 7500 ¢ | 699 ¢ | `backend/app/core/config.py` |
| BE **prod Railway env** | **7500** | **699** | Restaurados na Fase D |
| FE `src/lib/cart/constants.ts` | **75** | **6.99** | Alinhado ao BE |
| Copy UI (home/PDP/promo) | **$75** | — | Coerente com constants |

### Fonte de verdade no pagamento

Sempre o **BE** (`compute_shipping_cents`). Totais do cart Zustand são **UX estimate** (mesma fórmula e constants).

No **step de pagamento**, o FE prefere `subtotalCents` / `shippingCents` / `totalCents` da session server no order summary + botão Pay.

Fórmula BE (e espelho FE):

```text
if subtotal_cents <= 0 → shipping = 0
else if subtotal_cents >= FREE_SHIPPING_THRESHOLD_CENTS → shipping = 0
else → shipping = FLAT_SHIPPING_CENTS
total = subtotal + shipping
```

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

- BE seed: `backend/app/infrastructure/db/seed_data.py` (FE mock fixtures removed Phase M)
- Visível no catálogo se listado (não há flag unlisted no model ainda)

### Política (congelada na Fase A, charge math Fase D)

1. **Manter** em seed enquanto smoke de pagamento for necessário.
2. Tratar como **dev / unlisted intent**: não usar em marketing, ads ou merchandising real.
3. **Não remover** no meio das fases (IDs estáveis) até P.
4. **Antes de go-live real (Fase P ou antes):** unpublish / hide / reseed.
5. **Exceção de money integrity (Fase D):** com frete canônico 75/6.99, **só `prod_009` no cart** cobra:

```text
$0.50 (produto) + $6.99 (flat shipping) = $7.49
```

Não é bug: frete flat abaixo de $75. Cart UX e BE/session devem mostrar **$7.49**.  
Produtos seed normais ($39–$55) → subtotal + $6.99 até atingir $75 free ship.

### Como smoke

```text
Add prod_009 to cart → guest checkout → test card 4242…
Charge ≈ $7.49 (não mais $0.50 com frete zero)
Para charge mínimo absoluto: precisaria frete 0 de novo (não fazer em prod sem decisão).
```

---

## 4. Guest checkout

Obrigatório. Conta Google é opcional (account UX), nunca blocker de compra.

---

## 5. Catalog API (pós B/C)

Home / category / PDP / search / reviews leem **somente FastAPI** (Phase M — mock rollback removido).  
Chrome estático: `src/lib/site.ts` (nav/footer/lifestyle). Promo/hero: content API (J).

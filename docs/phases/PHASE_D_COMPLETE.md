# PHASE D COMPLETE — Money integrity (cart UX)

| Campo | Valor |
|-------|--------|
| **Fase** | D — Money integrity cart / shipping |
| **Data** | 2026-07-21 |
| **Timezone** | America/local owner |
| **Commit** | *(preenchido no STATUS após commit)* |
| **DoD atingido** | **SIM** |

---

## 1. Objetivo

Totais exibidos no cart/checkout coerentes com o que o BE cobra no Stripe. Restaurar frete canônico ($75 free / $6.99 flat), eliminar dual-source de shipping 0/0 (smoke), e preferir `totalCents` (e breakdown) do server no step de pagamento.

---

## 2. Definition of Done — evidência

| Critério | Status | Evidência |
|----------|--------|-----------|
| FE `FREE_SHIPPING_THRESHOLD` / `FLAT_SHIPPING` alinhados ao BE | **SIM** | `src/lib/cart/constants.ts` → **75** / **6.99** |
| BE prod Railway env 7500 / 699 | **SIM** | `railway variable list --service api` → `FREE_SHIPPING_THRESHOLD_CENTS=7500`, `FLAT_SHIPPING_CENTS=699` |
| Defaults código BE | **SIM** | `config.py` já 7500/699 (inalterados) |
| Summary cart/checkout não mente vs charge (produto seed normal) | **SIM** | mesma fórmula FE/BE; seed $39–$55 → +$6.99 shipping |
| Preferir total server no step pagamento | **SIM** | `onSessionReady` + summary usa `subtotalCents`/`shippingCents`/`totalCents` |
| Copy free shipping $75 alinhada | **SIM** | home/PDP/promo já $75; constants restaurados |
| Exceção smoke `prod_009` documentada | **SIM** | §5 deste log + `CONTRACTS.md` §3 → charge **$7.49** |
| Stripe contract **não** alterado | **SIM** | sem returnUrl/email no confirm; lines só productId+qty |
| Admin / mocks catálogo **não** removidos | **SIM** | fora de escopo |
| `tsc --noEmit` limpo | **SIM** | exit 0 |
| STATUS + este log + commit | **SIM** | este commit |

---

## 3. Arquivos criados / alterados

### Criados

- `docs/phases/PHASE_D_COMPLETE.md` — este log

### Alterados (código)

- `src/lib/cart/constants.ts` — **75** / **6.99** (fim smoke 0/0)
- `src/lib/api/checkout.ts` — `subtotalCents` / `shippingCents` no session result
- `src/components/checkout/stripe-payment-section.tsx` — `onSessionReady`
- `src/components/checkout/checkout-view.tsx` — summary step 3 usa money server
- `backend/app/application/checkout/service.py` — `CheckoutSessionResult` + subtotal/shipping
- `backend/app/api/v1/schemas/checkout.py` — response fields
- `backend/app/api/v1/checkout.py` — wire fields
- `backend/tests/test_checkout_api.py` — asserts breakdown

### Alterados (docs / ops)

- `docs/ops/CONTRACTS.md` — shipping alinhado; prod_009 = $7.49
- `docs/ops/ENV_CHECKLIST.md` — env prod 7500/699
- `docs/phases/STATUS.md` — D done; próxima **E**
- `docs/CONTINUE.md` — snapshot pós-D

### Ops (Railway)

- `api`: `FREE_SHIPPING_THRESHOLD_CENTS=7500`, `FLAT_SHIPPING_CENTS=699` (redeploy automático)

### Não tocados (propositadamente)

- Stripe confirm rules / webhook / Payment Element flow
- Admin UI/API
- Remoção de `src/lib/mock/*`
- Unlist de `prod_009` (Fase P)

---

## 4. Decisões e por quê

| Decisão | Rationale |
|---------|-----------|
| Restaurar 75/6.99 (não manter 0/0) | Fase D DoD = business integrity; smoke mínimo $0.50 era dívida consciente da A |
| Adicionar `subtotalCents`/`shippingCents` na session response | Additive API (não muda contrato Stripe); summary não “mente” se cart price ≠ DB |
| FE step 3 sobrescreve CartSummary com server money | Charge real = server; steps 1–2 permanecem estimate com constants alinhados |
| Copy UI sem redesign | Já dizia “$75”; só numbers FE estavam em 0 |
| `prod_009` sozinho = $7.49 | Documentar como exceção smoke, não “fix” frete zero em prod |

### Valores finais (canônicos)

| Camada | Threshold | Flat |
|--------|-----------|------|
| FE USD | 75 | 6.99 |
| BE cents | 7500 | 699 |

### Exemplo totais (seed)

| Cart | Subtotal | Shipping | Total |
|------|----------|----------|-------|
| `prod_001` ×1 | $54.00 | $6.99 | **$60.99** |
| `prod_005` ×2 ($39) | $78.00 | Free | **$78.00** |
| `prod_009` ×1 only | $0.50 | $6.99 | **$7.49** ← smoke exception |

---

## 5. Env / checklist (resumo)

| Var | Valor prod (pós-D) |
|-----|---------------------|
| `FREE_SHIPPING_THRESHOLD_CENTS` | **7500** |
| `FLAT_SHIPPING_CENTS` | **699** |
| FE constants | 75 / 6.99 (build-time; deploy web para prod) |

Local: defaults do `config.py` já 7500/699 se env não override.

---

## 6. Como validar

```bash
# FE constants
# FREE_SHIPPING_THRESHOLD === 75 && FLAT_SHIPPING === 6.99

# BE prod env
railway variable list --service api --kv | findstr SHIPPING
# FREE_SHIPPING_THRESHOLD_CENTS=7500
# FLAT_SHIPPING_CENTS=699

# Shipping math unit
cd backend && python -m pytest tests/test_checkout_shipping.py -q

# Typecheck FE
npx tsc --noEmit

# Mental / manual cart:
# - Add prod_001 → bag shows shipping $6.99, total $60.99
# - Checkout payment step → Pay $60.99 matches summary (server totalCents)
# - prod_009 alone → $7.49 (documented exception)
```

---

## 7. Health / smoke notes

- Health prod não re-testado obrigatoriamente nesta fase (só env shipping + código).
- Redeploy **api** triggered by Railway variable set.
- Redeploy **web** necessário para constants FE + summary server (commit → CI/Railway web).

---

## 8. Próxima fase

**Fase E — Admin auth bridge**

- `paletot.business@gmail.com` admin **no backend** (JWT / google-exchange).
- FE allowlist continua UX only; 403 do BE é barreira.
- Pode ser paralelizada com polish de FE se outro agente, mas **não** reabrir money/shipping sem decisão.

Prompt: `docs/PHASE_PROMPTS.md` → Fase E.

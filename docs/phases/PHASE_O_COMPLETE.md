# PHASE O COMPLETE — Observability + tests

| Campo | Valor |
|-------|--------|
| **Fase** | O — Observability + tests |
| **Data** | 2026-07-21 |
| **Commit** | `ebc9052` |
| **DoD atingido** | **SIM** — falha de pagamento / checkout rastreável por `order_id` nos logs |

---

## 1. Objetivo

Diagnóstico rápido de pedidos falhos no Railway (API logs) sem reescrever o app.

**Deps:** contínuo desde A.

---

## 2. Definition of Done — evidência

| Critério | Status | Evidência |
|----------|--------|-----------|
| Structured logs checkout create | **SIM** | `checkout_create_start` / `_ok` / `_failed` + `checkout_session_created` |
| Structured logs webhook | **SIM** | `stripe_webhook_received` / `_ok` / `order_payment_failed` + `orderId` no result |
| Sem card data / PII excessivo | **SIM** | só `email_domain`, país, ids, cents — sem address/card |
| Pytest críticos | **SIM** | `tests/test_observability.py` (helpers + falha simulada + DB opcional) |
| Smoke pós-deploy | **SIM** | `scripts/smoke-post-deploy.ps1` / `.sh` — prod health/ready/catalog OK |
| Sentry | **Follow-up** | não instalado; ver §6 |
| STATUS + este log + commit | **SIM** | este commit |

---

## 3. O que logar (event keys)

### Checkout `POST /api/v1/checkout/sessions`

| Event | Nível | Campos principais |
|-------|--------|-------------------|
| `checkout_create_start` | info | `email_domain`, `line_count`, `product_ids`, `ship_country` |
| `checkout_create_ok` | info | `order_id`, `public_code`, `total_cents`, + base fields |
| `checkout_create_failed` | warning/error | `code`, `http_status`, + base (sem order se pré-create) |
| `checkout_session_created` | info | service: `order_id`, `stripe_session_id`, money, `email_domain` |
| `stripe_session_create_failed` | exception | `order_id`, `stripe_code`, `stripe_type` |

### Webhook `POST /api/v1/webhooks/stripe`

| Event | Nível | Campos principais |
|-------|--------|-------------------|
| `stripe_webhook_received` | info | `event_id`, `event_type` |
| `stripe_webhook_ok` | info | `event_id`, `event_type`, `status`, **`order_id`**, `public_code` |
| `stripe_webhook_invalid_signature` | warning | `event_id` peek (se body legível) |
| `webhook_process_failed` / `_error` | exception | `event_id`, `event_type`, `code` |
| `order_payment_failed` | warning | **`order_id`**, `public_code`, `event_id`, `event_type` |
| `order_paid` | info | `order_id`, `public_code`, `payment_intent_id`, `total_cents` |
| `stripe_event_processed` | info | `event_id`, `order_id`, `outcome` (`paid`/`failed`/…) |
| `http_5xx` | error | `method`, `path`, `status_code` (middleware) |

### Política PII

- **OK:** `order_id`, `public_code`, Stripe session/pi/event ids, cents, product ids, country, email **domain**.
- **NÃO:** full email (use domain), shipping address lines, card/PAN/CVV, client_secret, webhook secret.

Helpers: `app.core.logging.email_domain`, `redact_email`.

### Response body webhook (também nos logs)

```json
{
  "status": "processed|duplicate",
  "eventId": "evt_…",
  "type": "checkout.session.completed|payment_intent.payment_failed|…",
  "orderId": "ord_…",
  "publicCode": "PC-…"
}
```

---

## 4. Onde (arquivos)

| Área | Path |
|------|------|
| Logging setup + helpers | `backend/app/core/logging.py` |
| Checkout HTTP | `backend/app/api/v1/checkout.py` |
| Webhook HTTP | `backend/app/api/v1/webhooks.py` |
| Service (create/paid/process) | `backend/app/application/checkout/service.py` |
| 5xx middleware | `backend/app/main.py` → `FiveXXLogMiddleware` |
| Tests | `backend/tests/test_observability.py` |
| Smoke | `scripts/smoke-post-deploy.ps1`, `scripts/smoke-post-deploy.sh` |

---

## 5. Como diagnosticar um pedido falho

1. **Obter `order_id`** (`ord_…`) do admin, e-mail de success URL, ou `public_code` (`PC-…`) + guest order API.
2. **Railway → service `api` → Logs** (JSON em `APP_ENV=production`).
3. **Grep / search** por `order_id=<valor>` ou o valor cru `ord_…`.
4. **Timeline típica:**
   - `checkout_create_start` → `checkout_session_created` / `checkout_create_ok`
   - Se Stripe Session falha: `stripe_session_create_failed` + `checkout_create_failed` `code=stripe_error`
   - Webhook: `stripe_webhook_received` → `stripe_event_processed` / `order_paid` **ou** `order_payment_failed`
   - Assinatura inválida: `stripe_webhook_invalid_signature` (sem order)
5. **Cruzar com Stripe Dashboard** pelo `stripe_session_id` / `payment_intent_id` nos mesmos logs.
6. **DB:** `orders.status` (`failed` / `requires_payment` / `paid`) + `stripe_events` (idempotency).

### Falha simulada (validação local)

```bash
cd backend
python -m pytest tests/test_observability.py::test_process_payment_failed_order_id_without_db -q
# → process_stripe_event retorna orderId=ord_fail_sim_001; order.status=failed
```

Com Postgres:

```bash
REQUIRE_DB=1 pytest tests/test_observability.py -q
```

---

## 6. Smoke pós-deploy

```powershell
# Windows (default = prod API)
pwsh scripts/smoke-post-deploy.ps1
pwsh scripts/smoke-post-deploy.ps1 -ApiBase http://localhost:8080
pwsh scripts/smoke-post-deploy.ps1 -Checkout   # cria pedido real pending + Stripe

# Bash
./scripts/smoke-post-deploy.sh
API_BASE=http://localhost:8080 SMOKE_CHECKOUT=1 ./scripts/smoke-post-deploy.sh
```

Checagens: `GET /health`, `GET /ready`, `GET /api/v1/catalog`; opcional `POST /api/v1/checkout/sessions`.

**Validado 2026-07-21:** prod API health/ready/catalog OK.

---

## 7. Sentry — follow-up (não nesta fase)

Não há SDK Sentry no monorepo. Integração sugerida (Fase P ou ops):

1. `sentry-sdk[fastapi]` no backend + `SENTRY_DSN` no Railway `api`.
2. Opcional `@sentry/nextjs` no web.
3. Manter structlog como fonte primária de `order_id` (Sentry como exceções 5xx).
4. **Não** enviar card data / full address no `extra`.

---

## 8. Pytest

| Teste | DB? | O que prova |
|-------|-----|-------------|
| `test_email_domain_safe` / `test_redact_email` | no | PII policy helpers |
| `test_peek_event_meta_*` | no | webhook peek sem PII |
| `test_process_payment_failed_order_id_without_db` | no | **falha simulada → orderId** |
| DB suite (paid/fail/dup/http/checkout) | yes | integração; skip sem `REQUIRE_DB` |

Suite local sem DB: `pytest tests/test_observability.py` → unit pass + DB skip.

---

## 9. Fora de escopo

- Rewrite app / redesign
- PayPal (Fase **P**)
- Sentry install
- Alertas externos (PagerDuty etc.) — só logs estruturados + 5xx middleware

---

## 10. Próxima fase

**P** — Go-live hardening (`docs/PHASE_PROMPTS.md` → Fase P).  
Rate limits, secrets audit, smoke SKU policy, PayPal só se pedido, checklist go-live.

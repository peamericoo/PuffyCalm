# PHASE F COMPLETE — Admin orders API

| Campo | Valor |
|-------|--------|
| **Fase** | F — Admin API ops (pedidos) |
| **Data** | 2026-07-21 |
| **Commit** | *(ver STATUS.md / git log)* |
| **DoD atingido** | **SIM** (endpoints + state machine + pytest) |

---

## 1. Objetivo

Backend expõe operações de pedido para staff/admin, com **máquina de estados** no application/domain layer. Sem UI (Fase G).

---

## 2. Endpoints

Base: `/api/v1` · Auth: cookie `pc_access` ou `Authorization: Bearer` · Role: **staff ou admin** (`RequireStaff`)

| Método | Path | Descrição |
|--------|------|-----------|
| `GET` | `/admin/orders` | Lista paginada; filtro `status`; ordenação newest-first |
| `GET` | `/admin/orders/{id}` | Detalhe: itens, shipping, payment ids, totals, email, notes |
| `PATCH` | `/admin/orders/{id}` | `status` (transições permitidas) e/ou `adminNotes` |

**Nunca públicos:** sem cookie/token → **401**. Customer sem role → **403**.

### Query params — list

| Param | Tipo | Default | Notas |
|-------|------|---------|--------|
| `status` | string | — | Filtro exato; valor desconhecido → 400 `invalid_status` |
| `page` | int ≥ 1 | 1 | |
| `pageSize` | int 1–100 | 20 | camelCase |

### Body — PATCH

```json
{
  "status": "processing",
  "adminNotes": "Packed for courier"
}
```

- Campos opcionais; omitir = não alterar.
- Body `{}` → **400** `empty_patch`.
- Transição ilegal → **409** `illegal_status_transition`.
- Order inexistente → **404** `not_found`.

### Response shapes (camelCase)

**List item:** `id`, `publicCode`, `email`, `status`, `currency`, `subtotalCents`, `shippingCents`, `totalCents`, `itemCount`, `paidAt`, `createdAt`, `updatedAt`.

**Detail:** list fields + `shippingAddress`, `adminNotes`, `stripeCheckoutSessionId`, `stripePaymentIntentId`, `items[]` (`productId`, `productSlug`, `productName`, `quantity`, `unitPriceCents`, `lineTotalCents`, `imageUrl`).

---

## 3. Máquina de estados (admin)

Payment promotions (**→ paid / → failed**) **não** são admin — ficam no webhook Stripe / reconcile checkout.

| From | Admin may set |
|------|----------------|
| `pending` | `cancelled` |
| `requires_payment` | `cancelled` |
| `paid` | `processing`, `cancelled` |
| `processing` | `shipped`, `cancelled` |
| `shipped` | `delivered` |
| `failed` | `cancelled` |
| `delivered` | *(terminal)* |
| `cancelled` | *(terminal)* |

**Ilegais (exemplos cobertos por testes):**

- `paid` → `shipped` / `delivered` (pula processing)
- `admin` setar `paid` a partir de unpaid
- qualquer saída de `delivered` / `cancelled`

Código: `backend/app/domain/order_rules.py` → `assert_admin_status_transition`.

---

## 4. Exemplos curl (sem secrets)

```bash
# Login admin (dev seed) — grava cookies
curl -sS -c /tmp/pc.txt -b /tmp/pc.txt \
  -H 'Content-Type: application/json' \
  -d '{"email":"<ADMIN_EMAIL>","password":"<ADMIN_PASSWORD>"}' \
  http://localhost:8080/api/v1/auth/login

# List
curl -sS -b /tmp/pc.txt \
  'http://localhost:8080/api/v1/admin/orders?page=1&pageSize=20'

# Filter paid
curl -sS -b /tmp/pc.txt \
  'http://localhost:8080/api/v1/admin/orders?status=paid'

# Detail
curl -sS -b /tmp/pc.txt \
  "http://localhost:8080/api/v1/admin/orders/<ORDER_ID>"

# Mark processing + notes
curl -sS -b /tmp/pc.txt \
  -X PATCH -H 'Content-Type: application/json' \
  -d '{"status":"processing","adminNotes":"Picked"}' \
  "http://localhost:8080/api/v1/admin/orders/<ORDER_ID>"

# Illegal: paid → shipped (expect 409)
curl -sS -b /tmp/pc.txt \
  -X PATCH -H 'Content-Type: application/json' \
  -d '{"status":"shipped"}' \
  "http://localhost:8080/api/v1/admin/orders/<PAID_ORDER_ID>"

# Unauthenticated (expect 401)
curl -sS -o NUL -w "%{http_code}\n" \
  http://localhost:8080/api/v1/admin/orders
```

Prod base: `https://api-production-4f01.up.railway.app` (mesmo paths; cookies `COOKIE_SAMESITE=none` se browser cross-site — ver Fase E).

---

## 5. Pytest

```bash
cd backend

# Unit (sem DB) — state machine
python -m pytest tests/test_order_status_transitions.py -q

# Integration (Postgres + Redis)
REQUIRE_READY=1 python -m pytest \
  tests/test_admin_orders_api.py \
  tests/test_order_status_transitions.py -q
```

| Suite | Cobertura |
|-------|-----------|
| `test_order_status_transitions` | allowed edges, paid→shipped illegal, terminal, no admin→paid |
| `test_admin_orders_api` | 401, list, filter status, get detail, patch OK, patch 409, notes-only, empty body |

**Resultado sessão F:** 24 passed (13 unit + 11 API).

---

## 6. Definition of Done

| Critério | Status |
|----------|--------|
| `GET /admin/orders` filtros + paginação | **SIM** |
| `GET /admin/orders/{id}` itens/shipping/payment/totals/email | **SIM** |
| `PATCH` status + admin_notes | **SIM** |
| Transições validadas no application/domain | **SIM** |
| RequireStaff — nunca público | **SIM** |
| Pytest list/get/patch + transição ilegal | **SIM** |
| Sem UI admin (G) / products CRUD (H) / checkout recriado | **SIM** |
| STATUS + PHASE_F_COMPLETE + commit | **SIM** |

---

## 7. Arquivos

### Criados

- `backend/app/domain/order_rules.py`
- `backend/app/application/admin_orders/__init__.py`
- `backend/app/application/admin_orders/service.py`
- `backend/app/api/v1/schemas/admin_orders.py`
- `backend/tests/test_order_status_transitions.py`
- `backend/tests/test_admin_orders_api.py`
- `docs/phases/PHASE_F_COMPLETE.md`

### Alterados

- `backend/app/api/v1/admin.py` — rotas orders
- `docs/phases/STATUS.md`
- `docs/CONTINUE.md` (ponteiro próxima fase)

### Fora de escopo (proposital)

- UI `/admin/orders` (Fase G)
- Products admin CRUD (H)
- Stripe checkout / webhooks

---

## 8. Notas

1. **Staff e admin** podem listar/detalhar/patch — fulfillment diário; só `only-admin` permanece admin-only.
2. **Cancel de paid** é permitido na API (ops manual / refund offline); não chama Stripe Refund automaticamente nesta fase.
3. Colunas existentes no model `Order` / `OrderItem` — sem migration nova.

---

## 9. Próxima fase

**Fase G — Admin UI pedidos**  
Rotas Next `/admin/orders` + detalhe consumindo estes endpoints com cookies da Fase E.

Prompt: `docs/PHASE_PROMPTS.md` → Fase G.

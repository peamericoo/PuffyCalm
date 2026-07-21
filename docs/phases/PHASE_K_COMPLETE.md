# PHASE K COMPLETE — Account orders (guest + Google)

| Campo | Valor |
|-------|--------|
| **Fase** | K — Conta cliente + my orders |
| **Data** | 2026-07-21 |
| **Commit** | `db6a5a0` |
| **DoD atingido** | **SIM** |

---

## 1. Objetivo

Cliente vê pedidos reais em `/account/orders` (substituindo ComingSoon), sem quebrar **guest checkout**.

---

## 2. Estratégia (guest lookup vs Google-linked)

| Path | Quem | Prova de posse | API |
|------|------|----------------|-----|
| **Guest track** | Qualquer visitante | **Email de checkout + `publicCode` (PC-…)** | `GET /api/v1/orders/lookup?email=&code=` |
| **Google-linked** | Auth.js Google session | Email da sessão = email do pedido | RSC chama `GET /api/v1/orders/by-email?email=` **só com** `session.user.email` |
| **Success page (pré-existente)** | Pós-checkout | `order id` + email na query | `GET /api/v1/orders/{id}?email=&sync=` |

### Decisões de privacidade

1. **Não** exigimos login para comprar nem para trackar um pedido.
2. Lookup guest exige **dois fatores** (email + código) — mesmo modelo do GET por id.
3. Lista por email usa o **mesmo “email-as-proof”** do success path; o FE **nunca** deixa o browser listar email arbitrário sem sessão: a lista Google roda no **Server Component** com `auth()`.
4. **Não** há FK `user_id` em `orders` nesta fase — linkage = match case-insensitive de email.
5. Response de lista **não** expõe `adminNotes` nem IDs Stripe.

### Fluxo mental

```text
Checkout guest (sem login) → Order.email + Order.public_code
  → Success: id+email
  → Track later: /account/orders form → lookup code+email

Checkout com email da conta Google
  → Sign in → /account/orders lista todos os pedidos daquele email
  → Guest form continua disponível (outro email / código)
```

---

## 3. Endpoints novos

Base: `/api/v1` · **Públicos** (sem JWT admin)

| Método | Path | Params | Resposta |
|--------|------|--------|----------|
| `GET` | `/orders/lookup` | `email`, `code` (obrigatórios) | `OrderOut` (mesmo shape do success) |
| `GET` | `/orders/by-email` | `email`, `page`, `pageSize` | Lista paginada + itens |

### Códigos

| Situação | HTTP | `code` |
|----------|------|--------|
| Falta email/code | 400 | `email_required` / `code_required` |
| Match inválido | 404 | `not_found` (sem vazar se email ou code falhou) |

### Normalização de código

- Trim + upper
- Aceita `PC-XXXXXXXX` ou bare hex de 8 chars → prefixa `PC-`

---

## 4. Frontend

| Peça | Path |
|------|------|
| Página | `src/app/(storefront)/account/orders/page.tsx` — RSC, `force-dynamic` |
| View | `src/components/account/account-orders-view.tsx` |
| Guest form | `src/components/account/guest-order-lookup.tsx` |
| Card | `src/components/account/order-card.tsx` (expandível) |
| Client API | `src/lib/api/orders.ts` |

### UX

- **Sem login:** CTA “Sign in with Google” + form Track order + empty/error decentes.
- **Com login:** lista de pedidos da sessão; empty se zero; error se API falhar (form guest ainda útil).
- Prefill URL: `?email=&code=` no form guest.
- Link footer “Track order” já apontava para `/account/orders`.

**Guest checkout:** intocado (checkout, success poll, contratos Stripe).

---

## 5. Validação

```bash
# Unit (sem DB)
cd backend
python -m pytest tests/test_customer_orders_api.py::test_normalize_public_code -q

# Integration (Postgres)
REQUIRE_DB=1 DATABASE_URL='postgresql+asyncpg://…' \
  python -m pytest tests/test_customer_orders_api.py -q
```

| Suite | Resultado sessão K |
|-------|---------------------|
| `test_normalize_public_code` | pass |
| lookup + by-email + GET id regression | **4 passed** (Railway public Postgres) |
| `tsc --noEmit` (repo) | clean |

### Smoke manual sugerido

1. Guest compra → success mostra `PC-…` → `/account/orders` com email+code acha o pedido.
2. Compra com email Google → sign-in → lista mostra o pedido.
3. Compra guest **sem** login continua OK.

---

## 6. Definition of Done

| Critério | Status |
|----------|--------|
| `/account/orders` real (não ComingSoon) | **SIM** |
| Guest: email + public_code | **SIM** |
| Google: pedidos pelo email da sessão | **SIM** |
| Não exigir login para comprar | **SIM** (checkout intacto) |
| UI empty/error decente | **SIM** |
| Sem inventário L / admin products | **SIM** |
| PHASE_K_COMPLETE + STATUS + commit | **SIM** |

---

## 7. Arquivos

### Criados

- `backend/app/api/v1/orders.py` (rewrite com `/lookup`, `/by-email`, `/{id}`)
- `backend/tests/test_customer_orders_api.py`
- `src/lib/api/orders.ts`
- `src/components/account/account-orders-view.tsx`
- `src/components/account/guest-order-lookup.tsx`
- `src/components/account/order-card.tsx`
- `src/components/account/order-status-chip.tsx`
- `docs/phases/PHASE_K_COMPLETE.md`

### Alterados

- `backend/app/application/checkout/service.py` — `normalize_public_code`, `get_order_by_public_code`, `list_orders_for_email`
- `backend/app/api/v1/schemas/checkout.py` — list DTOs
- `src/app/(storefront)/account/orders/page.tsx`
- `docs/phases/STATUS.md`
- `docs/CONTINUE.md`

---

## 8. Fora de escopo (proposital)

- Inventory / stock decrement (L)
- Admin products (H já done; não reabrir)
- Magic-link e-mail order history
- FK user↔order / Google `sub` column
- Rate limit redis no lookup (nginx gateway cobre em prod local)

---

## 9. Próxima fase

**Fase L — Fulfillment + inventory hardening**  
`stock_qty` / regras boolean, decrement idempotente no webhook paid, UI admin status ship/deliver.

Prompt: `docs/PHASE_PROMPTS.md` → Fase L.

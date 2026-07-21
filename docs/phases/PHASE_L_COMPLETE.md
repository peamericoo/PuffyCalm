# PHASE L COMPLETE — Inventory + fulfillment hardening

| Campo | Valor |
|-------|--------|
| **Fase** | L — Fulfillment + inventory hardening |
| **Data** | 2026-07-21 |
| **Commit** | *(ver STATUS.md após commit)* |
| **DoD atingido** | **SIM** — `stock_qty` + decremento no paid path idempotente; qty 0 bloqueia checkout; pytest green |

---

## 1. Objetivo

Ops e estoque consistentes: produto sem unidades não vende; double-delivery de webhook Stripe **não** decrementa inventário 2×. Status de fulfillment `processing → shipped → delivered` já existiam na API (F) e UI (G).

---

## 2. Regras de estoque (canônicas)

| Regra | Detalhe |
|-------|---------|
| Coluna | `products.stock_qty` (`INTEGER NOT NULL`, default **100**) |
| Flag legada | `products.in_stock` (boolean) — mantida para filtros de catálogo |
| Sellable no checkout | `status=published` **e** `in_stock=true` **e** `stock_qty ≥ 1` |
| Qty no carrinho | `quantity ≤ stock_qty` e `≤ max_quantity_per_order` |
| Erros | `out_of_stock` (qty 0 / flag false); `insufficient_stock` (qty pedida > disponível) — HTTP **409** |
| Admin soft-hold | `in_stock=false` com `stock_qty > 0` bloqueia venda sem zerar o contador |
| Admin restock | PATCH `stockQty > 0` (sem `inStock`) → `in_stock=true` |
| Admin in_stock true + qty 0 | bump `stock_qty` para **1** |
| Esgotamento | ao decrementar até 0 → `stock_qty=0` e `in_stock=false` |
| Restock automático | **não** há restock em cancelamento (fora de escopo L) |
| Dropship default | seed / migration usam 100 unidades — ops baixa para 0 ou desliga `inStock` para bloquear |

**Onde o boolean ainda manda:** filtros de catálogo (`stock=in|out`) continuam em `in_stock`. O gate de venda é **qty + flag**.

---

## 3. Onde decrementa (path paid)

**Único lugar de decremento:** `mark_order_paid` → `deduct_inventory_for_order`.

Chamadores (inalterados no fluxo Stripe):

1. Webhook `process_stripe_event` (`checkout.session.completed`, `async_payment_succeeded`, `payment_intent.succeeded`)
2. `reconcile_order_with_stripe` (fallback poll)

### Idempotência (camadas)

| Camada | Mecanismo |
|--------|-----------|
| 1. Evento Stripe | Tabela `stripe_events` PK = `event_id` — delivery idêntica → `status: duplicate` |
| 2. Race no insert | `IntegrityError` em `stripe_events` → tratado como duplicate |
| 3. Pedido | `SELECT … FOR UPDATE` na row `orders` |
| 4. Status gate | Se status ∈ `{paid, processing, shipped, delivered}` → **não** decrementa de novo |
| 5. Produto | `SELECT products … FOR UPDATE` ao decrementar linhas |

**Proibido / não tocado:** recriar Stripe session flow; quebrar `stripe_events`.

Arquivos-chave:

- `backend/app/application/checkout/inventory.py` — regras + `deduct_inventory_for_order`
- `backend/app/application/checkout/service.py` — `mark_order_paid` / `process_stripe_event`
- `backend/app/application/checkout/purchase_limits.py` — gate no create session
- Migration: `backend/alembic/versions/l1a2b3c4d5e6_add_product_stock_qty.py`

---

## 4. Fulfillment status

Sem mudança de máquina de estados (F). Admin continua:

| From | Admin may set |
|------|----------------|
| `paid` | `processing`, `cancelled` |
| `processing` | `shipped`, `cancelled` |
| `shipped` | `delivered` |

UI G (`/admin/orders/[id]`) já expõe o select de transições.

---

## 5. API / admin surfaces

| Surface | Campo |
|---------|--------|
| Admin list/detail product | `stockQty` (+ `inStock`) |
| Admin create/patch | `stockQty` opcional (default 100 no create) |
| Storefront `ProductOut` | `stockQty` opcional (informativo); gate real no checkout BE |
| Checkout | sem mudança de contrato Stripe; 409 se OOS |

FE: tipo `stockQty` em `src/lib/api/admin-products.ts` (form UI qty opcional pós-L).

---

## 6. Testes (DoD)

```bash
cd backend
# REQUIRE_DB=1 + DATABASE_URL apontando para Postgres
pytest tests/test_inventory_webhook.py tests/test_purchase_limits.py -v
```

| Teste | Prova |
|-------|--------|
| `test_double_mark_order_paid_decrements_once` | 2× `mark_order_paid` → −qty uma vez |
| `test_double_webhook_same_event_id_no_double_decrement` | mesmo `evt_*` 2× → duplicate + −1 |
| `test_two_event_types_same_order_decrement_once` | session.completed + pi.succeeded → −qty uma vez |
| `test_checkout_blocks_stock_qty_zero` | qty 0 → 409 `out_of_stock` (Stripe session **não** criada) |
| `test_checkout_blocks_in_stock_false` | flag false → 409 |
| `test_paid_to_zero_sets_in_stock_false` | última unidade → OOS |
| unit `test_stock_qty_zero_blocks_sellable` / `test_quantity_exceeds_stock_qty` | regras puras |

**Resultado validado:** 14 passed (inventory + purchase_limits).

---

## 7. Deploy notes

1. Rodar migration `l1a2b3c4d5e6` no Postgres do ambiente (já aplicada no Railway prod proxy nesta sessão).
2. Redeploy **api** para código de inventário.
3. Web opcional (só tipos admin).

---

## 8. Fora de escopo

- Reserva no create-session (hold) — só gate + decrement no paid.
- Restock em cancel/refund.
- UI admin form completa para stockQty (API pronta).
- PayPal.

---

## 9. Próxima fase

**M** — remoção definitiva de mocks de domínio no FE (`src/lib/mock`), deps B–D + J.

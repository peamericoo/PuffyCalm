# PHASE G COMPLETE — Admin UI pedidos

| Campo | Valor |
|-------|--------|
| **Fase** | G — Admin UI pedidos |
| **Data** | 2026-07-21 |
| **Commit** | `e34999c` |
| **DoD atingido** | **SIM** (lista + detalhe + patch status; loading/empty/error; tsc clean) |

---

## 1. Objetivo

Painel Next consome a API da Fase F com **dados reais** (cookies JWT da Fase E). Sem métricas inventadas no dashboard.

---

## 2. Rotas

| Path | Componente | Dados |
|------|------------|--------|
| `/admin` | Home + bridge (E) + link Orders | Auth.js + ping |
| `/admin/orders` | `OrdersListView` | `GET /api/v1/admin/orders` |
| `/admin/orders/[id]` | `OrderDetailView` | `GET` + `PATCH /api/v1/admin/orders/{id}` |

**Gate FE (UX):** Auth.js role `admin` \| `staff` — sem sessão → redirect `/admin`; customer → `/account`.  
**Gate real:** FastAPI `RequireStaff` via cookies `pc_*` (`credentials: "include"` + `ensureAdminBackendSession`).

---

## 3. UX entregue

### Lista (`/admin/orders`)

- Filtro por status (todos os valores da máquina de estados).
- Paginação (pageSize 20, Previous/Next).
- Tabela desktop + cards mobile.
- Estados: **loading**, **empty** (sem fake), **error**, **auth_error** (401/403 + link para bridge).
- Refresh manual.

### Detalhe (`/admin/orders/[id]`)

- Itens, totais (cents → money), shipping address, payment IDs Stripe, timeline.
- Select de status só com **transições permitidas** (espelho de `order_rules.py`).
- Textarea `adminNotes` + Save → PATCH.
- Terminal (`delivered` / `cancelled`): sem transição de status.
- Mensagens de erro de transição ilegal (409) e empty patch.
- Refresh recarrega do BE (prova DoD “patch reflete após refresh”).

### Mobile

- Desktop-first; lista em cards e detalhe empilhado em viewports estreitos — **usável o suficiente** para ops.

### Proibido / fora de escopo

- Dashboard com números inventados.
- Products CRUD (H).
- CMS.
- Alterações no storefront de compra.

---

## 4. Arquivos

### Criados

- `src/lib/api/admin-orders.ts` — list / get / patch client
- `src/lib/admin/order-status.ts` — labels + `ADMIN_TRANSITIONS` (mirror BE)
- `src/components/admin/admin-nav.tsx`
- `src/components/admin/admin-page-header.tsx`
- `src/components/admin/order-status-badge.tsx`
- `src/components/admin/orders-list-view.tsx`
- `src/components/admin/order-detail-view.tsx`
- `src/app/(admin)/admin/orders/page.tsx`
- `src/app/(admin)/admin/orders/[id]/page.tsx`
- `docs/phases/PHASE_G_COMPLETE.md`

### Alterados

- `src/app/(admin)/admin/page.tsx` — link “Open orders”
- `docs/phases/STATUS.md`
- `docs/CONTINUE.md`

---

## 5. Como validar

1. Sign-in Google allowlisted em `/admin` → bridge ping 200.
2. Abrir `/admin/orders` — pedidos reais/smoke da API aparecem (ou empty real se DB vazio).
3. Abrir um pedido → mudar status permitido (ex. `paid` → `processing`) + notes → Save.
4. Refresh da página → status/notes do BE.
5. `npx tsc --noEmit` — exit 0.

```bash
# API still works without UI (password login smoke)
curl -sS -c /tmp/pc.txt -b /tmp/pc.txt \
  -H 'Content-Type: application/json' \
  -d '{"email":"<ADMIN_EMAIL>","password":"<ADMIN_PASSWORD>"}' \
  http://localhost:8080/api/v1/auth/login

curl -sS -b /tmp/pc.txt \
  'http://localhost:8080/api/v1/admin/orders?page=1&pageSize=5'
```

**URLs**

| Ambiente | Base admin |
|----------|------------|
| Local | `http://localhost:3000/admin` · `/admin/orders` |
| Prod | `https://web-production-ea635.up.railway.app/admin` · `/admin/orders` |

API: `NEXT_PUBLIC_API_URL` (prod: `https://api-production-4f01.up.railway.app`).  
Cookies cross-site: `COOKIE_SAMESITE=none` no serviço **api** (Fase E).

---

## 6. Definition of Done

| Critério | Status |
|----------|--------|
| Rotas `/admin/orders` + `/admin/orders/[id]` | **SIM** |
| Lista real + detalhe real | **SIM** |
| Mudar status via API F | **SIM** |
| Sem dashboard fake | **SIM** |
| loading / empty / error | **SIM** |
| Mobile usável (documentado desktop-first) | **SIM** |
| Sem products CRUD / CMS / storefront break | **SIM** |
| tsc | **SIM** |
| PHASE_G_COMPLETE + STATUS + commit | **SIM** |

---

## 7. Próxima fase

**Fase H — Admin products API + UI**  
Deps: E + B (catálogo FE já na API).  
CRUD produtos, publish, categories/specs/image URLs; revalidate.

Prompt: `docs/PHASE_PROMPTS.md` → Fase H.

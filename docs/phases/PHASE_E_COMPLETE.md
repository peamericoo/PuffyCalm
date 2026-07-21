# PHASE E COMPLETE — Admin auth bridge

| Campo | Valor |
|-------|--------|
| **Fase** | E — Admin auth bridge |
| **Data** | 2026-07-21 |
| **Escolha** | **E1** (Google → JWT cookies no FastAPI) |
| **DoD atingido** | **SIM** (código + testes unitários/integrados com mock Google) |

---

## 1. Objetivo

`paletot.business@gmail.com` (e allowlist) é admin **no backend**, não só no Auth.js do frontend.  
Barreira real: JWT HttpOnly no API + RBAC; FE allowlist permanece só UX.

---

## 2. Escolha E1 vs E2 e por quê

| Opção | Descrição | Decisão |
|-------|-----------|---------|
| **E1** | Bridge Google OAuth (Auth.js) → `POST /auth/google-exchange` → cookies `pc_access` / `pc_refresh` se email ∈ allowlist | **Escolhida** |
| E2 | Login password JWT no painel; Google só storefront | Não |

**Por quê E1:**

1. Owner já opera com Google (`paletot.business@gmail.com`) no Auth.js — zero segundo login/senha a gerir no dia a dia.
2. Plano mestre recomenda E1; guest checkout e customers continuam no Auth.js sem afetar RBAC admin.
3. BE já tinha JWT + cookies + `/admin/ping`; a bridge só emite os mesmos cookies após prova OAuth (audience = `GOOGLE_CLIENT_ID`).
4. Password login (`POST /auth/login`) **permanece** para scripts/dev/seed — não removido.

---

## 3. Como configurar env (nomes apenas — sem secrets)

### API service (`api` / Railway)

| Variable | Obrigatório | Valor esperado |
|----------|-------------|----------------|
| `ADMIN_EMAILS` | **Sim** | Lista CSV, ex. o email Google do owner (sem espaços obrigatórios; trim no BE) |
| `ADMIN_EMAIL` | Recomendado | Fallback se `ADMIN_EMAILS` vazio; também seed password |
| `STAFF_EMAILS` | Opcional | CSV → role `staff` no Google bridge |
| `GOOGLE_CLIENT_ID` | **Sim** | **Mesmo** Client ID do OAuth Web do Next (`AUTH_GOOGLE_ID` no web) |
| `COOKIE_SAMESITE` | **Sim em prod Railway** | `none` (web e api em hosts diferentes `*.up.railway.app`) |
| `COOKIE_SECURE` | Com SameSite=None | `true` (ou `APP_ENV=production` → auto secure) |
| `CORS_ORIGINS` | Já | Deve incluir a URL do web (com credentials) |
| `SECRET_KEY` | Já | Assina JWT admin |

**Não commitar** valores de `SECRET_KEY`, `AUTH_GOOGLE_SECRET`, passwords.

### Web service (`web`)

| Variable | Notas |
|----------|--------|
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Auth.js Google (já existentes) |
| `ADMIN_EMAIL` / `STAFF_EMAILS` | UX allowlist FE only |
| `NEXT_PUBLIC_API_URL` | Base do FastAPI (browser chama com `credentials: "include"`) |

### Railway — comandos (owner)

```bash
# No workdir linkado ao projeto divine-consideration
railway variables --service api set ADMIN_EMAILS=paletot.business@gmail.com
railway variables --service api set GOOGLE_CLIENT_ID=<mesmo valor que AUTH_GOOGLE_ID no web>
railway variables --service api set COOKIE_SAMESITE=none
# COOKIE_SECURE: leave unset if APP_ENV=production (defaults secure)
# Redeploy api if variables do not auto-redeploy
```

Confirm presence (never print secret values in chat logs beyond names):

```bash
railway variables --service api
```

---

## 4. Fluxo de auth (como testar)

### A. Sem cookie/token → 401

```bash
curl -sS -o NUL -w "%{http_code}\n" \
  https://api-production-4f01.up.railway.app/api/v1/admin/ping
# esperado: 401
```

### B. Password admin (dev / seed) → 200

```bash
curl -sS -c /tmp/pc.txt -b /tmp/pc.txt \
  -H 'Content-Type: application/json' \
  -d '{"email":"<ADMIN_EMAIL>","password":"<ADMIN_PASSWORD>"}' \
  http://localhost:8080/api/v1/auth/login

curl -sS -b /tmp/pc.txt http://localhost:8080/api/v1/admin/ping
# esperado: 200 + role admin
```

### C. Google bridge (browser / prod)

1. Abrir `/admin` no storefront.
2. Sign in com Google allowlisted.
3. Client chama `POST /api/v1/auth/google-exchange` com `{ idToken }` e `credentials: "include"`.
4. UI **AdminBackendBridge** mostra `GET /api/v1/admin/ping → 200` + role/userId.
5. Customer Google (não allowlisted): exchange → **403**; ping sem cookie → **401**.
6. Staff allowlisted: ping **200**, `/admin/only-admin` → **403**.

### D. Pytest

```bash
# Unit (sem DB): allowlist parsing
cd backend && python -m pytest tests/test_google_exchange.py -k "admin_email" -q

# Integration (Postgres + Redis)
REQUIRE_READY=1 python -m pytest tests/test_auth_api.py tests/test_google_exchange.py -q
```

---

## 5. Definition of Done — evidência

| Critério | Status | Evidência |
|----------|--------|-----------|
| Escolha E1 documentada | **SIM** | §2 |
| `ADMIN_EMAILS` (ou fallback `ADMIN_EMAIL`) no BE | **SIM** | `config.admin_email_set` / `role_for_google_email` |
| `POST /auth/google-exchange` + cookies | **SIM** | `api/v1/auth.py` |
| Audience Google validada | **SIM** | `GOOGLE_CLIENT_ID` + tokeninfo |
| Auth admin válida → `/admin/ping` 200 | **SIM** | tests + bridge UI |
| Sem cookie → 401 | **SIM** | `test_admin_ping_unauthenticated` / existing RBAC |
| Customer / not allowlisted → 403 exchange | **SIM** | `test_google_exchange_customer_forbidden` |
| Staff → 403 em only-admin | **SIM** | `test_google_exchange_staff_cannot_only_admin` |
| FE `credentials: "include"` | **SIM** | `src/lib/api/admin-auth.ts` |
| FE allowlist UX only | **SIM** | admin page copy + bridge |
| Sem secrets no markdown | **SIM** | só nomes de vars |
| STATUS + commit | **SIM** | este log |

---

## 6. Arquivos criados / alterados

### Backend

- `app/core/config.py` — `ADMIN_EMAILS`, `STAFF_EMAILS`, `GOOGLE_CLIENT_ID`, helpers
- `app/application/auth/google.py` — verify ID token
- `app/application/auth/service.py` — `exchange_google_id_token`, upsert user
- `app/api/v1/auth.py` — `POST /google-exchange`
- `app/api/v1/schemas/auth.py` — `GoogleExchangeRequest`
- `tests/test_google_exchange.py` — unit + integration (mock Google)

### Frontend

- `src/auth.ts` — guarda `id_token` no JWT; expõe a admin/staff na session
- `src/types/next-auth.d.ts` — `googleIdToken`
- `src/lib/api/admin-auth.ts` — exchange / refresh / ping / ensure
- `src/components/admin/admin-backend-bridge.tsx` — prova ping no `/admin`
- `src/app/(admin)/admin/page.tsx` — monta bridge
- `src/components/auth/sign-out-button.tsx` — limpa cookies API no sign-out

### Docs / env examples

- `docs/phases/PHASE_E_COMPLETE.md` — este log
- `docs/phases/STATUS.md`, `docs/CONTINUE.md`, `docs/ops/ENV_CHECKLIST.md`
- `.env.example`, `.env.local.example`, `backend/README.md`

### Propositadamente fora de escopo

- CRUD pedidos/produtos (Fases F–H)
- Remoção de password login
- PayPal / inventory / CMS

---

## 7. Notas operacionais

1. **Cross-site cookies:** em Railway, web e api são sites distintos → `COOKIE_SAMESITE=none` + Secure, senão o browser não grava `pc_*` após `google-exchange`.
2. **ID token curto (~1h):** após exchange, refresh cookie (7d, path `/api/v1/auth`) mantém a sessão admin; se expirar tudo, re-login Google.
3. **Tokeninfo Google:** volume admin-only; se no futuro escalar, trocar por verificação JWKS local (`google-auth`).
4. **Users table:** Google-only cria user com password hash aleatório inutilizável; seed password do owner permanece se o email já existir.

---

## 8. Próxima fase

**Fase F — Admin orders API**  
`GET/PATCH /admin/orders` com RBAC já garantido por esta fase.

Prompt: `docs/PHASE_PROMPTS.md` → Fase F.

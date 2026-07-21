# Catálogo de falhas de segurança conhecidas — PuffyCalm

> **Audiência:** IA especialista em cibersegurança · IA de pentesting · owner  
> **Tipo:** inventário de achados (não é fix ainda)  
> **Última auditoria de origem:** 2026-07-21 (análise de meio de caminho pós fases A–N)  
> **Status do produto na auditoria:** fases **A–P done** (MVP operável) · residual rate-limit em docs/ops/RATE_LIMITS.md · · produção Railway `divine-consideration`  
> **Contratos que NÃO se quebram ao corrigir:** `docs/ops/CONTRACTS.md` (Stripe Custom, guest checkout, preços no BE, `stripe_events`)

---

## 0. Como usar este documento

### IA de cibersegurança (remediação)

1. Ler este arquivo **inteiro** + `docs/ops/CONTRACTS.md` + `docs/ops/ENV_CHECKLIST.md`.
2. Tratar cada `PC-SEC-XXX` como ticket: reproduzir → corrigir → teste de regressão → marcar status neste doc.
3. **Não** recriar checkout Stripe Custom nem forçar login no guest path.
4. Preferir fixes no **BE** quando o FE só mascara o problema (ex.: listagem de pedidos).

### IA de pentesting

1. Usar a **§7 Checklist de pentest** e cada finding como caso de teste.
2. Registrar evidências (request/response, screenshots, timestamps) em `docs/security/PENTEST_EVIDENCE/` (criar se necessário).
3. **Não** explorar destrutivamente em produção sem autorização escrita do owner.
4. Ambientes: preferir staging/local; produção só com regra de engagement explícita.

### Severidade (CVSS-like, prática)

| Nível | Código | Critério |
|-------|--------|----------|
| **Crítica** | C | Compromisso de conta admin, pagamento fraudulento em escala, RCE, vazamento massivo de PII/segredos |
| **Alta** | H | Acesso não autorizado a dados de pedidos/clientes, bypass de auth em superfície sensível, elevação de privilégio |
| **Média** | M | Impacto limitado, requer condições, info disclosure parcial, má configuração com mitigação parcial |
| **Baixa** | L | Hardening, defense-in-depth, UX/security hygiene, risco teórico baixo |
| **Info** | I | Observação, residual aceito temporariamente, controle positivo documentado |

### Status de finding

| Status | Significado |
|--------|-------------|
| `open` | Confirmado no código / comportamento; não corrigido |
| `accepted_risk` | Owner aceita até go-live ou com mitigação |
| `mitigated` | Controle parcial |
| `fixed` | Corrigido + teste |
| `needs_verify` | Suspeito; pentest deve confirmar em runtime |

---

## 1. Superfície de ataque (mapa)

### 1.1 Hosts (prod documentado)

| Superfície | URL (exemplo ENV) | Função |
|------------|-------------------|--------|
| Storefront web | `https://web-production-ea635.up.railway.app` | Next.js 16, Auth.js, cart, checkout UI, admin UI |
| API | `https://api-production-4f01.up.railway.app` | FastAPI, Postgres, Redis, Stripe, S3 proxy |
| Stripe | Dashboard + webhooks | Pagamentos |
| Google OAuth | Auth.js + BE google-exchange | Login cliente + bridge admin |
| Object storage | Railway S3-compatible | Imagens (privadas; serve via API) |

### 1.2 Papéis

| Papel | Como autentica | O que deveria acessar |
|-------|----------------|------------------------|
| Anônimo / guest | Nada | Catálogo, CMS home, checkout, track pedido (email+code) |
| Cliente Google | Auth.js JWT cookie (web) | Conta, “meus pedidos” **do próprio email** |
| Staff | Google + BE `pc_access`/`pc_refresh` | Admin orders/products/content/media (limitado) |
| Admin | Idem + role `admin` | Mesmo + operações privilegiadas |

### 1.3 Endpoints públicos sensíveis (foco pentest)

| Método | Path | Auth real |
|--------|------|-----------|
| `POST` | `/api/v1/checkout/sessions` | **Nenhuma** (guest) |
| `GET` | `/api/v1/orders/{id}?email=` | Email query = “prova” fraca |
| `GET` | `/api/v1/orders/lookup?email=&code=` | Email + public code |
| `GET` | `/api/v1/orders/by-email?email=` | **Nenhuma** (só query email) — **PC-SEC-001** |
| `POST` | `/api/v1/webhooks/stripe` | Assinatura Stripe (se secret set) |
| `GET` | `/media/{object_key}` | Pública (prefixo `products/`) |
| `GET` | `/docs`, `/redoc`, `/openapi.json` | Pública por default FastAPI |
| `POST` | `/api/v1/auth/login` | Password (admin seed) |
| `POST` | `/api/v1/auth/google-exchange` | Google ID token |
| `POST` | `/api/v1/auth/refresh` | Cookie refresh |
| Admin `*` | `/api/v1/admin/*` | JWT cookie/Bearer + role |

### 1.4 Controles **já positivos** (não reabrir sem motivo)

| Controle | Onde | Nota |
|----------|------|------|
| Preço autoritativo no BE | `POST /checkout/sessions` + `application/checkout/service.py` | FE envia só `productId`+`qty` |
| Stripe secret só no API | env `STRIPE_SECRET_KEY` | Nunca `NEXT_PUBLIC_*` |
| Webhook assinado em prod | `webhooks.py` | Dev pode unsigned se secret vazio |
| Idempotência paid | `stripe_events` + inventory L | Double webhook não deve pagar 2× |
| Media: sem SVG | `validation.py` | Magic bytes + allowlist MIME |
| Media path traversal básico | `main.py` serve_media | Bloqueia `..` e exige `products/` |
| Admin data API | `RequireStaff` / `RequireAdmin` em `deps.py` | Barreira real de dados admin |
| Sem `dangerouslySetInnerHTML` no FE storefront (grep 2026-07-21) | `src/` | Reduz XSS stored via React text |

---

## 2. Catálogo de findings

---

### PC-SEC-001 — Listagem de pedidos por email sem autenticação

| Campo | Valor |
|-------|--------|
| **Severidade** | **Alta (H)** |
| **Status** | `open` |
| **CWE** | CWE-862 (Missing Authorization), CWE-284, CWE-200 |
| **OWASP** | A01 Broken Access Control |
| **Camada** | Backend API (FE mascara, **não mitiga**) |
| **Fase origem** | K (Account orders) — design “email-as-proof” |
| **Descoberto** | 2026-07-21 auditoria mid-path |

#### Descrição

`GET /api/v1/orders/by-email?email=` retorna a lista paginada de **todos** os pedidos cujo email de checkout bate (case-insensitive), **sem** JWT, cookie de sessão, nem qualquer outro segredo.

O frontend (`src/app/(storefront)/account/orders/page.tsx`) só chama com `session.user.email` no Server Component — isso **não impede** chamada direta à API.

#### Evidência de código

| Arquivo | Detalhe |
|---------|---------|
| `backend/app/api/v1/orders.py` | `list_orders_by_email` — só valida email não-vazio |
| `src/lib/api/orders.ts` | `listOrdersByEmail` — `fetch` sem credentials/auth |
| `src/app/(storefront)/account/orders/page.tsx` | RSC usa sessão Google mas API não verifica |
| `backend/tests/test_customer_orders_api.py` | Testes **aceitam** listagem sem auth (documentam o bug) |
| `docs/phases/PHASE_K_COMPLETE.md` | Explicitamente “email-as-proof” |

#### Dados expostos por item de lista

- `id` (order id)
- `publicCode` (PC-…)
- `email`
- `status`, totais (`subtotalCents`, `shippingCents`, `totalCents`)
- `paidAt`, `createdAt`
- `items[]`: productId, slug, name, qty, unit/line prices, imageUrl
- `shippingAddress` embutido no shape de order (via `_list_item` → items + campos de order; ver se address está no list item — **list item inclui items mas verificar se shipping está só em OrderOut completo**)

> Nota para pentest: confirmar no response JSON se `shippingAddress` vem no list item ou só no GET por id/lookup. Em `CustomerOrderListItemOut` o código de `_list_item` **não** inclui shipping no snippet auditado — mas items + email + totais + código já são PII/comercial sensível. GET completo por id com email ainda expõe endereço.

#### Pré-condições de ataque

1. Conhecer ou enumerar um email de cliente (vazamento, suporte, typosquatting, compra teste).
2. Acesso HTTP à API pública (sem VPN).

#### Passos de reprodução (pentest)

```http
GET /api/v1/orders/by-email?email=VICTIM@example.com&pageSize=50
Host: api-production-….up.railway.app
Accept: application/json
```

Esperado (hoje): `200` com `items[]` se houver pedidos.  
Esperado (após fix): `401`/`403` sem prova de posse do email.

#### Impacto

- Violação de privacidade (histórico de compras, preferências, horários).
- Facilita phishing (“vi seu pedido PC-…”).
- Com `publicCode` + email, lookup guest e social engineering ficam mais fáceis.
- Em volume: scraping de emails → lista de clientes.

#### Remediação recomendada (para IA de fix)

**Opção A (preferida):** remover endpoint público; criar:

- `GET /api/v1/orders/me` autenticado por:
  - Auth.js session → Next route handler BFF com token server-only, **ou**
  - Bearer derivado de Google exchange **somente para role customer** (hoje exchange é admin-only — redesign), **ou**
  - Assinatura HMAC server-side: Next RSC assina `{email, exp}` e API verifica com secret compartilhado.

**Opção B (mínima):** exigir header `Authorization` com JWT de cliente (novo role `customer` no BE).

**Opção C (aceitável short-term, fraca):** rate-limit agressivo + CAPTCHA + não retornar items detalhados — **não resolve** IDOR real.

**Não fazer:** “só esconder no FE”.

#### Testes de regressão

- Sem auth → 401.
- Auth email A não lista pedidos de email B.
- Guest lookup (email+code) continua funcionando.
- Success page `GET /orders/{id}?email=` revisada em conjunto (PC-SEC-002).

#### Prioridade fix

**P0 antes de tráfego real com PII de clientes.**

---

### PC-SEC-002 — Prova de posse de pedido = apenas email (GET por id)

| Campo | Valor |
|-------|--------|
| **Severidade** | **Média (M)** → **Alta** se order IDs vazarem em analytics/logs |
| **Status** | `open` |
| **CWE** | CWE-639 (Authorization Bypass Through User-Controlled Key), CWE-284 |
| **Camada** | Backend |
| **Fase** | Checkout / success (pré-K, mantido) |

#### Descrição

`GET /api/v1/orders/{order_id}?email=` libera o pedido completo se o email query string casar com o email do pedido. O `order_id` é gerado como prefix + 16 hex de UUID (`_id` em checkout service) — **não é guessable trivial**, mas **não é secret** se vazar (URL success, referrer, browser history, logs Stripe metadata, suporte).

#### Evidência

| Arquivo | Detalhe |
|---------|---------|
| `backend/app/api/v1/orders.py` | `get_order` |
| `src/lib/api/checkout.ts` | `getOrder(orderId, email)` |
| Success page storefront | passa id+email na query |

#### Ataque

1. Atacante obtém `order_id` (log, screenshot, shared link, browser).
2. Tenta emails comuns ou o email já conhecido.
3. Email errado → 404 (não diferencia muito); email certo → full order + shipping address.

#### Remediação

- Token opaco de sessão de success (HMAC de `order_id|email|exp`) na URL em vez de email raw.
- Ou cookie HttpOnly one-time “order access” set no create session.
- Manter guest track via **email + publicCode** (PC-SEC-003) como path principal de suporte.

#### Pentest

- Confirmar entropia real do `order_id`.
- Verificar se `sync=true` muda comportamento de forma abusável (força reconcile Stripe).

---

### PC-SEC-003 — Entropia limitada do `publicCode` (PC-XXXXXXXX)

| Campo | Valor |
|-------|--------|
| **Severidade** | **Baixa–Média (L/M)** com email; **Alta** se lookup for só por código |
| **Status** | `open` (mitigado parcialmente: exige email) |
| **CWE** | CWE-330 (Insufficiently Random Values) — severidade depende do uso |
| **Camada** | Backend |

#### Descrição

```python
# backend/app/application/checkout/service.py
def _public_code() -> str:
    return f"PC-{secrets.token_hex(4).upper()}"  # 4 bytes = 32 bits
```

Espaço ≈ 4.29e9 códigos. Com **email + código** (lookup), brute force online é caro **se** houver rate limit — **não há rate limit hoje (PC-SEC-010)**.

Normalização aceita bare hex 8 chars e prefixa `PC-` (`normalize_public_code`).

#### Remediação

- Aumentar para `token_hex(8)` ou mais (16+ chars).
- Rate limit + lockout em `/orders/lookup`.
- Opcional: delay constante em 404.

---

### PC-SEC-004 — Google ID token exposto na session do browser (admin/staff)

| Campo | Valor |
|-------|--------|
| **Severidade** | **Média (M)** |
| **Status** | `open` |
| **CWE** | CWE-522, CWE-200 |
| **Camada** | Frontend Auth.js |
| **Fase** | E1 admin bridge |

#### Descrição

Em `src/auth.ts`:

- No callback `jwt`, se Google login: `token.googleIdToken = account.id_token`.
- No callback `session`, se role admin/staff: `session.googleIdToken = …` → **disponível no client** (`useSession` / props).

O bridge (`exchangeGoogleIdToken`) usa esse token no browser com `credentials: "include"` para setar cookies no host da API.

#### Impacto

- Qualquer XSS no domínio web (ou extensão maliciosa lendo storage/DOM de session client-exposed) pode roubar o ID token enquanto válido (~1h Google).
- Com ID token + allowlist BE, atacante faz `POST /auth/google-exchange` e obtém `pc_access`/`pc_refresh` se o email estiver em `ADMIN_EMAILS`/`STAFF_EMAILS`.

#### Remediação

1. **Não** colocar `googleIdToken` no objeto `session` client-facing.
2. Fazer exchange em **Route Handler / Server Action** no Next (server-only), com cookie de sessão Auth.js.
3. Alternativa: one-time code server-side pós-login.
4. Reduzir lifetime; limpar claim após first successful exchange.

#### Pentest

- Login admin → inspecionar payload session/JWT decodificável no client.
- Confirmar se token ainda está após refresh de página e após 1h.

---

### PC-SEC-005 — Admin UI gated só por Auth.js role; sem middleware de rota

| Campo | Valor |
|-------|--------|
| **Severidade** | **Baixa–Média (L/M)** (dados protegidos na API se RequireStaff ok) |
| **Status** | `open` |
| **CWE** | CWE-425, CWE-862 (defense in depth) |
| **Camada** | Frontend |

#### Descrição

- Cada página admin faz `auth()` + `role === admin|staff` e `redirect`.
- **Não existe** `src/middleware.ts` / edge matcher para `/admin/*`.
- Role no FE vem de `roleForEmail` em `src/lib/auth/constants.ts` (allowlist env), **independente** do BE até o bridge.

#### Impacto

- UI leakage (estrutura admin) para quem for allowlist FE mas não BE — ou vice-versa se env desalinhado.
- Se no futuro algum client component chamar API sem cookie por bug, ou endpoint admin sem `RequireStaff`, impacto sobe.
- Revalidate route (`src/app/api/admin/revalidate/route.ts`) usa **só** Auth.js role FE — pode invalidar cache CDN/ISR sem BE staff se email estiver só no FE allowlist.

#### Remediação

- Next middleware `matcher: ['/admin/:path*']`.
- Alinhar allowlists FE/BE; idealmente role **só** do BE após exchange.
- Revalidate: exigir prova BE (cookie API) ou secret assinado server-side.

---

### PC-SEC-006 — Defaults inseguros de admin password / SECRET_KEY / emails

| Campo | Valor |
|-------|--------|
| **Severidade** | **Alta (H)** se defaults ativos em prod; **Info** se env prod força override |
| **Status** | `needs_verify` em prod · `open` no código |
| **CWE** | CWE-798 (Hard-coded Credentials), CWE-1188 |
| **Camada** | Backend config + seed |

#### Descrição (`backend/app/core/config.py`)

| Setting | Default no código |
|---------|-------------------|
| `secret_key` | `change-me-in-production-min-32-chars!!` |
| `admin_email` | `paletot.business@gmail.com` |
| `admin_password` | `changeme-admin-dev` |
| `staff_email` | `staff@puffycalm.com` |
| `staff_password` | `changeme-staff-dev` |
| `app_debug` | `True` |

`assert_secret_configured` **falha em non-dev** se secret começa com `change-me` — bom.  
Password login `POST /auth/login` **permanece** para scripts/dev — se seed criou user com password default e prod não rotacionou → **login com senha fraca**.

FE: `ADMIN_EMAIL` default igual em `src/lib/auth/constants.ts`.

#### Pentest

```http
POST /api/v1/auth/login
{"email":"paletot.business@gmail.com","password":"changeme-admin-dev"}
```

e variantes staff. Em prod deve falhar ou user inexistente com senha fraca desabilitada.

#### Remediação

- Desabilitar password login quando `APP_ENV=production` (só Google exchange).
- Seed: forçar password aleatória + one-time se password path existir.
- Remover defaults de email/password do código (obrigar env).
- Rotacionar SECRET_KEY e invalidar refresh jtis no Redis.

---

### PC-SEC-007 — Login password + Google exchange retornam `accessToken` no JSON body

| Campo | Valor |
|-------|--------|
| **Severidade** | **Média (M)** |
| **Status** | `open` (by design para curl; risco browser) |
| **CWE** | CWE-922, CWE-200 |
| **Camada** | Backend auth |

#### Descrição

`login` e `google-exchange` setam cookies HttpOnly **e** retornam `accessToken` no JSON (`include_token=True`).

Se o browser/JS admin guarda ou loga o body, o token fica em memória JS (XSS-exposable), além do cookie.

#### Remediação

- Query `?include_token=true` só para non-browser; default cookies-only.
- FE admin nunca logar response body completo.

---

### PC-SEC-008 — Cookies cross-origin (SameSite / Secure / Domain) — misconfig risk

| Campo | Valor |
|-------|--------|
| **Severidade** | **Alta** se misconfigured (auth break ou cookie largo); **Média** residual |
| **Status** | `needs_verify` runtime |
| **CWE** | CWE-1275, CWE-614 |
| **Camada** | API cookies + CORS |

#### Descrição

Web host ≠ API host no Railway. Admin precisa:

- `COOKIE_SAMESITE=none`
- `COOKIE_SECURE=true` (auto se `APP_ENV=production`)
- `CORS_ORIGINS` com origin exato do web + `credentials`

Default código: `cookie_samesite=lax` — **quebra** cross-site cookie set se não override em prod.

#### Ataques / falhas

1. **Auth quebrada** (ops) se SameSite=Lax cross-origin.
2. Se `CORS_ORIGINS=*` com credentials → browsers bloqueiam; se lista errada inclui origin malicioso → CSRF-like de cookie auth em endpoints state-changing (ver PC-SEC-009).
3. `cookie_domain` amplo demais compartilharia cookie entre subdomínios.

#### Pentest

- Inspecionar `Set-Cookie` em `google-exchange` em prod: `SameSite=None; Secure; HttpOnly`.
- Tentar origin não listado com credentialed request.

---

### PC-SEC-009 — CSRF em mutações admin (cookie auth cross-site)

| Campo | Valor |
|-------|--------|
| **Severidade** | **Média (M)** com SameSite=None |
| **Status** | `open` |
| **CWE** | CWE-352 |
| **Camada** | Backend admin + CORS |

#### Descrição

Admin mutações (`PATCH` orders, products, content, `POST` media) usam cookies `pc_*` + CORS allowlist. Com `SameSite=None`, browser envia cookies em requests cross-site **se** CORS refletir/allow origin.

Proteção atual:

- CORS allowlist (não `*`)
- Sem anti-CSRF token custom
- Sem `Origin`/`Referer` strict check além do CORS middleware

Se um origin malicioso for adicionado por engano a `CORS_ORIGINS`, CSRF admin torna-se prático.

#### Remediação

- Double-submit CSRF ou header custom `X-Requested-With` exigido + rejeitar sem Origin trusted.
- Preferir `SameSite=Lax` com **mesmo site** (reverse proxy path `/api` no domínio web) — melhor arquitetura.
- `POST` only com Content-Type JSON (já ajuda um pouco vs form CSRF simples).

---

### PC-SEC-010 — Ausência total de rate limiting

| Campo | Valor |
|-------|--------|
| **Severidade** | **Média (M)** (habilita abuso de PC-SEC-001/003/006) |
| **Status** | `open` |
| **CWE** | CWE-307, CWE-770 |
| **Camada** | API (e possivelmente web) |

#### Descrição

Grep 2026-07-21: **nenhum** `rate limit` / `slowapi` / throttle no monorepo.

Alvos de abuso:

| Endpoint | Abuso |
|----------|--------|
| `/auth/login` | Password spray |
| `/auth/google-exchange` | Token stuffing / replay |
| `/orders/by-email` | Enumeração / scraping PII |
| `/orders/lookup` | Brute publicCode+email |
| `/checkout/sessions` | Spam orders / Stripe load / stock noise |
| `/admin/media` | Upload flood (auth required) |
| Auth.js `/login` Google | Depende de Google |

#### Remediação

- Redis rate limit por IP + por email/key.
- Especialmente rígido em auth e order lookup.
- WAF Railway / reverse proxy rules.

---

### PC-SEC-011 — OpenAPI /docs públicos em produção

| Campo | Valor |
|-------|--------|
| **Severidade** | **Baixa (L)** (info disclosure de superfície) |
| **Status** | `open` |
| **CWE** | CWE-200 |
| **Camada** | FastAPI `main.py` |

#### Descrição

```python
docs_url="/docs",
redoc_url="/redoc",
openapi_url="/openapi.json",
```

Sem gate por env. Facilita mapeamento de endpoints (incl. admin paths names).

#### Remediação

- `docs_url=None` quando `APP_ENV=production`.
- Ou Basic auth / IP allowlist.

---

### PC-SEC-012 — Webhook Stripe unsigned permitido em development

| Campo | Valor |
|-------|--------|
| **Severidade** | **Info** se só dev; **Crítica** se `APP_ENV` errado em prod |
| **Status** | `needs_verify` env prod |
| **CWE** | CWE-345, CWE-347 |
| **Camada** | `webhooks.py` |

#### Descrição

Se `stripe_webhook_secret` vazio:

- **non-development** → 503 (bom)
- **development** → aceita JSON raw sem assinatura (`stripe_webhook_unsigned_dev_mode`)

#### Pentest / ops

- Confirmar `APP_ENV=production` e `STRIPE_WEBHOOK_SECRET` set no Railway api.
- Tentar POST sem signature em prod → deve falhar.

#### Impacto se bypass

Marcar pedidos pagos, decrementar stock, fulfillment fraud — **crítico**.

---

### PC-SEC-013 — Dual allowlist FE vs BE para admin (dessincronia)

| Campo | Valor |
|-------|--------|
| **Severidade** | **Média (M)** |
| **Status** | `open` (design) |
| **Camada** | FE `ADMIN_EMAIL`/`STAFF_EMAILS` + BE `ADMIN_EMAILS`/`STAFF_EMAILS` |

#### Descrição

- FE: `roleForEmail` → session.user.role → mostra UI admin + revalidate.
- BE: google-exchange allowlist → cookies → admin API.

**Casos:**

| FE allow | BE allow | Resultado |
|----------|----------|-----------|
| sim | não | UI admin sem dados / erros 401 — confuso; revalidate ainda possível (PC-SEC-005) |
| não | sim | API ok se cookie existir; UI esconde |
| sim | sim | ok |

#### Remediação

- Single source of truth no BE; FE só mostra admin após `ping` 200.
- Documentar runbook de allowlist em `ENV_CHECKLIST`.

---

### PC-SEC-014 — `allowDangerousEmailAccountLinking: true` (Auth.js)

| Campo | Valor |
|-------|--------|
| **Severidade** | **Baixa–Média (L/M)** |
| **Status** | `open` |
| **Camada** | `src/auth.ts` |
| **CWE** | CWE-287 (contexto OAuth account linking) |

#### Descrição

Flag do Auth.js permite linkar contas pelo email entre providers. Hoje só Google — risco baixo. Se no futuro adicionar credentials/email magic link, risco de account takeover sobe.

#### Remediação

- Manter Google-only **ou** desabilitar flag e entender tradeoff.
- Sempre exigir `email_verified` (já parcialmente: rejeita se `email_verified === false`).

---

### PC-SEC-015 — Checkout público sem autenticação (esperado) — abusos laterais

| Campo | Valor |
|-------|--------|
| **Severidade** | **Média (M)** abuso de recurso / fraude operacional |
| **Status** | `open` (guest é requisito de negócio) |
| **CWE** | CWE-770 |
| **Camada** | Checkout API |

#### Descrição

Guest checkout é **contrato sagrado**. Não é bug de auth, mas superfície de abuso:

- Criar milhares de Checkout Sessions / Orders pending.
- Esgotar stock reservations se no futuro houver hold.
- Custo Stripe API / frete mental ops.
- Emails lixo em DB.

#### Controles desejados

- Rate limit por IP.
- CAPTCHA no step de pagamento (opcional).
- Limite de open unpaid orders por email/IP.
- Validação forte de shipping address (já há módulos address).
- Não aceitar price do client (**já ok**).

#### Nota de integridade monetária (positivo)

FE cart Zustand pode ter preço stale — **não** é falha de pagamento se BE reprecifica. Risco residual: UX de “preço mudou no pay” (não security-critical).

---

### PC-SEC-016 — Inventory: sem restock automático em cancel; race conditions

| Campo | Valor |
|-------|--------|
| **Severidade** | **Baixa–Média (L/M)** negócio / oversell edge |
| **Status** | `accepted_risk` parcial (documentado Fase L) |
| **Camada** | Backend inventory |

#### Descrição

- Decremento só em `mark_order_paid` (bom).
- Idempotência multi-camada (bom).
- **Sem** restock em cancel (STATUS residual).
- Oversell se dois checkouts simultâneos com stock=1 antes do paid (depende se validação é só no create session e paid).

#### Pentest

- Dois checkouts paralelos stock=1 → quantos paid succeed?
- Webhook duplicado → stock decrement 1× only.

#### Remediação go-live

- Lock row `SELECT FOR UPDATE` no deduct.
- Opcional reserve-on-session + TTL.

---

### PC-SEC-017 — Media proxy público + Content-Type S3

| Campo | Valor |
|-------|--------|
| **Severidade** | **Baixa (L)** |
| **Status** | `open` / hardening |
| **Camada** | `GET /media/{key}` |

#### Controles atuais (bons)

- Prefix `products/` only
- Bloqueio `..`
- Local resolve path under root
- Upload: magic bytes, no SVG, max 5 MiB

#### Riscos residuais

- GIF/WebP animados / polyglot files (baixo se só `<img>`).
- Se admin comprometer upload → serve malware downloadable (users abrindo URL direta).
- `Content-Disposition` não forçado como `inline` vs `attachment`.
- Cache `immutable` 86400 — conteúdo trocado no mesmo key improvável (UUID no key).

#### Remediação

- `Content-Security-Policy` no storefront para images.
- `X-Content-Type-Options: nosniff` no proxy media.
- Opcional re-encode image server-side (strip metadata).

---

### PC-SEC-018 — CMS content: href e imageUrl controlados por admin

| Campo | Valor |
|-------|--------|
| **Severidade** | **Baixa (L)** se só staff confiável; **Alta** se staff malicioso |
| **Status** | `open` (trust admin) |
| **Camada** | Content API + FE home |

#### Descrição

Admin (staff) edita hero slides: `ctaHref`, `imageUrl` (http/https ou `/media/`).

Validação BE (`content/service.py`): href regex, image url scheme.

Riscos se staff compromised:

- `javascript:` se regex fraca — **pentest deve testar** `_HREF_RE`.
- Open redirect para phishing (`//evil.com`).
- `imageUrl` externo tracking/pixel.

FE renderiza como React text/attrs (sem HTML raw) — **bom** vs XSS HTML.

#### Pentest

- Tentar `ctaHref`: `javascript:alert(1)`, `data:`, `//evil`, `\tjavascript:`.
- Unicode homoglyphs.

---

### PC-SEC-019 — Next.js revalidate endpoint como DoS de cache

| Campo | Valor |
|-------|--------|
| **Severidade** | **Baixa (L)** |
| **Status** | `open` |
| **Camada** | `POST /api/admin/revalidate` (web) |

#### Descrição

Autenticado como FE admin/staff (Auth.js only). Pode `revalidateTag`/`revalidatePath` em massa → origem hits na API (custo/perf), não vazamento de dados.

#### Remediação

- Rate limit; exigir BE staff cookie; body size limits.

---

### PC-SEC-020 — PII em query strings (email, order id, code)

| Campo | Valor |
|-------|--------|
| **Severidade** | **Média (M)** privacy / logs |
| **Status** | `open` |
| **CWE** | CWE-598 |
| **Camada** | FE + API |

#### Descrição

Emails e códigos em:

- `/account/orders?email=&code=`
- Success URLs
- API query params

Vazam via: Referer, browser history, server access logs, analytics, shared screenshots.

#### Remediação

- Preferir POST body para lookup.
- Success token opaco (PC-SEC-002).
- Não logar query string completa no access log.

---

### PC-SEC-021 — `trustHost: true` + `AUTH_TRUST_HOST` (Auth.js)

| Campo | Valor |
|-------|--------|
| **Severidade** | **Baixa–Média** se host header injection mal configurado atrás de proxy |
| **Status** | `needs_verify` |
| **Camada** | `src/auth.ts` |

#### Descrição

Necessário em Railway proxy. Risco clássico: host header poisoning → redirects OAuth maliciosos se proxy não strip/força Host.

#### Remediação

- Garantir que só o edge Railway define host canônico.
- `AUTH_URL` fixo canônico em prod.
- Testar `Host: evil.com` não altera callback.

---

### PC-SEC-022 — Stripe test mode em produção documentada

| Campo | Valor |
|-------|--------|
| **Severidade** | **Info / negócio** (não vuln clássica) |
| **Status** | `accepted_risk` até go-live P |
| **Fonte** | `ENV_CHECKLIST.md` — `sk_test` / `pk_test` em Fase A |

#### Descrição

Pagamentos de verdade não cobram se keys test. Go-live P deve trocar live keys + webhook live + política PCI (Stripe Elements já reduz SAQ).

#### Checklist P

- [ ] Live keys
- [ ] Webhook endpoint live
- [ ] Desabilitar test cards UX se necessário
- [ ] Revisar metadata enviada ao Stripe (PII mínima)

---

### PC-SEC-023 — Security headers / CSP não auditados

| Campo | Valor |
|-------|--------|
| **Severidade** | **Média (M)** defense-in-depth |
| **Status** | `needs_verify` |
| **Camada** | Next config + Railway |

#### Descrição (auditoria estática)

Não foi encontrado pacote dedicado de security headers no escopo da mid-path. Pendente verificar em runtime:

- `Content-Security-Policy`
- `X-Frame-Options` / `frame-ancestors`
- `Strict-Transport-Security`
- `Referrer-Policy`
- `Permissions-Policy`

#### Remediação

- `next.config` headers + CSP com Stripe/Google OAuth allowlist.

---

### PC-SEC-024 — Dependency / supply-chain (não escaneado nesta auditoria)

| Campo | Valor |
|-------|--------|
| **Severidade** | **needs_verify** |
| **Status** | `needs_verify` |
| **Camada** | npm + pip |

#### Ação para pentest / sec AI

- `npm audit` / `pnpm audit`
- `pip-audit` / `safety`
- Lockfiles commitados?
- GitHub Dependabot / OSV

---

### PC-SEC-025 — Logs e error messages podem vazar detalhe

| Campo | Valor |
|-------|--------|
| **Severidade** | **Baixa (L)** |
| **Status** | `needs_verify` |
| **Camada** | FE `console.error` + BE logs |

#### Descrição

`ErrorState` faz `console.error(logLabel, error)` no client — digest Next pode aparecer. BE `app_debug=True` default — em prod deve ser false.

#### Remediação

- Nunca retornar stack traces em JSON prod.
- Structured logs sem PII completa (mask email).

---

### PC-SEC-026 — Sessão Auth.js 30 dias + role embutida no JWT

| Campo | Valor |
|-------|--------|
| **Severidade** | **Baixa (L)** |
| **Status** | `open` |
| **Camada** | `src/auth.ts` `maxAge: 30 days` |

#### Descrição

Role derivada de email allowlist no JWT. Se remover email da allowlist, JWT antigo pode manter role até expirar/re-login (depende se `jwt` callback reavalia todo request — **sim**, `token.role = roleForEmail(...)` a cada refresh do token jwt callback).

Verificar se jwt callback roda em cada request session update — em Auth.js v5 JWT strategy, callbacks rodam em update; role re-lida do email do token + env atual → remoção de allowlist **pode** rebaixar no próximo jwt() — pentest deve confirmar.

#### Remediação

- Session maxAge menor para admin.
- Forçar sign-out allowlist change runbook.

---

### PC-SEC-027 — Enumeração de existência de pedidos / emails

| Campo | Valor |
|-------|--------|
| **Severidade** | **Baixa–Média (L/M)** |
| **Status** | `open` |
| **Camada** | Orders API |

#### Descrição

- `by-email` com email sem pedidos → `200` items=[] (confirma API viva; não prova conta).
- Lookup errado → `404 not_found` genérico (bom).
- Combinado com PC-SEC-001, email **com** pedidos vaza dados.

#### Remediação

Cobre com PC-SEC-001 + rate limit.

---

### PC-SEC-028 — Falta de WAF / bot management / monitoring (O/P)

| Campo | Valor |
|-------|--------|
| **Severidade** | **Média (M)** operacional |
| **Status** | `open` (fase O pending) |
| **Camada** | Infra |

#### Descrição

Fase O (observability + tests) e P (go-live) ainda pending no STATUS. Sem:

- Alertas de spike 401/429/5xx
- Audit log de ações admin
- Detecção de scraping by-email

#### Remediação

Incluir na O/P + sec AI.

---

## 3. Matriz de prioridade sugerida

| Ordem | ID | Ação resumida | Antes de… |
|-------|-----|---------------|-----------|
| 1 | **PC-SEC-001** | Auth real em listagem de pedidos | Qualquer cliente real |
| 2 | **PC-SEC-006** | Verificar/disable password defaults em prod | Go-live |
| 3 | **PC-SEC-012** | Confirmar webhook secret + APP_ENV | Go-live |
| 4 | **PC-SEC-010** | Rate limit auth + orders + checkout | Tráfego público |
| 5 | **PC-SEC-004** | ID token só server-side | Admin em prod intenso |
| 6 | **PC-SEC-002/003/020** | Tokens opacos + entropia + menos PII em URL | Hardening P |
| 7 | **PC-SEC-008/009** | Cookie/CORS/CSRF model | Admin cross-origin estável |
| 8 | **PC-SEC-011/023/024** | Docs off, headers, deps | P |
| 9 | Restante | Hardening | Backlog |

---

## 4. Controles que o pentest deve **não** reportar como bug (falsos positivos comuns)

| Comportamento | Por quê é ok / contrato |
|---------------|-------------------------|
| Checkout sem login | Guest checkout obrigatório (`CONTRACTS.md`) |
| Carrinho com preço no localStorage | UX only; charge usa BE |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` no browser | Design Stripe |
| `GOOGLE_CLIENT_ID` público | OAuth public client id |
| Media GET público para `products/*` | CDN-like proxy intencional |
| Admin UI “só redirect” se API 401 | Dados no BE |

---

## 5. Regras de engajamento (pentest)

1. **Autorização:** owner (Pedro) deve autorizar escopo (prod vs staging).
2. **Fora de escopo default:** DoS volumetric destrutivo, social engineering a terceiros, phishing real a clientes.
3. **Dentro de escopo sugerido:**
   - AuthZ orders (001–003)
   - Admin bridge e cookies (004–009)
   - Defaults e login password (006)
   - Webhook (012)
   - Upload media (017)
   - CMS href (018)
   - Headers e deps (023–024)
4. **Dados:** usar emails de teste; não exfiltrar PII real de clientes.
5. **Relatório:** preencher tabela §8 e pasta `docs/security/PENTEST_EVIDENCE/`.

---

## 6. Arquitetura auth (referência para fixes)

```text
┌──────────── Storefront (web) ────────────┐
│  Auth.js Google → JWT session cookie     │
│  role = roleForEmail(ADMIN/STAFF env)    │  ← UX only (PC-SEC-005/013)
│  googleIdToken on session if admin       │  ← PC-SEC-004
│  Cart Zustand (prices UX)                │
└───────────────┬──────────────────────────┘
                │ credentials: include (cross-origin)
                ▼
┌──────────── API (FastAPI) ───────────────┐
│  POST /auth/google-exchange              │  ID token → pc_access/pc_refresh
│  POST /auth/login                        │  password (dev/scripts)
│  RequireStaff on /admin/*                │  real data barrier
│  GET /orders/by-email                    │  NO AUTH ← PC-SEC-001
│  POST /checkout/sessions                 │  guest, server prices
│  POST /webhooks/stripe                   │  signature
└──────────────────────────────────────────┘
```

---

## 7. Checklist de pentest (copy-paste)

### 7.1 Orders / PII

- [ ] `GET /orders/by-email?email=<known>` sem cookie → **deve falhar após fix**; hoje 200
- [ ] `GET /orders/by-email` email de outro usuário com sessão Google A
- [ ] `GET /orders/{id}` sem email / email errado / email certo
- [ ] `GET /orders/lookup` code only / email only / pair valid / invalid
- [ ] Brute force code space sample (rate limit?)
- [ ] PII em logs/referrer de success URL

### 7.2 Auth admin

- [ ] Login password defaults
- [ ] Google exchange com token de customer não-allowlist → 403
- [ ] Google exchange token expired/tampered
- [ ] Refresh sem cookie; refresh reuse (rotation?)
- [ ] Logout limpa cookies em API host
- [ ] Session web contém googleIdToken?
- [ ] CORS: origin evil.com credentialed
- [ ] CSRF: form/img from evil origin com cookies (SameSite=None)

### 7.3 Checkout / money

- [ ] Body com `price`/`unit_amount` extra — deve ignorar
- [ ] productId inexistente / draft / stock 0
- [ ] quantity absurda (0, -1, 999999)
- [ ] Mudar preço no DB entre cart e pay
- [ ] Webhook replay / wrong signature
- [ ] Double webhook same event id

### 7.4 Media / CMS

- [ ] Upload SVG/HTML/polyglot
- [ ] Upload > MEDIA_MAX_BYTES
- [ ] `GET /media/../etc/passwd` e keys fora `products/`
- [ ] CMS href javascript/data
- [ ] imageUrl file:// ou internal IP SSRF se BE fetchasse (hoje só store string?)

### 7.5 Infra / config

- [ ] `/docs` em prod
- [ ] Security headers
- [ ] TLS only
- [ ] APP_DEBUG / APP_ENV
- [ ] Secret key default
- [ ] npm/pip audit

---

## 8. Tracking de remediação

| ID | Sev | Status | Owner IA | PR / commit | Data fix | Notas |
|----|-----|--------|----------|-------------|----------|-------|
| PC-SEC-001 | H | open | — | — | — | **P0** |
| PC-SEC-002 | M | open | — | — | — | |
| PC-SEC-003 | L/M | open | — | — | — | |
| PC-SEC-004 | M | open | — | — | — | |
| PC-SEC-005 | L/M | open | — | — | — | |
| PC-SEC-006 | H* | needs_verify | — | — | — | *se default em prod |
| PC-SEC-007 | M | open | — | — | — | |
| PC-SEC-008 | M/H | needs_verify | — | — | — | runtime |
| PC-SEC-009 | M | open | — | — | — | |
| PC-SEC-010 | M | open | — | — | — | |
| PC-SEC-011 | L | open | — | — | — | |
| PC-SEC-012 | I/C | needs_verify | — | — | — | |
| PC-SEC-013 | M | open | — | — | — | |
| PC-SEC-014 | L/M | open | — | — | — | |
| PC-SEC-015 | M | open | — | — | — | guest abuse |
| PC-SEC-016 | L/M | accepted_risk | — | — | — | L residual |
| PC-SEC-017 | L | open | — | — | — | |
| PC-SEC-018 | L | open | — | — | — | |
| PC-SEC-019 | L | open | — | — | — | |
| PC-SEC-020 | M | open | — | — | — | |
| PC-SEC-021 | L/M | needs_verify | — | — | — | |
| PC-SEC-022 | I | accepted_risk | — | — | — | até live keys |
| PC-SEC-023 | M | needs_verify | — | — | — | |
| PC-SEC-024 | ? | needs_verify | — | — | — | |
| PC-SEC-025 | L | needs_verify | — | — | — | |
| PC-SEC-026 | L | open | — | — | — | |
| PC-SEC-027 | L/M | open | — | — | — | |
| PC-SEC-028 | M | open | — | — | — | fase O/P |

---

## 9. Prompt de retomada (colar na IA de segurança)

```text
Projeto: PuffyCalm (C:\Users\pedro.torres\Projects\PuffyCalm)

Você é especialista em cibersegurança. NÃO faça pentest destrutivo em prod sem ordem.

1. Leia docs/security/KNOWN_VULNERABILITIES.md (fonte canônica de falhas).
2. Leia docs/ops/CONTRACTS.md — NÃO quebre Stripe Custom / guest checkout / server prices.
3. Leia docs/phases/STATUS.md para estado do produto.
4. Priorize PC-SEC-001 (orders by-email unauthenticated).
5. Para cada fix: teste automatizado + atualize a tabela §8 do catálogo (status=fixed, commit).
6. Não commitar secrets. Não recriar o backend do zero.
```

### Prompt de retomada (pentest)

```text
Projeto: PuffyCalm. Você é pentester. Escopo: docs/security/KNOWN_VULNERABILITIES.md §5 e §7.

1. Confirmar cada PC-SEC-XXX em ambiente autorizado (preferir local/staging).
2. Salvar evidências em docs/security/PENTEST_EVIDENCE/PC-SEC-XXX.md
3. Atualizar severidade/status no catálogo se divergir da análise estática.
4. Não exfiltrar PII real; não DoS volumetric; não alterar dados de clientes reais.
5. Entregar relatório final com PoCs HTTP e recomendações priorizadas.
```

---

## 10. Histórico de revisões

| Data | Autor | Mudança |
|------|-------|---------|
| 2026-07-21 | Auditoria mid-path (Grok / owner request) | Criação do catálogo PC-SEC-001 … 028 |

---

## 11. Referências internas

| Doc | Uso |
|-----|-----|
| `docs/ops/CONTRACTS.md` | Contratos imutáveis de checkout |
| `docs/ops/ENV_CHECKLIST.md` | Env secrets e cookies |
| `docs/phases/PHASE_K_COMPLETE.md` | Design email-as-proof (origem 001) |
| `docs/phases/PHASE_E_COMPLETE.md` | Admin Google bridge |
| `docs/phases/PHASE_L_COMPLETE.md` | Inventory / webhook paid |
| `docs/phases/STATUS.md` | Roadmap O/P |
| `docs/ECOMMERCE_MASTER_PLAN.md` | Plano geral |
| `docs/CONTINUE.md` | Handoff agentes |

**Este arquivo é a fonte canônica de falhas de segurança conhecidas.** Novos achados recebem o próximo ID `PC-SEC-029+` e entram na tabela §8.

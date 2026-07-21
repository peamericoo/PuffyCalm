# PuffyCalm / PuffyEasy — Plano Mestre de Transformação

> **Documento canônico de execução.**  
> Auditoria + planejamento apenas. **Não implementa fases de produto.**  
> Atualizado: 2026-07-21 · Baseline prod: commit `996b448`  
> Prompt de origem: auditoria profunda + roadmap incremental até ecommerce real.

**Relacionados:** `docs/CONTINUE.md` (handoff operacional), `docs/FRONTEND_CRAFT.md` (craft FE), `AGENTS.md` §4 (stack).

---

## 1. Visão e critério de sucesso final

### Objetivo

Transformar o monorepo PuffyCalm de um storefront **mock-first com checkout real** em uma **plataforma de ecommerce operável em produção**:

- Backend = **fonte de verdade** (preços, estoque, pedidos, permissões, conteúdo de catálogo).
- Frontend = **cliente não confiável** (apresentação + UX).
- Admin = **centro operacional** real (API + UI), não página visual.
- Cliente final navega produtos reais, compra via checkout Stripe existente, gera pedido real.
- Admin gerencia pedidos, produtos, imagens e conteúdo **sem editar código**.

### Critério de sucesso final (definição de “pronto”)

| # | Critério | Como provar |
|---|----------|-------------|
| 1 | Zero mocks nas áreas de negócio (catálogo, reviews, search, pedidos, admin) | Nenhum import de `src/lib/mock/*` em paths de domínio |
| 2 | Admin opera com conta real `paletot.business@gmail.com` autorizada **no backend** | Login admin → API retorna role; rotas admin 401/403 sem token válido |
| 3 | CRUD de produtos no admin reflete no storefront | Criar/publicar produto → aparece em category/PDP/search sem deploy de conteúdo |
| 4 | Imagens gerenciáveis | Upload/URL no admin → PDP atualiza com revalidação definida |
| 5 | Checkout Stripe existente intacto e idempotente | Smoke card + webhook + success poll |
| 6 | Pedidos visíveis e atualizáveis no admin | Lista, detalhe, status, endereço, itens, pagamento |
| 7 | Guest checkout permanece obrigatório | Compra sem login |
| 8 | Segurança real | Permissões só no BE; secrets fora do código; webhooks assinados |
| 9 | Tratamento de erros reais | Loading/empty/error, stock, falha pagamento, sessão |
| 10 | Deployável e observável | Health, logs de falha de pedido/webhook, testes das fases críticas |

### O que este documento **não** é

- Não é implementação.
- Não autoriza recriar o checkout Stripe.
- Não autoriza reescrever o frontend do zero.
- Não substitui `AGENTS.md` stack law.

---

## 2. Baseline de produção (congelado neste plano)

| Item | Valor |
|------|--------|
| Repo | `peamericoo/PuffyCalm` (monorepo) |
| Branch | `main` |
| Commit baseline | `996b448` — layout background + TopBar controlled menus |
| Também em prod | `ae339ed` — cart drawer/sheet premium |
| Railway projeto | `divine-consideration` · env `production` |
| Web | https://web-production-ea635.up.railway.app |
| API | https://api-production-4f01.up.railway.app |
| Stack prod | web (Next), api (FastAPI), Postgres, Redis |

---

## 3. Arquitetura atual

```text
┌─────────────────────────────────────────────────────────────────┐
│ Railway project: divine-consideration / production              │
│  web  ── Next.js 16 storefront + Auth.js Google + shell /admin  │
│  api  ── FastAPI /api/v1/*                                      │
│  Postgres ── catalog, users (admin/staff), orders, stripe_events│
│  Redis    ── refresh jti, Celery broker                         │
└─────────────────────────────────────────────────────────────────┘

Local (docker compose):
  nginx :8080 → api :8000 · postgres · redis · celery worker · next :3000
```

### Monorepo

| Path | Responsabilidade |
|------|------------------|
| `src/` | Next App Router storefront, Auth.js, Zustand cart/wishlist, Stripe Elements |
| `backend/` | FastAPI Clean-ish layers: api → application → domain → infrastructure |
| `docker/` | Nginx gateway local |
| `docs/` | Handoff + este plano |

### Fluxo de dinheiro atual (já real)

```text
Cart (Zustand, client prices for UX)
  → POST /api/v1/checkout/sessions  { email, lines[{productId,qty}], shipping }
  → BE prices from DB + create Order + Stripe Session ui_mode=custom
  → Payment Element confirm (no returnUrl on confirm)
  → Webhook → order paid (idempotent stripe_events)
  → Success page polls GET /api/v1/orders/{id}?email=&sync=true
```

### Fluxo de catálogo atual (ainda mock)

```text
Home / Category / PDP / Search / Reviews
  → src/lib/mock/* e services que envolvem mock
  → NÃO chama GET /api/v1/catalog|products|search|reviews
```

---

## 4. Arquitetura alvo

```text
                    ┌──────────────┐
  Customer browser  │  Next store  │  Auth.js Google (session UX)
                    └──────┬───────┘
           read catalog    │   checkout/orders
           search/reviews  │   (existing)
                           ▼
                    ┌──────────────┐
                    │  FastAPI BE  │  ← source of truth
                    └──┬───┬───┬───┘
                       │   │   │
              Postgres │   │   │ Redis
              (catalog,│   │   │ (auth jti, cache later)
               orders, │   │   │
               users)  │   │   │
                       │   │   └─ Stripe API + webhooks
                       │   │
  Admin browser ───────┘   │
  Next /admin  ──credentials:include──► JWT cookies OR bridged session
  (role always verified on BE)
```

### Princípios

1. **Backend is truth** — preços, descontos, estoque, status de pedido, permissões.
2. **Frontend is untrusted** — envia `productId`+`qty`, nunca unit price autoritativo.
3. **Guest checkout sagrado** — nunca forçar login para comprar.
4. **Não recriar** o contrato Stripe Custom já em produção.
5. **Admin Next.js** — UI em `src/app/(admin)`; ops via FastAPI.
6. **IDs estáveis** — seed `prod_001`… alinhados com histórico mock para migração suave.
7. **Incremental** — cada fase entrega valor verificável sem arquitetura descartável.

---

## 5. Inventário do Backend

### Stack

- Python ≥3.12, FastAPI, SQLAlchemy 2 async, Alembic, Redis, Celery, Stripe API pin em config.
- App version: `0.1.0`.

### Endpoints (`/api/v1` salvo health root)

| Método | Path | Estado | Notas |
|--------|------|--------|-------|
| GET | `/health`, `/ready` | **Real** | Ready checa Postgres+Redis |
| POST | `/auth/login\|refresh\|logout` | **Real** | Cookies HttpOnly `pc_access`/`pc_refresh` |
| GET | `/auth/me` | **Real** | Cookie ou Bearer |
| GET | `/admin/ping`, `/admin/only-admin` | **Real** | Probes RBAC only |
| GET | `/catalog` | **Real** | Facets/sort/filter server-side |
| GET | `/categories`, `/categories/{slug}` | **Real** | `all` virtual |
| GET | `/products/{slug}` | **Real** | `?related=` |
| GET | `/products/{id}/reviews` | **Real** | Paginação |
| GET | `/search` | **Real** | Autocomplete |
| POST | `/checkout/sessions` | **Real** | Guest, server prices |
| GET | `/orders/{id}` | **Real** | `?email=` + `?sync=true` |
| POST | `/webhooks/stripe` | **Real** | Assinatura + idempotência |

### Ausentes (precisam ser criados nas fases)

| Área | Necessidade |
|------|-------------|
| Admin orders list/detail/patch status | Ops de vendas |
| Admin products CRUD + publish | Catálogo operável |
| Admin media upload | Imagens sem editar código |
| Customer account / order history by user | Conta real |
| Inventory qty + decrement on paid | Consistência de estoque |
| CMS content endpoints | Hero/promo opcional |
| PayPal | Roadmap posterior |
| WebSockets live sales | Opcional (fase antiga 7) |
| Review write | Posterior |
| Email transacional (Celery) | Recibos / falhas |

### Modelos Postgres

| Tabela | Uso |
|--------|-----|
| `users` | admin/staff (bcrypt) — **não** clientes Google |
| `categories`, `products`, `product_images`, `product_specs`, `product_categories` | Catálogo |
| `reviews` | Leitura + seed |
| `orders`, `order_items` | Checkout; shipping JSONB; status lifecycle; `admin_notes` |
| `stripe_events` | Idempotência webhook |

### Auth BE

- Roles: `admin` | `staff`.
- Refresh jti no Redis.
- Seed dev: emails/senhas de config (nunca commitar secrets de prod).

---

## 6. Inventário do Frontend

### Rotas storefront

| Rota | Estado dados |
|------|----------------|
| `/` Home | Mock site + products |
| `/category/[slug]` | Mock via `catalog/service` |
| `/product/[slug]` | Mock products direto |
| `/cart` | Zustand |
| `/checkout` | Zustand lines + **API checkout real** |
| `/success` | **API order poll real** |
| `/wishlist` | Zustand (+ mock featured empty) |
| `/account` | Auth.js profile |
| `/account/orders` | **ComingSoon** |
| `/login`, `/register` | Google OAuth real |
| `/forgot-password`, about, help, returns, privacy, terms | ComingSoon |
| `/admin` | Shell + role email FE |

### Mocks (`src/lib/mock/`)

| Arquivo | Alimenta |
|---------|----------|
| `site.ts` | Metadata, nav, footer, promo, hero, lifestyle |
| `categories.ts` | Catalog + home strips |
| `products.ts` | PDP, catalog, search, home, cart `?add`, smoke `prod_009` |
| `reviews.ts` | PDP reviews service |
| `cart.ts` | **Órfão** (cart real é Zustand) |
| `orders.ts` | **Órfão** (orders page ComingSoon) |

### Clients API FE

| Client | Endpoint | Uso |
|--------|----------|-----|
| `lib/api/checkout.ts` | POST sessions, GET orders | Checkout + success |
| `lib/api/config.ts` | base URL + Stripe pk | Config |

**Não existem ainda:** clients catalog/products/search/reviews/auth-admin/admin-ops.

### Estado cliente

- Cart: `lib/cart/store.ts` (persist `puffycalm-cart`).
- Wishlist: `lib/wishlist/store.ts` (persist `puffycalm-wishlist`).
- **Shipping (pós Fase D):** FE `FREE_SHIPPING_THRESHOLD=75` / `FLAT_SHIPPING=6.99`; BE prod 7500/699 ¢. Smoke `prod_009` sozinho ≈ $7.49.

### Auth FE

- Auth.js Google; role via `ADMIN_EMAIL` / `STAFF_EMAILS` env (**só FE**).
- Admin page **não** chama `/api/v1/auth/*` do FastAPI.

---

## 7. Mapa de fluxos de negócio

### Cliente

1. Descoberta (home/nav/promo) → hoje mock.
2. Browse category/filter/sort → mock (BE já filtra se conectado).
3. Search → mock (BE search existe).
4. PDP + reviews → mock (BE existe).
5. Add to cart / wishlist → cliente only (aceitável MVP se IDs batem com BE).
6. Checkout guest (email + shipping) → **real**.
7. Pagamento Stripe → **real**.
8. Confirmação / success → **real**.
9. Histórico de pedidos na conta → **ausente**.
10. Suporte / legal pages → placeholders.

### Admin

1. Login seguro → parcial (Google FE; JWT BE separado).
2. Ver pedidos reais → **ausente**.
3. Atualizar status (processing/shipped/delivered) → model ready, **API ausente**.
4. CRUD produtos + publish → **ausente**.
5. Imagens → **ausente**.
6. Métricas reais → **ausente** (não inventar dashboard fake).
7. Gestão de conteúdo merchandising → **ausente**.

---

## 8. Key Decisions

| # | Decisão | Rationale |
|---|---------|-----------|
| D1 | Monorepo Next + FastAPI (não reabrir) | Já em prod; AGENTS.md |
| D2 | Não recriar Stripe Custom Checkout | Smoke ok em prod; contrato frágil se alterado |
| D3 | Guest checkout obrigatório | Conversão + requisito de negócio |
| D4 | Migrar FE mock via **services** (`catalog/service`, `reviews/service`) mantendo shapes TS | Evita reescrever todas as telas |
| D5 | Cart/wishlist permanecem client-side no MVP pós-migração catálogo | Checkout já é server-priced; server cart não é blocker de venda |
| D6 | Admin UI = Next `/admin`; autorização sempre no FastAPI | Owner pediu segurança real |
| D7 | Bootstrap admin `paletot.business@gmail.com` via config/seed BE (env), nunca senha no git | Requisito explícito do prompt |
| D8 | Unificar identidade admin (Fase E): bridge Auth.js → sessão BE **ou** login cookie admin no painel | Evitar dois admins divergentes |
| D9 | Imagens: object storage + URL no `product_images` (não base64 no DB) | Escalável e CDN-friendly |
| D10 | CMS-lite só para hero/promo/nav se o custo valer; legal pages podem ser MD/estático primeiro | Evitar CMS genérico cedo |
| D11 | Inventário: evoluir de boolean `in_stock` para qty quando ops exigir (Fase L) | Não bloquear catálogo real |
| D12 | Roadmap antigo CONTINUE (fases 7–10) é **substituído** por fases A–P deste doc | Baseado na arquitetura real |

### Alternativas rejeitadas

| Alternativa | Por que não |
|-------------|-------------|
| Django Admin | Fora do stack; UI admin já decidida Next |
| Server cart obrigatório antes de vender | Checkout já funciona com lines productId+qty |
| Reescrever FE em outro framework | Destrói craft e cart/checkout |
| Confiar role só no FE para admin | Inseguro |
| Migrar todos os mocks num único PR | Alto risco de quebra em prod |

---

## 9. Riscos principais

| Risco | Severidade | Mitigação |
|-------|------------|-----------|
| Dual source preço mock vs BE | **Alta** | Fase B+D; restaurar shipping constants |
| SKU smoke `prod_009` em prod UI | Média | Gate/hide por env ou status draft |
| Dois sistemas de auth admin | **Alta** | Fase E antes de ops sensíveis |
| Webhook secret mal configurado | **Alta** | Checklist env Railway em Fase A |
| `background-attachment` / layout regressions | Baixa | Baseline `996b448` como referência |
| Remover mocks cedo demais | Média | Fase M só após B–D+J estáveis |
| SSG/ISR stale após admin edit | Média | Revalidate tags/paths na Fase H/I |
| Email como “senha” do order GET | Média | Rate limit + codes; account link Fase K |
| Unsplash 404s | Baixa | Substituir por media própria (I) |
| Celery ocioso | Baixa | Usar quando emails/fulfillment existirem |

---

## 10. Estratégia mock → real (sem quebrar prod)

1. **Manter shapes TypeScript** (`types/product.ts`, `CatalogPage`, reviews).
2. **Trocar implementação** em `lib/catalog/service.ts` e `lib/reviews/service.ts` para `fetch(getApiBaseUrl()...)`.
3. **IDs seed = IDs mock** (`prod_001`…) — validar em prod com smoke checkout.
4. **Feature flag opcional** `NEXT_PUBLIC_USE_API_CATALOG=1` se quiser rollback rápido (recomendado na Fase B).
5. **Não apagar** `src/lib/mock` até Fase M; pode servir seed de referência / fallback de dev.
6. **Cart** continua snapshot no add; truth no pay.
7. **Deploy por fase** com health check web+api e smoke checkout mínimo.

---

## 11. Segurança (transversal)

| Tema | Requisito |
|------|-----------|
| Admin | Toda mutação exige role no BE; FE só UX |
| Secrets | Stripe, DB, JWT, OAuth só em env Railway |
| Webhooks | Verificar assinatura sempre em prod |
| Uploads | Validar tipo/tamanho/MIME; paths não enumeráveis |
| Orders | Não vazar pedidos por ID sem email/auth |
| XSS/CSRF | Cookies admin HttpOnly Secure SameSite; CSRF strategy se cookie session write |
| Logs | Não logar PAN/card; mascarar PII |
| Rate limit | Gateway/API em rotas auth e checkout |

---

## 12. Cache e consistência (Next)

| Superfície atual | Notas |
|------------------|-------|
| Category/product | SSG/`generateStaticParams` em parte do catálogo mock |
| Home | RSC + mock estático |

**Alvo pós-admin:**

- Tags de cache: `product:{id}`, `catalog`, `home-content`.
- Após mutate admin → `revalidateTag` / path revalidate (Route Handler ou chamada do BE via webhook interno se necessário).
- Preferir dynamic/fetch `revalidate: 60` no início da migração se invalidação completa for complexa.
- Checkout **nunca** cachear.

---

## 13. Roadmap por fases (A–P)

Cada fase tem: **Objetivo · Escopo · APIs/DB · FE · Deps · Riscos · Validação · DoD**.

---

### Fase A — Contratos congelados + higiene

**Objetivo:** Base segura antes de migrar dados.

**Escopo:**
- Documentar contrato Stripe (já em CONTINUE) no master (este doc §3).
- Checklist env prod: `STRIPE_*`, `STOREFRONT_URL`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, webhook secret.
- Alinhar documentação de shipping BE vs FE (não necessariamente código se for smoke consciente — preferir restaurar 75/6.99 se smoke permitir).
- Política do SKU `prod_009` (dev-only / unlisted).

**APIs/DB:** nenhuma nova.

**Deps:** nenhuma.

**Riscos:** mudar shipping no meio do smoke.

**Validação:** health web+api; um checkout test mode.

**DoD:** checklist env assinado; nota sobre smoke SKU; este plano referenciado no CONTINUE.

---

### Fase B — Catalog FE → API real

**Objetivo:** Storefront lê catálogo do Postgres.

**Escopo:**
- Implementar client `lib/api/catalog.ts` (ou expandir `catalog/service.ts`).
- `getCatalogPage`, product by slug, categories, related.
- Category page + PDP + home product rails consumindo service.
- Loading/error states em falha de API.

**APIs:** existentes `GET /catalog`, `/categories`, `/products/{slug}`.

**Deps:** A.

**Riscos:** SSG build-time fetch URL; CORS/credentials se necessário (read público).

**Validação:** category/PDP em prod com dados seed; IDs batem com checkout.

**DoD:** zero mock em `catalog/service` e product page path; compra de `prod_00x` real ainda funciona.

---

### Fase C — Reviews + Search FE → API

**Objetivo:** Completar browse real.

**Escopo:**
- `reviews/service.ts` → BE reviews.
- Search overlay → `GET /search`.

**Deps:** B.

**Validação:** reviews paginam; search retorna produtos seed.

**DoD:** mock reviews/search fora do path crítico.

---

### Fase D — Money integrity (cart UX)

**Objetivo:** Totais exibidos coerentes com BE.

**Escopo:**
- Restaurar `FREE_SHIPPING_THRESHOLD` / `FLAT_SHIPPING` alinhados ao BE (quando smoke $0.50 não exigir zero).
- Opcional: após `createCheckoutSession`, mostrar `totalCents` do server no step payment (já parcialmente).
- Copy promo $75 alinhada.

**Deps:** A, B.

**DoD:** cart/checkout summary não contradiz Stripe charge (salvo intentional test SKU).

---

### Fase E — Admin auth bridge

**Objetivo:** `paletot.business@gmail.com` admin **no backend**.

**Escopo (escolher na implementação, documentar escolha):**

**Opção E1 (recomendada):**  
- Endpoint BE `POST /auth/google-exchange` ou bootstrap: se email ∈ `ADMIN_EMAILS` env, emitir cookies JWT admin após prova OAuth (token audience validado no BE).  
- Admin UI chama APIs com `credentials: "include"`.

**Opção E2:**  
- Painel admin usa login email/password JWT (seed user com email Google só como contato) + Google só no storefront.

**Requisitos comuns:**
- Env `ADMIN_EMAILS=paletot.business@gmail.com` no **api** Railway.
- FE leave allowlist como UX only; **403 do BE** é a barreira.
- Nunca secrets no código.

**Deps:** A.

**DoD:** request a `/admin/ping` com cookies válidos = 200; sem cookie = 401; customer Google = 403.

---

### Fase F — Admin API ops (pedidos)

**Objetivo:** BE expõe operações de pedido.

**Escopo endpoints (proposta):**
- `GET /admin/orders` — filtros status, paginação.
- `GET /admin/orders/{id}` — itens, shipping, payment ids, totals.
- `PATCH /admin/orders/{id}` — status transitions permitidas + `admin_notes`.

**DB:** usar colunas existentes; validar máquina de estados no application layer.

**Deps:** E.

**DoD:** pytest de transição ilegal (paid → cancelled rules etc.); staff vs admin se aplicável.

---

### Fase G — Admin UI pedidos

**Objetivo:** Painel Next consome Fase F com dados reais.

**Escopo:**
- Rotas `/admin/orders`, `/admin/orders/[id]`.
- Lista + detalhe + mudar status.
- Sem métricas fake.

**Deps:** F.

**DoD:** pedido de smoke test aparece; admin atualiza status; refresh mostra valor do BE.

---

### Fase H — Admin API + UI produtos

**Objetivo:** Operar catálogo sem código.

**Escopo API:**
- CRUD products (create/update), publish/unpublish (`status` lifecycle já no model).
- Manage categories M2M, specs, image URL order.
- Validação server-side de preço/SKU/slug unique.

**Escopo UI:** forms admin; lista produtos.

**Deps:** E, B (storefront deve ler API).

**Cache:** revalidate após save.

**DoD:** criar produto draft → publish → visível no FE; unpublish → some.

---

### Fase I — Mídia / storage

**Objetivo:** Upload real de imagens.

**Escopo:**
- Escolher storage (Railway bucket / S3 / R2) — preferir o que já existir no projeto.
- `POST /admin/media` multipart; validação tipo/tamanho.
- Associar a `product_images`.
- Política de delete/replace e órfãos.

**Deps:** H.

**DoD:** upload no admin → PDP mostra nova imagem.

---

### Fase J — Conteúdo CMS-lite

**Objetivo:** Hero/promo/banners sem deploy (se ROI positivo).

**Escopo:**
- Tabelas `content_blocks` ou JSON settings.
- Admin edit de promo ticker + hero slides.
- Home consome API.

**Deps:** I opcional (URLs de imagem); senão URLs externas.

**DoD:** mudar promo no admin → home atualiza após revalidate.

**Nota:** nav mega-menu pode permanecer código até necessidade real.

---

### Fase K — Conta cliente + my orders

**Objetivo:** Cliente vê pedidos reais.

**Escopo:**
- Estratégia: (1) guest lookup melhorado por email+code; e/ou (2) ligar Google sub/email a orders.
- Implementar `/account/orders` real.
- Não quebrar guest.

**Deps:** F (leitura orders).

**DoD:** após compra com email da sessão Google, pedidos listados (se linkage E2E definido).

---

### Fase L — Fulfillment + inventory hardening

**Objetivo:** Ops e estoque consistentes.

**Escopo:**
- `stock_qty` (migration) ou regras claras em boolean.
- Decrement/reserva on `paid` (webhook path — idempotente).
- Status processing → shipped → delivered na UI admin (já API F).

**Deps:** F, H.

**DoD:** produto qty 0 não vende; webhook double-delivery não decrementa 2x.

---

### Fase M — Remoção definitiva de mocks de domínio

**Objetivo:** Limpar `src/lib/mock` dos caminhos de negócio.

**Escopo:**
- Remover imports; mover fixtures só para testes/seed BE.
- Apagar órfãos `mock/cart.ts`, `mock/orders.ts` se ainda existirem.

**Deps:** B–D, J (se home ainda mock).

**DoD:** grep sem mock em components de catálogo/checkout path; CI opcional.

---

### Fase N — Legal + empty/error states

**Objetivo:** Páginas trust + resiliência UX.

**Escopo:** about, help, returns, privacy, terms (conteúdo real EN); empty/error API globais.

**Deps:** nenhuma dura.

**DoD:** páginas não são ComingSoon; erros de API não quebram layout.

---

### Fase O — Observabilidade + testes

**Objetivo:** Diagnóstico rápido de falhas de pedido.

**Escopo:**
- Structured logs em checkout/webhook.
- Alertas mínimos (falha webhook / 5xx).
- Pytest expandido; smoke script post-deploy.
- Opcional: Sentry.

**Deps:** contínuo desde A.

**DoD:** falha de pagamento rastreável por `order_id` nos logs.

---

### Fase P — Prep produção / PayPal opcional

**Objetivo:** Hardening final.

**Escopo:** rate limits, secrets audit, PayPal só se pedido; desligar smoke SKU; docs ops.

**Deps:** O, M preferencialmente.

**DoD:** checklist go-live assinado.

---

## 14. Dependências entre fases (DAG)

```text
A ──► B ──► C
│      └──► D
├──► E ──► F ──► G
│         └──► K
│         └──► H ──► I ──► J
│                   └──► L
└──► O (contínuo)
B+C+D+J ──► M ──► P
N paralelo após A
```

---

## 15. Testes e validação (padrão por fase)

| Tipo | Quando |
|------|--------|
| `pytest` BE | Toda fase que toca API/DB |
| `tsc` + lint FE | Toda fase FE |
| Smoke checkout Stripe test | Após B, D, L, P |
| Manual admin script | Fases E–I |
| Health Railway | Todo deploy |

---

## 16. Observabilidade (alvo mínimo)

- API: request id, order_id, stripe event id em logs de checkout/webhook.
- Web: error boundary + log de falha create session.
- Não logar dados de cartão.
- Dashboard métricas **só com queries reais** (pós F/G).

---

## 17. O que NÃO recriar

| Item | Motivo |
|------|--------|
| Stripe Custom + Payment Element contract | Produção estável |
| Guest checkout | Requisito de negócio |
| Server-side pricing no session create | Segurança |
| Webhook idempotency table | Correto |
| Seed ID mapping prod_00x | Migração suave |
| Zustand cart client | Suficiente até L |
| Craft FE / cart UI premium | Já investido |

---

## 18. Open Questions (para o owner nas fases)

1. **Auth admin (E1 vs E2):** bridge Google→JWT cookies vs login password no painel?
2. **Smoke SKU `prod_009`:** manter unlisted em prod ou remover do seed prod?
3. **Storage preferido:** Railway bucket vs R2 vs S3?
4. **CMS-lite (J):** hero/promo precisam ser editáveis já, ou estático EN basta no MVP ops?
5. **Account orders (K):** guest-only com código + email basta no primeiro momento?

*(Resolver na fase correspondente — não bloqueia escrita deste plano.)*

---

## 19. PR Plan (quando as fases forem executadas)

| PR / fatia | Escopo | Depende |
|------------|--------|---------|
| docs only | Este arquivo + CONTINUE pointer | — |
| A | Higiene env + shipping notes | docs |
| B1 | API client catalog + service swap | A |
| B2 | Home/PDP/category wire + error states | B1 |
| C | Search + reviews clients | B |
| D | Cart constants + summary honesty | A/B |
| E | Admin auth bridge BE+FE | A |
| F | Admin orders API + tests | E |
| G | Admin orders UI | F |
| H1 | Admin products API | E |
| H2 | Admin products UI + revalidate | H1, B |
| I | Media upload | H |
| J | CMS-lite | I ou H |
| K | Account orders | F |
| L | Inventory + fulfillment rules | F, H |
| M | Delete domain mocks | B–D, J |
| N | Legal pages | — |
| O/P | Observability + go-live | ongoing |

---

## 20. Resumo executivo (estado na data do plano)

### Backend

- **Sólido** em: catálogo read, reviews read, search, auth JWT admin, checkout guest Stripe, webhooks, order GET+sync.
- **Incompleto** em: admin ops API, inventory qty, media, customer identity, emails, PayPal.
- **Não recomeçar** o backend do zero.

### Frontend

- **Polido** em UX (cart, layout, home craft).
- **Mock** em quase todo browse.
- **Real** em checkout payment + success.
- **Admin** é shell com allowlist de email no FE.

### Principais mocks

`site`, `categories`, `products`, `reviews` + services catalog/reviews + search overlay + home merchandising.

### Ordem recomendada

**A → B → C → D** (storefront real) em paralelo com **E → F → G** (admin pedidos) e depois **H → I → J** (produtos/mídia/conteúdo), então **K/L/M/N/O/P**.

### Próximo passo operacional

Aguardar prompt do owner:  
`execute Fase A` ou `execute Fase B` (etc.) — **uma fase por vez**.

---

*Fim do documento mestre. Implementação de produto só mediante prompt de fase explícito.*

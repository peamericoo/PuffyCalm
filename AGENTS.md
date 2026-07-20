# AGENTS.md — PuffCalm

Documento mestre para agentes de IA (VibeCoding). Contém contexto de negócio, stack, telas, prioridades e **credenciais reais de infraestrutura** para operar Railway, Postgres, Redis, GitHub e Google Cloud sem atrito.

> **Atenção de segurança:** este arquivo contém secrets em texto claro de propósito, para agentes controlarem a infra. Não publique este repositório como público sem remover/seccionar secrets, ou use um remote privado. Preferência do owner: credenciais reais no repo para vibecoding.

---

## 0. Identidade do projeto (nomes)

| Camada | Nome | Notas |
|--------|------|--------|
| **Marca / produto** | **PuffCalm** | Nome comercial oficial, branding, copy do site |
| **Domínio** | **puffcalm.com** (ou domínio ativo da marca) | Site em inglês |
| **Repo GitHub** | **peamericoo/PuffyCalm** | Remote técnico (nome histórico do repo) |
| **GCP project name** | **PuffCalm** | Project ID: `easypuff-502919` |
| **Railway project** | slug interno ainda `divine-consideration` | Owner quer nome **PuffCalm** — renomear no dashboard se ainda não refletiu |
| **Pasta local** | `~/Documents/Projects/PuffCalm` | Worktree local do projeto |

**URL GitHub:** https://github.com/peamericoo/PuffyCalm  
**Workdir local:** `/Users/paletotcode/Documents/Projects/PuffCalm`

Quando o usuário disser “projeto” ou **“PuffCalm”**, é este storefront + admin de e-commerce (marca **PuffCalm**).

| Termo | Significado |
|-------|-------------|
| **PuffCalm** | Marca / produto (UI, marketing, copy, package) |
| **PuffyCalm** | Nome histórico do repositório GitHub |
| `easypuff-502919` | Project ID GCP |
| `divine-consideration` | Slug Railway (infra) |

---

## 1. Marca

- **Nome oficial:** **PuffCalm**  
- **Domínio:** PuffCalm.com (ou o domínio ativo configurado na Cloudflare)  
- **Visão:** Marca de **produtos selecionados que melhoram a vida das pessoas** — torna o cotidiano mais leve, prático, confortável e agradável. Inclui conforto/recovery, gadgets úteis, produtos virais e soluções práticas do dia a dia.  
- **Logo (conceito atual):** Gato azul clarinho, gordo e fofo, deitado de barriga pra cima em um puff, com máscara de dormir nos olhos e segurando uma pistola massageadora. Estilo **minimalista e clean**.  
- **Tom da marca:** clean, premium, calmo, confiável, inteligente e moderno.  
- **Tom de UI:** clean, premium, mobile-first, desktop refinado — muito espaço em branco, tipografia elegante (nível Dribbble).  
- **Idioma do site:** **Inglês** (mercados prioritários US/UK/AU/CA).

**Não usar** o nome antigo “EasyPuff” em copy, UI, README de produto ou marketing. Em código/infra, IDs legados (`easypuff-502919`, pastas, remotes) podem permanecer.

---

## 2. Nicho e público

| Item | Valor |
|------|--------|
| Nicho | Everyday better living — conforto, recovery, utilitários e lifestyle |
| Foco | Conforto corporal, recovery, praticidade e bem-estar no dia a dia |
| Público | Profissionais de alta renda que trabalham sentados (home office e escritório) |
| Países prioritários | Estados Unidos, Reino Unido, Austrália, Canadá |
| Idioma | Inglês |

---

## 3. Modelo de negócio

- **Modelo:** Dropshipping  
- **Fornecedores:** AliExpress e CJ Dropshipping  
- **Objetivo imediato:** Gerar as **primeiras vendas no primeiro mês**  
- **Cumprimento:** manual no início  
- **Rastreio:** e-mail ao cliente  
- **Garantia:** realista; **sem easy return gratuito** no começo  
- **Marketing inicial:** orgânico no **TikTok** (reação, problema→solução, IA realista); reutilizar vídeos (incl. Douyin); paid só após validação e com verba baixa  

### Produtos MVP (8) — alta imagem

1. Shiatsu Neck & Shoulder Massager com calor  
2. Mini Massage Gun premium  
3. Massage Gun com display LED  
4. Eye Massager com calor e compressão  
5. Lumbar Support Cushion  
6. Seat Cushion ortopédico  
7. Heated Neck Wrap  
8. Laptop Stand de alumínio  

| Métrica | Alvo |
|---------|------|
| Faixa de preço ideal | US$ 39 – US$ 55 |
| Margem bruta alvo | 65–75% |
| Catálogo no começo | máx. 20–25 produtos |

---

## 4. Stack tecnológica

### 4.1 Visão geral (produto + infra)

| Camada | Tecnologia |
|--------|------------|
| Framework full-stack | **Next.js** (App Router) — ver §4.2 |
| Hosting + DB hosting | **Railway** |
| Banco | **PostgreSQL** (Railway) |
| Cache / filas / sessões | **Redis** (Railway) |
| DNS | **Cloudflare** |
| Auth | **Auth.js** (Google OAuth + **Guest Checkout obrigatório**) |
| Pagamentos | **Stripe** (principal: cartão, Apple Pay, Google Pay) + **PayPal** |
| Confirmação de pagamento | Webhooks (Stripe + PayPal) |
| Cloud extras | **Google Cloud** project `easypuff-502919` |
| Desenvolvimento | Próprio / **VibeCoding** (agentes + owner) |

---

### 4.2 Frontend — stack canônica (OBRIGATÓRIA para IAs)

> **Todas as IAs que programarem neste repositório DEVEM usar esta stack de frontend.**  
> Não substituir por Create React App, Vite SPA isolado, Vue, Svelte, MUI, Chakra, Bootstrap, CSS modules soltos, styled-components ou CSS-in-JS genérico, salvo pedido explícito do owner.  
> Objetivo: stack **mais moderna possível**, estável o bastante para MVP vendável, e fácil de vibecodar.

#### Core

| Peça | Escolha | Notas |
|------|---------|--------|
| Runtime UI | **React 19** | Concurrent features, Actions, `use()`, better forms |
| Framework | **Next.js 15+** (sempre a **última stable**) | **App Router only** — sem Pages Router |
| Linguagem | **TypeScript** strict (`strict: true`) | Sem `any` novo; preferir `unknown` + narrowing |
| Package manager | **pnpm** (preferido) / **npm** aceito no scaffold atual | Preferir `pnpm-lock.yaml`; scaffold inicial pode usar npm |
| Bundler dev | **Turbopack** (`next dev --turbopack`) | Builds prod: default Next |
| Node | **Node.js 22 LTS** (ou 20 LTS mínimo) | Alinhar com Railway |

#### Roteamento, dados e arquitetura React

| Peça | Escolha | Notas |
|------|---------|--------|
| Rotas | **App Router** (`app/`) | Route groups: `(storefront)`, `(auth)`, `admin` |
| Default render | **React Server Components (RSC)** | Server por padrão; `"use client"` só quando necessário |
| Mutações | **Server Actions** + Route Handlers | Actions para forms; `app/api/*` para webhooks Stripe/PayPal |
| Cache / revalidate | `fetch` cache do Next + `revalidatePath` / `revalidateTag` | Evitar over-fetch no client no mock |
| Data client (quando preciso) | **TanStack Query v5** | Carrinho hidratado, wishlist, admin tables live |
| Estado URL | **nuqs** | Filtros, sort, paginação, search na URL |
| Estado global leve | **Zustand** (mínimo) | UI ephemeral (drawer, cart open); não substituir server state |
| Forms | **React Hook Form** + **Zod** + `@hookform/resolvers` | Validação única FE/BE com schemas Zod compartilhados |
| Schema / types | **Zod** | Source of truth de input types |

#### UI system (design system)

| Peça | Escolha | Notas |
|------|---------|--------|
| CSS | **Tailwind CSS v4** | Utility-first; tokens via CSS variables / `@theme` |
| Componentes | **shadcn/ui** (Radix primitives) | Copiar componentes para `components/ui` — não npm “black box” |
| Primitivos a11y | **Radix UI** (via shadcn) | Dialog, Dropdown, Sheet, Tabs, Toast, etc. |
| Ícones | **Lucide React** | Único set de ícones |
| Tema | **next-themes** | Light/dark opcional; default light premium clean |
| Tipografia | **`next/font`** (Geist ou Inter + display opcional) | Zero layout shift; self-hosted |
| Imagens | **`next/image`** | Obrigatório para produto/hero; `sizes` e priority corretos |
| Motion | **Motion** (`motion` / Framer Motion moderno) | Microinterações, PDP gallery, cart — sem exagero |
| Carrossel | **Embla Carousel** (react) | Galeria PDP, homepage modules |
| Toasts | **Sonner** (padrão shadcn) | Feedback de cart/checkout |
| Tabelas admin | **TanStack Table v8** | Pedidos, produtos, clientes |
| Charts admin (depois) | **Recharts** ou **Tremor** | Só quando houver dashboard real |
| Datas | **date-fns** | Locale EN |
| Class merge | `clsx` + `tailwind-merge` (`cn()`) | Helper padrão shadcn |
| Variantes | **class-variance-authority (CVA)** | Variants de Button, Badge, etc. |

#### Estilo visual (direção — EasyPuff)

- **Mobile-first**, depois desktop refinado  
- Clean, premium, minimal — azul clarinho da marca, espaços generosos, tipografia legível  
- Evitar UI “template genérico” barato; parecer D2C premium (recovery / wellness)  
- Tokens de cor/spacing no Tailwind theme; **sem hex solto espalhado** no JSX  

#### Qualidade, DX e testes

| Peça | Escolha | Notas |
|------|---------|--------|
| Lint | **ESLint** flat config + `eslint-config-next` | |
| Format | **Prettier** + `prettier-plugin-tailwindcss` | Sort de classes Tailwind |
| Git hooks (opcional MVP) | **husky** + **lint-staged** | Só se não atrapalhar velocidade |
| Unit / component | **Vitest** + **Testing Library** | Quando houver lógica crítica |
| E2E (pós-mock) | **Playwright** | Checkout path prioritário |
| Análise tipos | `tsc --noEmit` no CI / pre-push | |

#### Pagamentos / auth no frontend

| Peça | Escolha | Notas |
|------|---------|--------|
| Auth UI | **Auth.js (NextAuth v5)** | Google OAuth + sessão; **guest checkout sem forçar login** |
| Stripe UI | **`@stripe/stripe-js`** + **`@stripe/react-stripe-js`** | Payment Element (Apple Pay / Google Pay) |
| PayPal UI | **`@paypal/react-paypal-js`** | Botões oficiais |

#### O que NÃO usar (a menos que o owner peça)

- Pages Router  
- CSS Modules / Sass como sistema principal  
- Material UI, Chakra, Ant Design, Bootstrap  
- Redux / Redux Toolkit (Zustand + Query bastam)  
- Axios (usar `fetch` nativo + wrappers tipados)  
- Moment.js  
- jQuery / UI legada  
- Monorepo pesado desnecessário no dia 1 (um app Next na raiz ou `apps/web` simples se precisar)

#### Convenções de código frontend (IAs)

1. **Server Components por padrão**; `"use client"` na borda (interação, hooks, browser APIs).  
2. Colocar data fetching **perto da página/layout** (RSC); passar props serializáveis para clients.  
3. Componentes de UI em `components/ui` (shadcn); domínio em `components/storefront`, `components/admin`, `components/cart`.  
4. Schemas Zod em `lib/validations/*`; actions em `lib/actions/*` ou colocalizadas.  
5. Paths com alias `@/*`.  
6. Copy de UI em **inglês**.  
7. Acessibilidade: labels, focus rings Tailwind, Radix, teclado no cart/drawer.  
8. Performance: imagens otimizadas, evitar bundle client gigante, lazy de admin pesado.  
9. Mock phase: fixtures em `lib/mock/*` tipadas com Zod — **mesmas shapes** do futuro DB.  
10. Ao adicionar lib nova, atualizar esta §4.2 no `AGENTS.md`.

#### Scaffold sugerido (quando iniciar o app)

```bash
pnpm create next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --turbopack --use-pnpm
# depois:
pnpm dlx shadcn@latest init
# componentes base: button, input, label, card, sheet, dialog, dropdown-menu, badge, separator, skeleton, sonner, tabs, table, form, select, textarea, checkbox, radio-group, avatar, breadcrumb, pagination, navigation-menu
```

#### Mapa de pastas frontend

```text
src/
  app/
    (storefront)/          # homepage, collections, pdp, cart, checkout, account...
    (auth)/                # login, register, forgot-password
    admin/                 # dashboard + CRUD
    api/                   # webhooks, health
    layout.tsx
    globals.css            # Tailwind v4 + tokens
  components/
    ui/                    # shadcn only
    storefront/
    admin/
    cart/
    layout/                # header, footer, mobile-nav
  lib/
    mock/                  # fixtures tipadas (fase mock)
    validations/           # zod
    actions/               # server actions
    db/                    # drizzle/prisma (fase real)
    redis/
    stripe/
    paypal/
    auth.ts
    utils.ts               # cn()
  hooks/                   # client hooks
  types/
```

---

### 4.3 Backend de dados (alinhado ao frontend)

| Peça | Escolha | Notas |
|------|---------|--------|
| ORM preferido | **Drizzle ORM** + **drizzle-kit** | Leve, tipado, fit com VibeCoding; alternativa aceitável: Prisma |
| DB | PostgreSQL Railway | Ver §7 |
| Cache | Redis Railway | Sessão/cart opcional, rate limit |
| Validação server | **Zod** (mesmos schemas do FE) | |

---

### 4.4 Estratégia de build

1. **Frontend mock completo primeiro** (UI real com fixtures Zod)  
2. Depois fluxos reais (auth, carrinho, checkout, pedidos)  
3. Evitar hardcode extremo — mocks tipados, não strings soltas  
4. Priorizar **MVP vendável** o mais rápido possível  

### 4.5 Timeline estimada (MVP)

| Fase | Dias |
|------|------|
| Frontend mock | 5–9 |
| Fluxos reais | 10–16 |
| Ajustes | 4–7 |
| **Total** | **25–35 dias** (ritmo realista) |

### 4.6 Prioridade atual

1. Frontend mock completo (stack §4.2)  
2. Fluxos reais (auth, carrinho, checkout, pedidos)  
3. Cadastrar produtos  
4. Começar TikTok  
5. Buscar as primeiras vendas  

---

## 5. Telas do projeto

### 5.1 Storefront (cliente)

- Homepage  
- Categoria / Coleção  
- Busca  
- PDP (produto)  
- Carrinho  
- Checkout  
- Sucesso / Thank you  
- Login / Cadastro / Recuperar senha  
- Minha conta  
- Meus pedidos  
- Wishlist  
- Trocas e devoluções  
- Central de ajuda / FAQ / Contato  
- Institucionais: Sobre, Privacidade, Termos, Política de troca, 404, Manutenção  
- Blog (futuro)  

### 5.2 Admin

- Dashboard  
- Pedidos  
- Produtos  
- Categorias e coleções  
- Clientes  
- Cupons e descontos  
- Estoque  
- Envios / frete  
- Pagamentos  
- Conteúdo e aparência (banners, menus, páginas)  
- Relatórios  
- Configurações gerais  

### 5.3 Pagamentos e pós-venda

- Stripe + PayPal  
- Guest checkout obrigatório  
- Webhooks  
- Notificação por e-mail a cada venda  
- Dashboard admin + dashboards Stripe/PayPal  

---

## 6. Contas e CLIs já logadas neste ambiente

| Serviço | Conta / contexto | CLI |
|---------|------------------|-----|
| **GitHub** | `peamericoo` | `gh` (scopes: gist, read:org, repo, workflow) |
| **Railway** | Pedro Américo Paletot (`pedro.paletot@gmail.com`) | `railway` — project linked |
| **Google Cloud** | `paletot.business@gmail.com` | `gcloud` — project `easypuff-502919` |
| **Repo** | https://github.com/peamericoo/PuffyCalm | HTTPS remote |

### Comandos úteis de verificação

```bash
gh auth status
gh repo view peamericoo/PuffyCalm

railway whoami
railway status
railway variables --service Postgres
railway variables --service Redis

gcloud auth list
gcloud config get-value project   # easypuff-502919
gcloud projects describe easypuff-502919
```

### Application Default Credentials (GCP)

Se um agente precisar de ADC para SDKs:

```bash
gcloud auth application-default login
```

Hoje o login de usuário CLI está ok; ADC pode não estar configurado.

---

## 7. Railway — credenciais e IDs reais

### Projeto

| Campo | Valor |
|-------|--------|
| Workspace | Pedro Américo Paletot's Projects |
| Project name (API) | `divine-consideration` (alias desejado: **PuffCalm**) |
| Project ID | `7d5e7670-fa5c-4400-9273-cc49ce2a0a8f` |
| Environment | `production` |
| Environment ID | `ea251d60-9d4e-410d-bf77-b02342c78c17` |
| Região serviços | sfo |

### 7.1 PostgreSQL

| Campo | Valor |
|-------|--------|
| Service name | Postgres |
| Service ID | `c88d83e7-5d0c-44de-a7b9-28c695b43526` |
| Image | `ghcr.io/railwayapp-templates/postgres-ssl:18` |
| Volume | `postgres-volume` → `/var/lib/postgresql/data` |
| Volume ID | `7d1b6138-5c64-4a4d-98ef-e6fe9af9f143` |
| User | `postgres` |
| Password | `eDqFAuuniiAlgUdpxEtRjeCOXfAhDcWB` |
| Database | `railway` |
| Internal host | `postgres.railway.internal` |
| Internal port | `5432` |
| Public proxy host | `thomas.proxy.rlwy.net` |
| Public proxy port | `53008` |

**URLs (usar estas strings literais):**

```text
# Local / agentes / apps fora da rede Railway
DATABASE_PUBLIC_URL=postgresql://postgres:eDqFAuuniiAlgUdpxEtRjeCOXfAhDcWB@thomas.proxy.rlwy.net:53008/railway

# Dentro da rede Railway (services no mesmo projeto)
DATABASE_URL=postgresql://postgres:eDqFAuuniiAlgUdpxEtRjeCOXfAhDcWB@postgres.railway.internal:5432/railway
```

Variáveis equivalentes:

```text
PGUSER=postgres
PGPASSWORD=eDqFAuuniiAlgUdpxEtRjeCOXfAhDcWB
PGHOST=postgres.railway.internal
PGPORT=5432
PGDATABASE=railway
POSTGRES_USER=postgres
POSTGRES_PASSWORD=eDqFAuuniiAlgUdpxEtRjeCOXfAhDcWB
POSTGRES_DB=railway
```

**SSL:** proxy Railway costuma exigir TLS; em clientes Node (`pg`) usar `ssl: { rejectUnauthorized: false }` se necessário em dev.

**Teste rápido (Node):**

```bash
node -e "
const { Client } = require('pg');
const c = new Client({
  connectionString: process.env.DATABASE_PUBLIC_URL || 'postgresql://postgres:eDqFAuuniiAlgUdpxEtRjeCOXfAhDcWB@thomas.proxy.rlwy.net:53008/railway',
  ssl: { rejectUnauthorized: false }
});
c.connect().then(() => c.query('select now()')).then(r => { console.log(r.rows); return c.end(); });
"
```

### 7.2 Redis

| Campo | Valor |
|-------|--------|
| Service name | Redis |
| Service ID | `ca9945f8-12ab-441f-8359-15c6c5b9c374` |
| Image | `redis:8.2.1` |
| Volume | `redis-volume` → `/data` |
| Volume ID | `ed9d9cd7-90db-45f7-8717-9a8b70b8db9d` |
| User | `default` |
| Password | `SAJKvPerzfduuNNyHhYIUQnZIULKCaKs` |
| Internal host | `redis.railway.internal` |
| Internal port | `6379` |
| Public proxy host | `tokaido.proxy.rlwy.net` |
| Public proxy port | `18606` |

**URLs:**

```text
# Local / agentes
REDIS_PUBLIC_URL=redis://default:SAJKvPerzfduuNNyHhYIUQnZIULKCaKs@tokaido.proxy.rlwy.net:18606

# Dentro da rede Railway
REDIS_URL=redis://default:SAJKvPerzfduuNNyHhYIUQnZIULKCaKs@redis.railway.internal:6379
```

```text
REDISHOST=redis.railway.internal
REDISPORT=6379
REDISUSER=default
REDISPASSWORD=SAJKvPerzfduuNNyHhYIUQnZIULKCaKs
REDIS_PASSWORD=SAJKvPerzfduuNNyHhYIUQnZIULKCaKs
```

### 7.3 Comandos Railway para agentes

```bash
# Status e serviços
railway status
railway service list   # ou railway status

# Variáveis
railway variables --service Postgres
railway variables --service Redis
railway variables --service <nome-do-app>   # quando o web service existir

# Deploy / link
railway link   # se o workdir não estiver linkado
railway up     # deploy a partir do diretório

# Shell no DB (requer psql local)
railway connect Postgres
```

Quando criar o serviço Next.js no Railway, injetar:

- `DATABASE_URL` (referência ao Postgres ou URL interna)  
- `REDIS_URL`  
- secrets de Auth.js, Stripe, PayPal, etc.  

---

## 8. Google Cloud — credenciais e IDs reais

| Campo | Valor |
|-------|--------|
| Project name | PuffCalm |
| Project ID | `easypuff-502919` |
| Project number | `278213021893` |
| Conta ativa CLI | `paletot.business@gmail.com` |
| Estado | ACTIVE |
| Criado em | 2026-07-19 |

```bash
gcloud config set project easypuff-502919
gcloud projects describe easypuff-502919
gcloud services list --enabled --project=easypuff-502919
```

APIs já vistas habilitadas (amostra): BigQuery, Cloud Storage, Logging, Monitoring, Datastore component, Gemini companion, etc. Habilitar sob demanda (ex.: Maps, Vision, Secret Manager, Cloud Run) com:

```bash
gcloud services enable <api>.googleapis.com --project=easypuff-502919
```

**Uso previsto (flexível):** storage de mídia/produtos, secrets, analytics, ferramentas auxiliares — não substitui Railway como host principal do app no plano atual.

---

## 9. GitHub

| Campo | Valor |
|-------|--------|
| Owner | `peamericoo` |
| Repo | `PuffCalm` |
| URL | https://github.com/peamericoo/PuffyCalm |
| Visibilidade (criação) | public (revisar se secrets neste AGENTS.md forem commitados) |
| Conta CLI | `peamericoo` |
| Protocolo Git | HTTPS |

```bash
# Garantir remote correto na pasta local
cd /Users/paletotcode/Documents/Projects/EasyPuff
git remote set-url origin https://github.com/peamericoo/PuffyCalm.git
git remote -v
```

---

## 10. Variáveis de ambiente canônicas (app Next.js)

Criar `.env.local` / Railway variables com pelo menos:

```bash
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SITE_NAME=PuffCalm
NEXT_PUBLIC_DOMAIN=PuffCalm.com

# Database (local dev → public proxy)
DATABASE_URL=postgresql://postgres:eDqFAuuniiAlgUdpxEtRjeCOXfAhDcWB@thomas.proxy.rlwy.net:53008/railway

# Redis (local dev → public proxy)
REDIS_URL=redis://default:SAJKvPerzfduuNNyHhYIUQnZIULKCaKs@tokaido.proxy.rlwy.net:18606

# Auth.js (preencher quando criar)
AUTH_SECRET=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
# AUTH_URL=

# Stripe (preencher quando criar)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# PayPal (preencher quando criar)
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_WEBHOOK_ID=
# PAYPAL_MODE=sandbox|live

# GCP (opcional)
GOOGLE_CLOUD_PROJECT=easypuff-502919
```

**Ainda não provisionados neste documento (pedir ao owner ou criar):** Stripe keys, PayPal, Google OAuth client, Auth secret, Cloudflare zone/API token, e-mail transacional (Resend/Postmark/etc.), AliExpress/CJ API se houver.

Quando o owner fornecer, **anexar neste AGENTS.md** na seção 11 (ou atualizar a 10).

---

## 11. Secrets ainda pendentes (checklist)

- [ ] Stripe (publishable, secret, webhook)  
- [ ] PayPal (client id/secret, webhook)  
- [ ] Google OAuth (Auth.js) — client no GCP `easypuff-502919`  
- [ ] `AUTH_SECRET`  
- [ ] Cloudflare (API token / zone EasyPuff.com)  
- [ ] Provider de e-mail (vendas + rastreio)  
- [ ] CJ Dropshipping / AliExpress (se API)  
- [ ] Renomear Railway project para PuffCalm no dashboard (se ainda `divine-consideration`)  
- [ ] Avaliar se o GitHub deve ser **private** por causa deste arquivo  

---

## 12. Regras para agentes (VibeCoding)

1. **Ler este arquivo** no início de qualquer sessão neste repo.  
2. **Seguir a stack frontend §4.2 à risca** (Next.js App Router, React 19, TS strict, Tailwind v4, shadcn, etc.).  
3. **Marca = PuffCalm**; código/repo/ops podem usar PuffCalm/PuffCalm — não renomear a marca do cliente.  
4. Site em **inglês**; comentários de código podem ser PT ou EN; copy de UI em EN.  
5. **Mobile-first**, UI clean/premium alinhada ao logo (azul claro, fofo, minimal).  
6. Ordem de entrega: **mock UI completo → fluxos reais → produtos → vendas**.  
7. Guest checkout é **obrigatório**; não bloquear compra por login.  
8. Usar **Postgres + Redis reais do Railway** desde cedo quando útil (não inventar SQLite se o destino é Postgres), mas UI mock pode usar fixtures Zod.  
9. **Não** hardcodar catálogo inteiro na UI final; modelar produtos no DB.  
10. Preferir deploy no **Railway**; DNS no **Cloudflare**.  
11. Ao criar serviços novos ou mudar libs de FE, **atualizar este AGENTS.md**.  
12. Commits: mensagens claras; não force-push em `main` sem pedir.  
13. Se o repo for público, avisar o owner antes de commitar secrets — ele pediu secrets no arquivo; se commitar, considerar private.  

---

## 13. Estrutura de pastas (frontend mock — obrigatória)

Ver também o mapa de pastas em **§4.2**. Esta é a estrutura **canônica** do mock storefront:

```text
/
├── AGENTS.md
├── package.json
├── next.config.ts
├── components.json              # shadcn (quando gerado)
├── public/
├── src/
│   ├── app/
│   │   ├── layout.tsx           # root layout (fonts, metadata)
│   │   ├── (storefront)/
│   │   │   ├── layout.tsx       # Header + Footer
│   │   │   ├── page.tsx         # Homepage
│   │   │   ├── category/[slug]/page.tsx
│   │   │   ├── product/[slug]/page.tsx
│   │   │   ├── cart/page.tsx
│   │   │   ├── checkout/page.tsx
│   │   │   ├── success/page.tsx
│   │   │   ├── account/
│   │   │   ├── wishlist/
│   │   │   ├── login/ / register/ / forgot-password/
│   │   │   ├── about/ privacy/ terms/ returns/ help/
│   │   │   └── not-found.tsx
│   │   └── (admin)/
│   │       ├── layout.tsx
│   │       ├── page.tsx         # Dashboard
│   │       ├── products/
│   │       └── orders/
│   ├── components/
│   │   ├── ui/                  # shadcn primitives
│   │   ├── layout/              # Header, Footer, MobileNav, Admin shell
│   │   ├── product/             # ProductCard, ProductGrid, Price
│   │   ├── home/                # Hero, Featured, Benefits, Categories
│   │   └── shared/              # Section, Container, EmptyState, etc.
│   ├── lib/
│   │   ├── mock/                # fixtures centralizados (única fonte de dados fake)
│   │   │   ├── products.ts
│   │   │   ├── categories.ts
│   │   │   ├── site.ts
│   │   │   ├── cart.ts
│   │   │   └── orders.ts
│   │   ├── utils.ts
│   │   └── format.ts
│   ├── types/
│   │   ├── product.ts
│   │   ├── cart.ts
│   │   └── order.ts
│   └── styles/
│       └── globals.css
└── .env.local
```

**Regras:** cada tela tem seu próprio arquivo de rota; componentes reutilizáveis; dados mock **somente** em `lib/mock`; depois plugar Postgres sem reescrever a UI.

Stack de dados (fase real): **Drizzle ORM** + Postgres; Redis para sessão/cache/rate-limit.

---

## 14. Histórico rápido da conversa (setup)

1. Conta GitHub CLI: `peamericoo`  
2. Repo criado e depois nomeado **PuffCalm** (marca **PuffCalm**)  
3. Workdir local: `Documents/Projects/PuffCalm`  
4. Briefing completo de negócio/produto/telas  
5. Stack fixada (Next.js, Railway, Postgres, Cloudflare, Auth.js, Stripe, PayPal)  
6. **Frontend canônico §4.2** definido para todas as IAs  
7. Railway linkado; Postgres + Redis provisionados e testados  
8. GCP `easypuff-502919` (PuffCalm) autenticado com `paletot.business@gmail.com`  
9. Owner pediu **AGENTS.md com credenciais reais** para agentes controlarem a infra  

---

## 15. Contato owner

- Pessoa: Pedro Américo Paletot  
- Railway login: `pedro.paletot@gmail.com`  
- GCP login: `paletot.business@gmail.com`  
- GitHub: `peamericoo`  

Em dúvida de produto/prioridade: **mock storefront vendável e primeiras vendas** ganham de over-engineering.

---

*Última atualização: 2026-07-19 — marca PuffCalm + estrutura frontend mock + stack §4.2 + infra.*

# PHASE A COMPLETE — Contratos congelados + higiene

| Campo | Valor |
|-------|--------|
| **Fase** | A — Contratos + higiene |
| **Data** | 2026-07-21 |
| **Timezone** | America/local owner (data do handoff) |
| **Commit** | `e01af6e` (`e01af6e56c8110eab685780d78b075ddce783021`) |
| **DoD atingido** | **SIM** |

---

## 1. Objetivo

Base segura antes de migrar catálogo mock → API: congelar contratos Stripe/guest, assinar checklist de env prod, documentar política `prod_009` e desalinhamento de shipping (dívida explícita da Fase D).

---

## 2. Definition of Done — evidência

| Critério | Status | Evidência |
|----------|--------|-----------|
| Checklist env prod assinado | **SIM** | `docs/ops/ENV_CHECKLIST.md` §4 — todas as keys críticas **SET** no Railway `api` + `web` |
| Nota smoke SKU `prod_009` | **SIM** | `docs/ops/CONTRACTS.md` §3 |
| Shipping FE vs BE documentado | **SIM** | `docs/ops/CONTRACTS.md` §2; constants FE comentadas (valores **não** restaurados — smoke) |
| Contrato Stripe documentado | **SIM** | `docs/ops/CONTRACTS.md` §1 (+ CONTINUE + master plan §3) |
| Health web + api | **SIM** | ver §7 |
| STATUS.md atualizado | **SIM** | `docs/phases/STATUS.md` |
| Commit feito | **SIM** | hash em STATUS + este arquivo após commit |
| **Não** migrar mock / admin / recriar checkout | **SIM** | só docs + comentários em `constants.ts` |

---

## 3. Arquivos criados / alterados

### Criados

- `docs/ops/CONTRACTS.md` — Stripe frozen contract, shipping, `prod_009`, guest
- `docs/ops/ENV_CHECKLIST.md` — env prod/local checklist (sem secrets)
- `docs/phases/PHASE_A_COMPLETE.md` — este log

### Alterados

- `docs/phases/STATUS.md` — Fase A done; próxima **B**
- `docs/CONTINUE.md` — snapshot pós-A; pointer para ops docs
- `src/lib/cart/constants.ts` — comentários de política (valores **0/0** mantidos)

### Não tocados (propositadamente)

- Checkout Stripe FE/BE, webhook, order GET
- `src/lib/mock/*`, catalog/reviews services
- Admin UI/API ops
- Seed catalog (exceto política documentada)

---

## 4. Decisões e por quê

| Decisão | Rationale |
|---------|-----------|
| **Não** restaurar FE shipping 75/6.99 nesta fase | Prod Railway `api` tem `FREE_SHIPPING_THRESHOLD_CENTS=0` e `FLAT_SHIPPING_CENTS=0` de propósito para smoke `$0.50`. Restaurar só FE geraria cart “mentiroso” vs charge (ou quebraria expectativa de smoke). Dívida **Fase D**. |
| Manter `prod_009` no seed/mock | Ainda necessário para smoke E2E; política unlisted/go-live na Fase P (ou quando owner desligar smoke). |
| Docs em `docs/ops/*` | Próximas IAs descartáveis leem repositório; contratos e env não podem viver só no chat. |
| Secrets nunca neste log | Prefixo/`SET`/len apenas via Railway CLI. |
| Stripe contract reafirmado, código intocado | Produção estável; master plan “NÃO recriar”. |

### Env prod verificado (presença — sem valores)

**api:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_API_VERSION`, `STOREFRONT_URL`, `DATABASE_URL`, `REDIS_URL`, `SECRET_KEY`, `CORS_ORIGINS`, `ADMIN_EMAIL`, `APP_ENV`, shipping zeros.  
**web:** `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `AUTH_*`, `ADMIN_EMAIL`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SITE_NAME`.  
Stripe mode observado: **test** (`sk_test` / `pk_test`).

---

## 5. Env / checklist (resumo)

Ver tabela completa: **`docs/ops/ENV_CHECKLIST.md`**.

Pendências **não** bloqueantes da Fase A:

- [ ] Live Stripe keys (quando sair de test mode) — Fase P
- [ ] Restaurar shipping 7500/699 no Railway + FE 75/6.99 — **Fase D**
- [ ] Hide/unpublish `prod_009` em go-live — **Fase P**
- [ ] Admin auth no BE — **Fase E** (allowlist FE só UX)

---

## 6. Como validar

```bash
# Health prod
curl -sS -o NUL -w "web:%{http_code}\n" https://web-production-ea635.up.railway.app/
curl -sS https://api-production-4f01.up.railway.app/health
curl -sS https://api-production-4f01.up.railway.app/ready

# Docs
# open docs/ops/CONTRACTS.md
# open docs/ops/ENV_CHECKLIST.md
# open docs/phases/STATUS.md

# Shipping still intentional zeros
# FE: src/lib/cart/constants.ts → FREE_SHIPPING_THRESHOLD === 0
# BE prod: FREE_SHIPPING_*_CENTS === 0 (Railway)

# Optional: one test-mode checkout with prod_009 still works (manual)
```

---

## 7. Comandos rodados e resultado

| Comando | Resultado |
|---------|-----------|
| `curl` web prod | **200** |
| `curl` API `/health` | `{"status":"ok","service":"PuffyCalm API","version":"0.1.0","env":"production"}` |
| `curl` API `/ready` | `postgres:true`, `redis:true` |
| `railway status` | web + api Online; Postgres + Redis Online |
| `railway variables --service api\|web` (keys only) | Checklist §4 **PASS** |
| pytest / tsc | **Não executados** — fase docs/higiene; sem mudança de runtime logic |

---

## 8. Problemas abertos / follow-ups

| Item | Fase sugerida |
|------|----------------|
| Migrar catalog FE → API real | **B** (próxima) |
| Reviews + search FE → API | C |
| Restaurar shipping 75 / 6.99 FE+BE prod; alinhar copy | **D** |
| Admin JWT bridge para `paletot.business@gmail.com` | E |
| `prod_009` unlisted / remove de featured em prod | P (ou D se atrapalhar merchandising) |
| Copy marketing “$75” vs frete 0 atual | dívida documentada; não “corrigir” copy na A sem restaurar frete |

---

## 9. Próxima fase recomendada

**Fase B — Catalog FE → API real**

- Client/service `getCatalogPage`, product by slug, categories
- Category + PDP + home rails
- Feature flag opcional `NEXT_PUBLIC_USE_API_CATALOG` se útil
- **Não** recriar checkout; manter guest + server prices

Prompt: `docs/PHASE_PROMPTS.md` → Fase B.

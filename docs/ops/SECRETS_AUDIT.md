# Secrets audit — Fase P (go-live)

> **Nunca colar valores secretos neste arquivo.**  
> Auditoria por presença, prefixo e higiene de repositório — 2026-07-21.

---

## 1. Onde secrets vivem (canônico)

| Local | O que | Commitado? |
|-------|--------|------------|
| Railway `api` variables | Stripe secret/webhook, DB/Redis URLs, JWT `SECRET_KEY`, S3, Google client id, admin emails | **Não** (platform) |
| Railway `web` variables | Auth.js secret, Google secret, publishable Stripe, public API URL | **Não** (platform) |
| Local `.env` / `.env.local` | Dev mirrors | **Não** (gitignored) |
| `.env.example` / `.env.local.example` | Placeholders only | Sim (sem valores reais) |
| `AGENTS.md` | **Credenciais infra plaintext** (Postgres/Redis Railway, IDs) por pedido do owner | **Sim** — risco se repo público |

---

## 2. Checklist de código (Fase P)

| Check | Resultado | Evidência |
|-------|-----------|-----------|
| Sem `sk_live` / `sk_test` real em source | **OK** | Só mocks `sk_test_mock` em testes; comments em seed |
| Sem `whsec_` real em source | **OK** | Só placeholder em `.env.example` |
| Sem `AUTH_GOOGLE_SECRET` / `AUTH_SECRET` em source | **OK** | Lidos de `process.env` |
| `NEXT_PUBLIC_*` sem server secrets | **OK** | Publishable Stripe + API URL only |
| Docker compose defaults | **OK dev** | `SECRET_KEY` default scaffold — **prod usa Railway** |
| Fixtures mock de domínio no FE | **OK (M)** | `src/lib/mock` removido |
| AGENTS.md com DB/Redis passwords | **RISCO ACEITO PELO OWNER** | Preferir repo **private**; rotacionar se leak |

---

## 3. Stripe mode (prod Railway — Fase A/P)

| Key | Expected prefix | Go-live note |
|-----|-----------------|--------------|
| `STRIPE_SECRET_KEY` | `sk_test…` (hoje) | **Test mode** — não processa dinheiro real |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test…` | Alinhar com secret |
| Live keys | `sk_live` / `pk_live` | **Só** quando owner decidir first real sale + webhook live |

Switching to live = ops step **fora** do código (Dashboard + Railway vars + webhook endpoint). Não recriar checkout.

---

## 4. Auth / admin

| Item | Status |
|------|--------|
| Admin barrier real no BE (`ADMIN_EMAILS` + Google exchange) | Fase E |
| FE `ADMIN_EMAIL` | UX only |
| JWT `SECRET_KEY` | Deve ser forte e **≠** scaffold `change-me-in-production…` em prod |
| Cookies cross-origin | `COOKIE_SAMESITE=none` + Secure em Railway |

---

## 5. Ações recomendadas (não bloqueiam “MVP operável”)

1. Confirmar GitHub **private** enquanto `AGENTS.md` tiver secrets.
2. Rotacionar Postgres/Redis se o remote já foi público com esse arquivo.
3. Trocar Stripe test → live quando for vender de verdade.
4. Nunca logar headers `Authorization`, cookies `pc_*`, ou bodies de webhook raw com PII.

---

## 6. Sign-off

| Check | Result |
|-------|--------|
| Secrets de app em Railway, não no código de runtime | **PASS** |
| Placeholders only em examples | **PASS** |
| Risco residual documentado (AGENTS.md + Stripe test) | **PASS (aceito)** |

**Signed:** Fase P · 2026-07-21 · secrets audit (no values).

# PHASE P COMPLETE — Go-live hardening

| Campo | Valor |
|-------|--------|
| **Fase** | P — Prep produção / go-live hardening |
| **Data** | 2026-07-21 |
| **Commit** | `aca39db` |
| **DoD atingido** | **SIM** — checklist §1 assinado; smoke SKU off UI; secrets/rate-limit notes |
| **Estado sistema** | **MVP operável** |

---

## 1. Objetivo

Hardening final sem recriar Stripe: desligar SKU smoke da storefront, auditar secrets (sem expor), documentar rate limits, assinar critério de sucesso do master plan §1 com evidência.

**PayPal:** **não** implementado (default do prompt — só se trivial; não era).

---

## 2. Pré-requisitos (B–M + ops E–G)

| Bloco | Status | Log |
|-------|--------|-----|
| B catalog FE→API | **done** | `PHASE_B_COMPLETE.md` |
| C reviews+search | **done** | `PHASE_C_COMPLETE.md` |
| D money integrity | **done** | `PHASE_D_COMPLETE.md` |
| E admin auth bridge | **done** | `PHASE_E_COMPLETE.md` |
| F admin orders API | **done** | `PHASE_F_COMPLETE.md` |
| G admin orders UI | **done** | `PHASE_G_COMPLETE.md` |
| H products admin | **done** | `PHASE_H_COMPLETE.md` |
| I media | **done** | `PHASE_I_COMPLETE.md` |
| J CMS-lite | **done** | `PHASE_J_COMPLETE.md` |
| K account orders | **done** | `PHASE_K_COMPLETE.md` |
| L inventory | **done** | `PHASE_L_COMPLETE.md` |
| M domain mocks removed | **done** | `PHASE_M_COMPLETE.md` |
| N legal + errors | **done** | `PHASE_N_COMPLETE.md` |
| O observability | **done** | `PHASE_O_COMPLETE.md` |

**Bloqueios para fingir go-live:** nenhum nos requisitos mínimos B–M / E–G.

---

## 3. Critério de sucesso final (master plan §1)

| # | Critério | Status | Evidência |
|---|----------|--------|-----------|
| 1 | Zero mocks de domínio | **PASS** | Grep `src/` sem `lib/mock`; Phase M apagou pasta |
| 2 | Admin real no BE (`paletot.business@gmail.com`) | **PASS** | Phase E Google→JWT; `/admin/*` exige staff/admin |
| 3 | CRUD produtos → storefront | **PASS** | Phase H publish path + catalog published filter |
| 4 | Imagens gerenciáveis | **PASS** | Phase I media + `/media/{key}` |
| 5 | Checkout Stripe intacto | **PASS** | Phase P **não** tocou contract; `CONTRACTS.md` §1 |
| 6 | Pedidos admin list/detail/status | **PASS** | Phase F API + G UI |
| 7 | Guest checkout obrigatório | **PASS** | Sem force-login no checkout path |
| 8 | Segurança real (BE perms, secrets, webhooks) | **PASS c/ residual** | RBAC BE; webhook signed; secrets audit + gaps em RATE_LIMITS / KNOWN_VULNS |
| 9 | Erros reais loading/empty | **PASS** | Phase N ErrorState + trust pages |
| 10 | Deployável e observável | **PASS** | Health/ready prod; Phase O structlog + smoke scripts |

---

## 4. Hardening executado

### 4.1 Smoke SKU `prod_009`

| Ação | Detalhe |
|------|---------|
| Seed | `status: draft`, `featured: false` |
| Seed runner | **Respeita** status do fixture (não força published) |
| Migration | `p1a2b3c4d5e6_unpublish_smoke_sku_prod_009` |
| Prod DB (2026-07-21) | `UPDATE` → draft; published_count **8** |
| Catalog | total/pool **8**; ids sem `prod_009` |
| PDP | `GET …/products/stripe-min-test-charge` → **404** |
| Search | `q=stripe` → 0 items |
| Re-smoke | Admin publish deliberado → unpublish de novo |

### 4.2 Secrets audit

- Doc: `docs/ops/SECRETS_AUDIT.md` (zero valores secretos)
- App secrets em Railway / `.env` local — não no runtime source
- Residual aceito: `AGENTS.md` com credenciais infra (preferir repo private)

### 4.3 Rate limits

- Doc: `docs/ops/RATE_LIMITS.md`
- Local nginx: 10 r/s; **prod API sem throttle app-level** (PC-SEC-010 residual)
- Aceito para MVP orgânico baixo; obrigatório antes de paid ads

### 4.4 PayPal

- **Skipped** — não trivial; fora de escopo P

---

## 5. Arquivos criados / alterados

### Criados

- `backend/alembic/versions/p1a2b3c4d5e6_unpublish_smoke_sku_prod_009.py`
- `docs/ops/RATE_LIMITS.md`
- `docs/ops/SECRETS_AUDIT.md`
- `docs/phases/PHASE_P_COMPLETE.md`
- `scripts/_phase_p_unpublish_prod009.py` (one-shot; precisa `DATABASE_PUBLIC_URL`)

### Alterados

- `backend/app/infrastructure/db/seed_data.py` — prod_009 draft
- `backend/app/infrastructure/db/seed.py` — honor seed status
- `docs/ops/CONTRACTS.md` §3 — política final smoke SKU
- `docs/ops/ENV_CHECKLIST.md` §4b — sign-off P
- `docs/phases/STATUS.md`
- `docs/CONTINUE.md` — estado final pós-P

### Também (handoff security pré-existente / linkado)

- `docs/security/README.md` + `KNOWN_VULNERABILITIES.md` (catálogo residual)

---

## 6. O que ficou de fora / follow-ups

| Item | Prioridade | Notas |
|------|------------|-------|
| Stripe **live** keys | Owner | Ainda `sk_test` / `pk_test` em prod Railway |
| Rate limit Redis (auth, lookup, checkout) | Alta pós-ads | `RATE_LIMITS.md` + PC-SEC-010 |
| Sentry | Média | Phase O follow-up |
| PayPal | Baixa | Quando pedido |
| Restock on cancel | Baixa | Phase L defer |
| Trust legal counsel review | Compliance | Privacy/terms são summaries operacionais |
| GitHub private + rotate se leak | Segurança | Por causa de `AGENTS.md` |
| Email transacional | Ops | Recibos / tracking |
| Findings PC-SEC-* | Security track | Ver `docs/security/KNOWN_VULNERABILITIES.md` |

---

## 7. Riscos residuais (honestos)

1. **Stripe test mode** — compras não são dinheiro real até flip live.
2. **Sem rate limit em prod** — abuso de lookup/checkout possível sob ataque.
3. **Secrets em AGENTS.md** — se repo público, credenciais de DB/Redis expostas.
4. **Order email-as-proof** — modelo guest documentado; hardening em security backlog.
5. **Alguns produtos `in_stock=false` em prod** — ops (ex. prod_004/008 no snapshot); não é bug de P.

---

## 8. Health / validação (2026-07-21)

```text
API health  → ok (production)
API ready   → postgres=true redis=true
Web         → 200
Catalog     → total=8 (sem prod_009)
PDP smoke   → 404
Admin OpenAPI → /admin/orders*, /admin/products* present
Domain mocks → none in src/
```

Deploy: se commit incluir só docs + seed/migration, **reseed/migration** garante que ambiente novo não re-publica `prod_009`. Prod já atualizado via SQL one-shot. Rodar `alembic upgrade head` no próximo deploy/ops do `api`.

---

## 9. Como reativar smoke (ops)

```text
1. Admin → Products → prod_009 → Publish
2. Checkout test card 4242… (Stripe test)
3. Admin → Unpublish (draft) imediatamente
```

Ou:

```bash
# local / ops com DATABASE_PUBLIC_URL
# (prefer admin UI)
```

---

## 10. Handoff

- **STATUS:** MVP operável  
- **Roadmap A–P:** complete  
- **Próximo:** ops real (produtos retail, Stripe live quando ready, security backlog, marketing TikTok)  
- **Não reabrir:** Stripe Custom contract; guest checkout

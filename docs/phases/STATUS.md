# Status entre sessões (IAs descartáveis)

> Atualizado por cada fase em `PHASE_*_COMPLETE.md`.  
> Próxima IA: leia isto **antes** de codar.

## Snapshot

| Campo | Valor |
|-------|--------|
| **Última atualização** | 2026-07-21 (Fase M — domain mocks removed) |
| **HEAD / Fase M** | *(ver commit desta sessão)* |
| **Master plan** | `docs/ECOMMERCE_MASTER_PLAN.md` |
| **Contratos / env** | `docs/ops/CONTRACTS.md` · `docs/ops/ENV_CHECKLIST.md` |
| **Prompts copy-paste** | `docs/PHASE_PROMPTS.md` |
| **Próxima fase** | **N** (legal + empty/error) · **O** (obs + tests) · **P** (go-live) — N paralelo; P prefere M done |

## Fases

| Fase | Nome | Status | Commit | Log |
|------|------|--------|--------|-----|
| A | Contratos + higiene | **done** | `e01af6e` | `docs/phases/PHASE_A_COMPLETE.md` |
| B | Catalog FE → API | **done** | `66ae6d9` | `docs/phases/PHASE_B_COMPLETE.md` |
| C | Reviews + Search → API | **done** | `ec2012e` | `docs/phases/PHASE_C_COMPLETE.md` |
| D | Money integrity cart | **done** | `6efe45f` | `docs/phases/PHASE_D_COMPLETE.md` |
| E | Admin auth bridge | **done** | `d65aedb` | `docs/phases/PHASE_E_COMPLETE.md` |
| F | Admin orders API | **done** | `614ed17` | `docs/phases/PHASE_F_COMPLETE.md` |
| G | Admin orders UI | **done** | `e34999c` | `docs/phases/PHASE_G_COMPLETE.md` |
| H | Admin products API+UI | **done** (prod smoke 22/22) | `8ec7062` | `docs/phases/PHASE_H_COMPLETE.md` |
| I | Media / storage | **done** | `aa6767b` | `docs/phases/PHASE_I_COMPLETE.md` |
| J | CMS-lite home | **done** | `99fe3dd` | `docs/phases/PHASE_J_COMPLETE.md` |
| K | Account orders | **done** | `db6a5a0` | `docs/phases/PHASE_K_COMPLETE.md` |
| L | Inventory + fulfillment | **done** | `03a4e15` | `docs/phases/PHASE_L_COMPLETE.md` |
| M | Remove domain mocks | **done** | *(este commit)* | `docs/phases/PHASE_M_COMPLETE.md` |
| N | Legal pages + errors | pending | — | — |
| O | Observability + tests | pending | — | — |
| P | Go-live hardening | pending | — | — |

## Estado do sistema (resumo)

- **Prod healthy:** web + api Railway; H–L validated; inventory `stock_qty` on Postgres.
- **Fase M:** `src/lib/mock/` **apagado**; catalog/reviews/search/home rail/cart deep-link/wishlist = API; chrome estático em `src/lib/site.ts`.
- **Env prod:** Stripe + shipping; auth; orders; products; media S3; content; inventory. Flag `NEXT_PUBLIC_USE_API_CATALOG` **deprecated** (ignorada).
- **Contratos congelados:** Stripe Custom; guest checkout; `stripe_events` idempotency.
- **Não recriar:** Stripe Custom checkout; guest checkout; não quebrar `stripe_events`.
- **Residual justificado:** nav/footer/lifestyle em código (`lib/site.ts`); content defaults offline; BE seed; `prod_009` até P; restock on cancel defer.

## Como a próxima IA continua

1. Abrir `docs/PHASE_PROMPTS.md` → copiar prompt da fase **N**, **O** ou **P**.
2. Ler `PHASE_M_COMPLETE.md` se precisar de residual de mock/chrome.
3. Executar **só** uma fase; ao fim criar `PHASE_*_COMPLETE.md` e atualizar esta tabela.
4. Redeploy **web** se M ainda não estiver no serviço Railway de produção.

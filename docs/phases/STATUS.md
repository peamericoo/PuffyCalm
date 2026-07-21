# Status entre sessões (IAs descartáveis)

> Atualizado por cada fase em `PHASE_*_COMPLETE.md`.  
> Próxima IA: leia isto **antes** de codar.

## Snapshot

| Campo | Valor |
|-------|--------|
| **Última atualização** | 2026-07-21 (Fase L — inventory + fulfillment) |
| **HEAD / Fase L** | *(preencher após commit)* |
| **Master plan** | `docs/ECOMMERCE_MASTER_PLAN.md` |
| **Contratos / env** | `docs/ops/CONTRACTS.md` · `docs/ops/ENV_CHECKLIST.md` |
| **Prompts copy-paste** | `docs/PHASE_PROMPTS.md` |
| **Próxima fase** | **M** (remove domain mocks) — deps B–D + J ok |

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
| L | Inventory + fulfillment | **done** | *(após commit)* | `docs/phases/PHASE_L_COMPLETE.md` |
| M | Remove domain mocks | pending | — | — |
| N | Legal pages + errors | pending | — | — |
| O | Observability + tests | pending | — | — |
| P | Go-live hardening | pending | — | — |

## Estado do sistema (resumo)

- **Prod healthy:** web + api Railway; H–K validated; **L** migration `stock_qty` applied on Railway Postgres.
- **Fase L:** `stock_qty` + decrement idempotente no webhook paid; qty 0 / `in_stock=false` bloqueiam checkout (409).
- **Env prod:** Stripe + shipping; auth; orders; products; media S3; content; inventory qty (redeploy **api** para L).
- **Contratos congelados:** Stripe Custom; guest checkout; `stripe_events` idempotency.
- **Não recriar:** Stripe Custom checkout; guest checkout; não quebrar `stripe_events`.
- **Ainda mock / deferred:** nav/footer/lifestyle domain mocks (M); restock on cancel.

## Como a próxima IA continua

1. Abrir `docs/PHASE_PROMPTS.md` → copiar prompt da fase **M** (remove mocks).
2. Ler `PHASE_L_COMPLETE.md` se precisar de inventário; B–D+J para paths de catálogo/home.
3. Executar **só** a Fase M; ao fim criar `PHASE_M_COMPLETE.md` e atualizar esta tabela.
4. Redeploy **api** se L ainda não estiver no serviço Railway de produção.

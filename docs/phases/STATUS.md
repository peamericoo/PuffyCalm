# Status entre sessões (IAs descartáveis)

> Atualizado por cada fase em `PHASE_*_COMPLETE.md`.  
> Próxima IA: leia isto **antes** de codar.

## Snapshot

| Campo | Valor |
|-------|--------|
| **Última atualização** | 2026-07-21 (Fase J — CMS-lite home) |
| **HEAD / Fase J** | `99fe3dd` (+ docs stamp `2a9355d`) |
| **Master plan** | `docs/ECOMMERCE_MASTER_PLAN.md` |
| **Contratos / env** | `docs/ops/CONTRACTS.md` · `docs/ops/ENV_CHECKLIST.md` |
| **Prompts copy-paste** | `docs/PHASE_PROMPTS.md` |
| **Próxima fase** | **K** (account orders) — ou **L** se priorizar inventory |

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
| K | Account orders | pending | — | — |
| L | Inventory + fulfillment | pending | — | — |
| M | Remove domain mocks | pending | — | — |
| N | Legal pages + errors | pending | — | — |
| O | Observability + tests | pending | — | — |
| P | Go-live hardening | pending | — | — |

## Estado do sistema (resumo)

- **Prod healthy:** web + api Railway; H validated; I media ready.
- **Fase J:** `content_blocks` + `GET/PUT` home content; admin `/admin/content`; storefront promo+hero via API.
- **Env prod:** Stripe + shipping; auth; orders; products; media S3; content table migrated on Railway Postgres.
- **Contratos congelados:** Stripe Custom; guest checkout.
- **Não recriar:** Stripe Custom checkout; guest checkout.
- **Ainda mock:** nav/footer/lifestyle (não J); account orders (K).

## Como a próxima IA continua

1. Abrir `docs/PHASE_PROMPTS.md` → copiar prompt da fase **K** (account orders).
2. Ler `PHASE_J_COMPLETE.md` se precisar de content tags; `PHASE_F_COMPLETE` para orders.
3. Executar **só** a Fase K; ao fim criar `PHASE_K_COMPLETE.md` e atualizar esta tabela.
4. Redeploy api+web se Fase J ainda não estiver em prod.

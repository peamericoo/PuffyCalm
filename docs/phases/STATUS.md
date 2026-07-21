# Status entre sessões (IAs descartáveis)

> Atualizado por cada fase em `PHASE_*_COMPLETE.md`.  
> Próxima IA: leia isto **antes** de codar.

## Snapshot

| Campo | Valor |
|-------|--------|
| **Última atualização** | 2026-07-21 (Fase H **validada em Railway prod**) |
| **HEAD / Fase H** | `8ec7062` (feat `05c6d0c` + fix) |
| **Master plan** | `docs/ECOMMERCE_MASTER_PLAN.md` |
| **Contratos / env** | `docs/ops/CONTRACTS.md` · `docs/ops/ENV_CHECKLIST.md` |
| **Prompts copy-paste** | `docs/PHASE_PROMPTS.md` |
| **Próxima fase** | **I** (media / storage upload) |

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
| I | Media / storage | pending | — | — |
| J | CMS-lite home | pending | — | — |
| K | Account orders | pending | — | — |
| L | Inventory + fulfillment | pending | — | — |
| M | Remove domain mocks | pending | — | — |
| N | Legal pages + errors | pending | — | — |
| O | Observability + tests | pending | — | — |
| P | Go-live hardening | pending | — | — |

## Estado do sistema (resumo)

- **Prod healthy:** web + api Railway Online; **Fase H deployed + smoke 22/22** (draft→publish→unpublish).
- **Env prod:** Stripe + shipping; auth bridge E; orders F/G; **products H live**.
- **Contratos congelados:** Stripe Custom; guest checkout; `docs/ops/CONTRACTS.md`.
- **BE:** catalog/search/reviews; checkout; admin auth; admin orders; **admin products CRUD + publish**.
- **FE:** catalog+reviews+search API; cart money; checkout real; admin bridge; orders UI; **products admin UI + revalidate**.
- **Admin UI:** shell + bridge + orders + **products list/form/publish**.
- **Não recriar:** Stripe Custom checkout; guest checkout.

## Como a próxima IA continua

1. Abrir `docs/PHASE_PROMPTS.md` → copiar prompt da fase **I**.
2. Ler `PHASE_H_COMPLETE.md` (image URLs já no model; falta upload binário).
3. Executar **só** a Fase I; ao fim criar `PHASE_I_COMPLETE.md` e atualizar esta tabela.
4. Preferir storage já disponível (Railway bucket / S3 / R2) — não inventar se já houver.

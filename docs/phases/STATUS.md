# Status entre sessões (IAs descartáveis)

> Atualizado por cada fase em `PHASE_*_COMPLETE.md`.  
> Próxima IA: leia isto **antes** de codar.

## Snapshot

| Campo | Valor |
|-------|--------|
| **Última atualização** | 2026-07-21 (Fase G concluída) |
| **HEAD / Fase G** | `e34999c` |
| **Master plan** | `docs/ECOMMERCE_MASTER_PLAN.md` |
| **Contratos / env** | `docs/ops/CONTRACTS.md` · `docs/ops/ENV_CHECKLIST.md` |
| **Prompts copy-paste** | `docs/PHASE_PROMPTS.md` |
| **Próxima fase** | **H** (admin products API+UI) |

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
| H | Admin products API+UI | pending | — | — |
| I | Media / storage | pending | — | — |
| J | CMS-lite home | pending | — | — |
| K | Account orders | pending | — | — |
| L | Inventory + fulfillment | pending | — | — |
| M | Remove domain mocks | pending | — | — |
| N | Legal pages + errors | pending | — | — |
| O | Observability + tests | pending | — | — |
| P | Go-live hardening | pending | — | — |

## Estado do sistema (resumo)

- **Prod healthy:** web + api Railway Online; `/health` ok; `/ready` postgres+redis true.
- **Env prod:** Stripe + shipping; Fase E auth bridge; Fase F admin orders API; **Fase G:** UI `/admin/orders` no web (deploy web).
- **Contratos congelados:** Stripe Custom; guest checkout; `docs/ops/CONTRACTS.md`.
- **BE:** catalog/search/reviews; checkout; admin auth; admin orders list/get/patch.
- **FE:** catalog+reviews+search API; cart money; checkout real; admin bridge; **admin orders UI**.
- **Admin UI:** shell + bridge + **orders list/detail/status** — products = Fase H.
- **Não recriar:** Stripe Custom checkout; guest checkout.

## Como a próxima IA continua

1. Abrir `docs/PHASE_PROMPTS.md` → copiar prompt da fase **H**.
2. Ler `PHASE_E_COMPLETE.md` + `PHASE_B_COMPLETE.md` + contracts (storefront já lê catálogo API).
3. Executar **só** a Fase H; ao fim criar `PHASE_H_COMPLETE.md` e atualizar esta tabela.

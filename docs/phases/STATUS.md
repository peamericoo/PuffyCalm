# Status entre sessões (IAs descartáveis)

> Atualizado por cada fase em `PHASE_*_COMPLETE.md`.  
> Próxima IA: leia isto **antes** de codar.

## Snapshot

| Campo | Valor |
|-------|--------|
| **Última atualização** | 2026-07-21 (Fase E concluída) |
| **HEAD / Fase E** | `d65aedb` |
| **Master plan** | `docs/ECOMMERCE_MASTER_PLAN.md` |
| **Contratos / env** | `docs/ops/CONTRACTS.md` · `docs/ops/ENV_CHECKLIST.md` |
| **Prompts copy-paste** | `docs/PHASE_PROMPTS.md` |
| **Próxima fase** | **F** (admin orders API) |

## Fases

| Fase | Nome | Status | Commit | Log |
|------|------|--------|--------|-----|
| A | Contratos + higiene | **done** | `e01af6e` | `docs/phases/PHASE_A_COMPLETE.md` |
| B | Catalog FE → API | **done** | `66ae6d9` | `docs/phases/PHASE_B_COMPLETE.md` |
| C | Reviews + Search → API | **done** | `ec2012e` | `docs/phases/PHASE_C_COMPLETE.md` |
| D | Money integrity cart | **done** | `6efe45f` | `docs/phases/PHASE_D_COMPLETE.md` |
| E | Admin auth bridge | **done** | `d65aedb` | `docs/phases/PHASE_E_COMPLETE.md` |
| F | Admin orders API | pending | — | — |
| G | Admin orders UI | pending | — | — |
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
- **Env prod:** Stripe + shipping 7500/699; **Fase E:** owner deve setar `ADMIN_EMAILS`, `GOOGLE_CLIENT_ID`, `COOKIE_SAMESITE=none` no **api**.
- **Contratos congelados:** Stripe Custom; guest checkout; `docs/ops/CONTRACTS.md`.
- **BE:** catalog/search/reviews real; checkout real; **admin Google bridge + JWT cookies** (`POST /auth/google-exchange`, `/admin/ping`).
- **FE:** catalog+reviews+search API; cart money; checkout real; **/admin** com bridge que prova ping.
- **Admin UI:** shell + backend session proof only (sem CRUD pedidos/produtos).
- **Não recriar:** Stripe Custom checkout; guest checkout.

## Como a próxima IA continua

1. Abrir `docs/PHASE_PROMPTS.md` → copiar prompt da fase **F**.
2. Ler `PHASE_E_COMPLETE.md` + `docs/ops/CONTRACTS.md` + `docs/ops/ENV_CHECKLIST.md`.
3. Executar **só** a Fase F; ao fim criar `PHASE_F_COMPLETE.md` e atualizar esta tabela.

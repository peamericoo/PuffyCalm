# Status entre sessões (IAs descartáveis)

> Atualizado por cada fase em `PHASE_*_COMPLETE.md`.  
> Próxima IA: leia isto **antes** de codar.

## Snapshot

| Campo | Valor |
|-------|--------|
| **Última atualização** | 2026-07-21 (setup de prompts; nenhuma fase A–P executada ainda) |
| **HEAD / baseline app** | Ver `git log -1` · prod já teve `996b448` (layout) + cart premium |
| **Master plan** | `docs/ECOMMERCE_MASTER_PLAN.md` |
| **Prompts copy-paste** | `docs/PHASE_PROMPTS.md` |
| **Próxima fase** | **A** |

## Fases

| Fase | Nome | Status | Commit | Log |
|------|------|--------|--------|-----|
| A | Contratos + higiene | **pending** | — | — |
| B | Catalog FE → API | pending | — | — |
| C | Reviews + Search → API | pending | — | — |
| D | Money integrity cart | pending | — | — |
| E | Admin auth bridge | pending | — | — |
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

- **BE:** catalog/search/reviews read real; checkout Stripe real; admin JWT probes only.
- **FE:** catalog/home/search/reviews still mock; cart Zustand; checkout+success real.
- **Admin UI:** shell only.
- **Não recriar:** Stripe Custom checkout contract; guest checkout.

## Como a próxima IA continua

1. Abrir `docs/PHASE_PROMPTS.md` → copiar prompt da fase em **Próxima fase**.
2. Ler todos os `PHASE_*_COMPLETE.md` com status done.
3. Executar só essa fase; ao fim atualizar esta tabela e criar o log.

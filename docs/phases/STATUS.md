# Status entre sessões (IAs descartáveis)

> Atualizado por cada fase em `PHASE_*_COMPLETE.md`.  
> Próxima IA: leia isto **antes** de codar.

## Snapshot

| Campo | Valor |
|-------|--------|
| **Última atualização** | 2026-07-21 (Fase B concluída) |
| **HEAD / Fase B** | `66ae6d9` (+ stamp `d8159bc` on `main`) |
| **Master plan** | `docs/ECOMMERCE_MASTER_PLAN.md` |
| **Contratos / env** | `docs/ops/CONTRACTS.md` · `docs/ops/ENV_CHECKLIST.md` |
| **Prompts copy-paste** | `docs/PHASE_PROMPTS.md` |
| **Próxima fase** | **C** |

## Fases

| Fase | Nome | Status | Commit | Log |
|------|------|--------|--------|-----|
| A | Contratos + higiene | **done** | `e01af6e` | `docs/phases/PHASE_A_COMPLETE.md` |
| B | Catalog FE → API | **done** | `66ae6d9` | `docs/phases/PHASE_B_COMPLETE.md` |
| C | Reviews + Search → API | **pending** | — | — |
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

- **Prod healthy:** web + api Railway Online; `/health` ok; `/ready` postgres+redis true.
- **Env prod assinado (Fase A):** `STRIPE_*`, `STOREFRONT_URL`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, webhook secret — presentes (test mode). Detalhe em `docs/ops/ENV_CHECKLIST.md`.
- **Contratos congelados:** Stripe Custom sem `returnUrl` no FE; lines `productId`+qty; preço no BE; guest checkout sagrado — `docs/ops/CONTRACTS.md`.
- **Shipping:** FE e BE **prod** em frete **0/0** de propósito (smoke `prod_009`); defaults de código BE 7500/699 ¢; copy UI ainda “$75” — restaurar na **Fase D**.
- **SKU smoke `prod_009`:** mantido seed+mock; política unlisted/go-live documentada; não remover até P (ou decisão owner).
- **BE:** catalog/search/reviews read real; checkout Stripe real; admin JWT probes only.
- **FE (pós-B):** **catalog / category / PDP / home rails → API** (flag `NEXT_PUBLIC_USE_API_CATALOG` default ON). Search + reviews **ainda mock**. Cart Zustand; checkout+success **real**.
- **Admin UI:** shell only (allowlist email FE).
- **Não recriar:** Stripe Custom checkout; guest checkout.

## Como a próxima IA continua

1. Abrir `docs/PHASE_PROMPTS.md` → copiar prompt da fase em **Próxima fase** (= **C**).
2. Ler `PHASE_B_COMPLETE.md` + `docs/ops/CONTRACTS.md` + `docs/ops/ENV_CHECKLIST.md`.
3. Executar **só** a Fase C; ao fim criar `PHASE_C_COMPLETE.md` e atualizar esta tabela.

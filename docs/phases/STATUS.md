# Status entre sessões (IAs descartáveis)

> Atualizado por cada fase em `PHASE_*_COMPLETE.md`.  
> Próxima IA: leia isto **antes** de codar.

## Snapshot

| Campo | Valor |
|-------|--------|
| **Última atualização** | 2026-07-21 (Fase D concluída) |
| **HEAD / Fase D** | `6efe45f` (+ stamp `2c07ebe` on `main`) |
| **Master plan** | `docs/ECOMMERCE_MASTER_PLAN.md` |
| **Contratos / env** | `docs/ops/CONTRACTS.md` · `docs/ops/ENV_CHECKLIST.md` |
| **Prompts copy-paste** | `docs/PHASE_PROMPTS.md` |
| **Próxima fase** | **E** (admin auth bridge; pode rodar em paralelo com polish) |

## Fases

| Fase | Nome | Status | Commit | Log |
|------|------|--------|--------|-----|
| A | Contratos + higiene | **done** | `e01af6e` | `docs/phases/PHASE_A_COMPLETE.md` |
| B | Catalog FE → API | **done** | `66ae6d9` | `docs/phases/PHASE_B_COMPLETE.md` |
| C | Reviews + Search → API | **done** | `ec2012e` | `docs/phases/PHASE_C_COMPLETE.md` |
| D | Money integrity cart | **done** | `6efe45f` | `docs/phases/PHASE_D_COMPLETE.md` |
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
- **Env prod assinado (Fase A + D):** `STRIPE_*`, `STOREFRONT_URL`, `NEXT_PUBLIC_API_URL`, shipping **7500/699** no api.
- **Contratos congelados:** Stripe Custom sem `returnUrl` no FE; lines `productId`+qty; preço no BE; guest checkout sagrado — `docs/ops/CONTRACTS.md`.
- **Shipping (Fase D):** FE **75 / 6.99** + BE prod **7500 / 699** ¢; copy UI “$75” coerente. Step pagamento usa totais server.
- **SKU smoke `prod_009`:** sozinho → **$7.49** ($0.50 + $6.99 flat). Não é bug; documentado. Unlist na Fase P.
- **BE:** catalog/search/reviews read real; checkout Stripe real; admin JWT probes only.
- **FE (pós-D):** catalog+reviews+search API; cart money alinhado; checkout+success real.
- **Admin UI:** shell only (allowlist email FE).
- **Não recriar:** Stripe Custom checkout; guest checkout.

## Como a próxima IA continua

1. Abrir `docs/PHASE_PROMPTS.md` → copiar prompt da fase em **Próxima fase** (= **E**).
2. Ler `PHASE_D_COMPLETE.md` + `docs/ops/CONTRACTS.md` + `docs/ops/ENV_CHECKLIST.md`.
3. Executar **só** a Fase E; ao fim criar `PHASE_E_COMPLETE.md` e atualizar esta tabela.

# Status entre sessões (IAs descartáveis)

> Atualizado por cada fase em `PHASE_*_COMPLETE.md`.  
> Próxima IA: leia isto **antes** de codar.

## Snapshot

| Campo | Valor |
|-------|--------|
| **Última atualização** | 2026-07-21 (Fase P — go-live hardening) |
| **HEAD / Fase P** | `f4c59a9` (feature `aca39db`) |
| **Master plan** | `docs/ECOMMERCE_MASTER_PLAN.md` |
| **Contratos / env** | `docs/ops/CONTRACTS.md` · `docs/ops/ENV_CHECKLIST.md` |
| **Secrets / rate limits** | `docs/ops/SECRETS_AUDIT.md` · `docs/ops/RATE_LIMITS.md` |
| **Security backlog** | `docs/security/KNOWN_VULNERABILITIES.md` |
| **Prompts copy-paste** | `docs/PHASE_PROMPTS.md` |
| **Estado do produto** | **MVP operável** |
| **Próxima fase de roadmap A–P** | **completa** — follow-ups ops/security/live Stripe |

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
| M | Remove domain mocks | **done** | `9122721` | `docs/phases/PHASE_M_COMPLETE.md` |
| N | Legal pages + errors | **done** | `1d37eba` | `docs/phases/PHASE_N_COMPLETE.md` |
| O | Observability + tests | **done** | `ebc9052` | `docs/phases/PHASE_O_COMPLETE.md` |
| P | Go-live hardening | **done** | `aca39db` | `docs/phases/PHASE_P_COMPLETE.md` |

## Estado do sistema (resumo)

- **Estado:** **MVP operável** — backend fonte de verdade; admin ops pedidos/produtos/mídia/content; cliente compra guest + Stripe Custom; zero mocks de domínio.
- **Prod healthy:** web + api Railway; catalog **8** retail SKUs; `prod_009` **draft** (fora da UI).
- **Fase P:** secrets audit + rate-limit notes + smoke SKU off + checklist §1 assinado.
- **Stripe:** ainda **test mode** em prod até owner colocar live keys.
- **PayPal:** não no MVP.
- **Contratos congelados:** Stripe Custom; guest checkout; `stripe_events` idempotency.
- **Não recriar:** Stripe Custom checkout; guest checkout; não quebrar `stripe_events`.

## Como a próxima IA continua

1. **Roadmap A–P fechado.** Não reabrir fases “só porque”.
2. Prioridades pós-MVP (escolher com owner):
   - Flip Stripe test → live + webhook live
   - Security backlog (`docs/security/KNOWN_VULNERABILITIES.md`) — rate limits primeiro
   - Produtos retail / fotos / estoque real no admin
   - Email transacional / tracking
   - PayPal se pedido
3. Ler `PHASE_P_COMPLETE.md` + `docs/ops/*` + `CONTRACTS.md` antes de qualquer mudança de pagamento.
4. Craft FE: `/compact-fe` ou `docs/FRONTEND_CRAFT.md` (sem reabrir BE).

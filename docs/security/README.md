# Segurança — PuffyCalm

Documentação de segurança para o monorepo (storefront Next.js + API FastAPI).

| Documento | Propósito |
|-----------|-----------|
| **[KNOWN_VULNERABILITIES.md](./KNOWN_VULNERABILITIES.md)** | **Catálogo canônico** de falhas conhecidas (`PC-SEC-XXX`), evidências, PoC, remediação e checklist de pentest |
| `PENTEST_EVIDENCE/` | (criar) evidências por finding após pentest |

## Fluxo recomendado

1. **IA cibersegurança** corrige findings abertos (começar por `PC-SEC-001`).
2. **IA pentest** revalida e adiciona evidências; ajusta severidade se necessário.
3. Ambos atualizam a tabela de tracking no catálogo.

## Contratos que limitam fixes

Correções **não podem** quebrar:

- Stripe Custom Checkout (sem `returnUrl` no FE `confirm`)
- Guest checkout
- Preços autoritativos no backend
- Idempotência `stripe_events`

Ver `docs/ops/CONTRACTS.md`.

## Prompts

Os prompts copy-paste para IAs de fix e pentest estão no final de `KNOWN_VULNERABILITIES.md` (§9).

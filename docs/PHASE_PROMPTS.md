# Prompts por fase — sessões descartáveis (sem memória)

> **Para quê:** você abre **uma IA nova por fase**, em outro terminal/sessão.  
> Cada sessão **morre no fim**. A próxima IA **não tem contexto** — só o que estiver no repositório.

---

## Onde estão os documentos

| Documento | Caminho | Função |
|-----------|---------|--------|
| **Plano mestre** (roadmap, auditoria, DoD) | `docs/ECOMMERCE_MASTER_PLAN.md` | Fonte de verdade do **o quê** e **por quê** |
| **Este arquivo** (prompts copy-paste) | `docs/PHASE_PROMPTS.md` | O **prompt de cada fase** |
| **Status entre sessões** | `docs/phases/STATUS.md` | O que já foi feito / próxima fase |
| **Log de cada fase** | `docs/phases/PHASE_<LETRA>_COMPLETE.md` | Detalhe do que a IA fez |
| Handoff curto | `docs/CONTINUE.md` | Resumo operacional |
| Stack law | `AGENTS.md` §4 | Stack obrigatória |

**Workdir:** `C:\Users\pedro.torres\Projects\PuffyCalm`  
**Repo:** `peamericoo/PuffyCalm` · branch `main`  
**Prod:** web https://web-production-ea635.up.railway.app · api https://api-production-4f01.up.railway.app

---

## Como usar (você)

1. Abra o **STATUS**: `docs/phases/STATUS.md` — confira qual fase falta.
2. Copie o bloco da fase correspondente **deste arquivo** (seção “Prompt — Fase X”).
3. Cole **inteiro** numa **sessão/IA nova** (sem histórico).
4. Quando a IA terminar, confira:
   - `docs/phases/PHASE_X_COMPLETE.md` criado/atualizado  
   - `docs/phases/STATUS.md` atualizado  
   - commit no git (e deploy se a fase pediu)
5. Feche a sessão. Repita com a **próxima** letra.

**Ordem obrigatória (DAG resumido):**  
A → B → C → D  
A → E → F → G  
E + B → H → I → J  
F → K · F + H → L  
B+C+D+J → M · N paralelo · O contínuo · P no fim  

Não pule dependências (ex.: não faça G sem F; não faça B sem A).

---

## Bloco comum (já embutido em cada prompt)

Cada prompt abaixo já inclui:

- Leitura do plano mestre + STATUS + logs anteriores  
- Aviso: **esta sessão será descartada**  
- Obrigação de **escrever no repo** o que fez (para a próxima IA sem memória)  
- Proibições: não recriar Stripe checkout; guest checkout sagrado; uma fase só  
- Commit + mensagem clara  

---

# Prompt — Fase A

```text
Sessão descartável — FASE A apenas. Você NÃO terá memória depois; a próxima IA só lerá o repositório.

PROJETO
- Workdir: C:\Users\pedro.torres\Projects\PuffyCalm
- Repo monorepo: Next.js storefront (src/) + FastAPI (backend/)
- Plano mestre (LER POR COMPLETO a seção da Fase A + Key Decisions + “NÃO recriar”):
  docs/ECOMMERCE_MASTER_PLAN.md
- Status entre fases: docs/phases/STATUS.md
- Logs de fases anteriores (se existirem): docs/phases/PHASE_*_COMPLETE.md
- Stack: AGENTS.md §4 · Handoff: docs/CONTINUE.md

REGRA DE MEMÓRIA (OBRIGATÓRIA)
- Esta conversa será descartada no fim.
- Você DEVE persistir no repositório tudo o que a próxima IA precisa saber:
  1) Criar/atualizar docs/phases/PHASE_A_COMPLETE.md com:
     - Data/hora e commit hash final
     - Objetivo da fase e se DoD foi atingido (sim/não + evidência)
     - Arquivos criados/alterados (lista)
     - Decisões tomadas e por quê
     - Env vars / checklist (sem colar secrets/valores secretos)
     - Como validar o que você fez
     - Problemas abertos / follow-ups para a próxima fase
     - Comandos úteis rodados e resultado (tsc, pytest, health, etc.)
  2) Atualizar docs/phases/STATUS.md:
     - Marcar Fase A como done (com commit)
     - Definir próxima fase recomendada
     - Resumo de 5–10 linhas do estado do sistema AGORA
  3) Commit git com mensagem clara (docs/fix da fase). Push se o owner já usa main→Railway; se não tiver certeza, commit local e diga o comando de push.

ESCOPO — FASE A (só isto)
- Congelar contratos + higiene (ver master plan § Fase A).
- Documentar/verificar checklist env prod (STRIPE_*, STOREFRONT_URL, NEXT_PUBLIC_API_URL, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET) — NÃO imprimir secrets.
- Política do smoke SKU prod_009 (dev/unlisted) documentada.
- Shipping FE vs BE: documentar desalinhamento atual; se seguro, alinhar constants FE aos valores BE; se smoke exigir zero, documentar explicitamente como dívida da Fase D.
- Não migrar catálogo mock. Não admin ops. Não recriar checkout.

PROIBIDO
- Implementar Fases B–P.
- Reescrever checkout Stripe / mudar contrato confirm (sem returnUrl no FE; preço só no BE).
- Quebrar guest checkout.
- Secrets no código ou no log PHASE_A_COMPLETE.

VALIDAÇÃO / DoD
- Health web + api em prod ou local.
- Checklist env assinado no PHASE_A_COMPLETE.
- STATUS.md atualizado.
- Commit feito.

Ao terminar, responda ao owner com: commit hash, link dos arquivos de log, e “Fase A concluída — próxima: B (ou o que STATUS disser)”.
```

---

# Prompt — Fase B

```text
Sessão descartável — FASE B apenas. Você NÃO terá memória depois; a próxima IA só lerá o repositório.

PROJETO
- Workdir: C:\Users\pedro.torres\Projects\PuffyCalm
- Plano mestre: docs/ECOMMERCE_MASTER_PLAN.md (Fase B + inventário FE mock + shapes CatalogPage)
- OBRIGATÓRIO ler antes de codar:
  docs/phases/STATUS.md
  docs/phases/PHASE_A_COMPLETE.md
  (e qualquer PHASE_*_COMPLETE.md listado no STATUS)
- AGENTS.md §4 · docs/CONTINUE.md

REGRA DE MEMÓRIA (OBRIGATÓRIA)
- Sessão será descartada.
- Criar docs/phases/PHASE_B_COMPLETE.md (mesmo formato: objetivo, DoD, arquivos, decisões, validação, follow-ups, commit).
- Atualizar docs/phases/STATUS.md (B done, próxima fase, estado atual).
- Commit (+ push se fluxo padrão main→Railway).

PRÉ-REQUISITO
- Fase A done em STATUS.md. Se A não estiver done, PARE e diga ao owner para rodar A primeiro.

ESCOPO — FASE B
- Storefront passa a ler catálogo do BE (API já existe).
- Implementar client API catalog (ex. src/lib/api/catalog.ts) e/ou trocar implementação de src/lib/catalog/service.ts para fetch(getApiBaseUrl()...).
- Manter shapes TypeScript existentes (CatalogPage, Product).
- Category page, PDP (product by slug + related), home product rails via service — sem mock no path de domínio.
- Loading/error states se API falhar.
- Feature flag opcional NEXT_PUBLIC_USE_API_CATALOG se ajudar rollback (documente no PHASE_B_COMPLETE).
- NÃO apagar src/lib/mock ainda (só sair do path crítico).
- NÃO recriar checkout. Guest checkout intacto. IDs prod_001… devem continuar compráveis.

PROIBIDO
- Fases C–P.
- Admin CRUD.
- Quebrar Stripe contract.

VALIDAÇÃO / DoD
- tsc limpo nas mudanças.
- Category + PDP mostram dados da API (local e/ou prod após deploy).
- Smoke mental: productId do PDP = o que o cart manda no checkout.
- PHASE_B_COMPLETE + STATUS + commit.

Ao terminar: commit hash, arquivos de log, “próxima fase recomendada”.
```

---

# Prompt — Fase C

```text
Sessão descartável — FASE C apenas. Sem memória após o fim; persista tudo no repo.

PROJETO
- Workdir: C:\Users\pedro.torres\Projects\PuffyCalm
- Plano: docs/ECOMMERCE_MASTER_PLAN.md § Fase C
- Ler: docs/phases/STATUS.md + PHASE_A_COMPLETE.md + PHASE_B_COMPLETE.md
- AGENTS.md §4

REGRA DE MEMÓRIA
- Escrever docs/phases/PHASE_C_COMPLETE.md (completo, auditável).
- Atualizar docs/phases/STATUS.md.
- Commit (+ push se aplicável).

PRÉ-REQUISITO: B done. Senão, parar.

ESCOPO — FASE C
- reviews: src/lib/reviews/service.ts → API real de reviews do BE.
- search: header search-overlay → GET /api/v1/search (via client/service limpo).
- Loading/empty/error decentes.
- Mock reviews/search fora do path crítico (não precisa deletar mock files ainda).

PROIBIDO: D–P; recriar checkout; quebrar catalog da Fase B.

VALIDAÇÃO
- Reviews paginam no PDP.
- Search retorna produtos seed.
- tsc; PHASE_C_COMPLETE + STATUS + commit.

Resposta final: hash, logs, próxima fase.
```

---

# Prompt — Fase D

```text
Sessão descartável — FASE D apenas. Sem memória depois; escreva o handoff no repo.

PROJETO
- Workdir: C:\Users\pedro.torres\Projects\PuffyCalm
- Plano: docs/ECOMMERCE_MASTER_PLAN.md § Fase D + risco dual-source de preços
- Ler: STATUS.md + PHASE_A/B/C_COMPLETE.md
- Olhar: src/lib/cart/constants.ts e regras de shipping no backend

REGRA DE MEMÓRIA
- docs/phases/PHASE_D_COMPLETE.md + atualizar STATUS.md + commit.

PRÉ-REQUISITO: A e B done (C recomendado).

ESCOPO — FASE D
- Alinhar FREE_SHIPPING_THRESHOLD e FLAT_SHIPPING do FE com o BE (documentar valores finais).
- Garantir que summary do cart/checkout não minta vs total cobrado (salvo SKU de teste documentado).
- Preferir mostrar totalCents do server no step de pagamento quando session existir.
- Alinhar copy de free shipping ($75 vs constants) na UI/promo se necessário — sem redesign grande.

PROIBIDO: mudar contrato Stripe; admin; remover mocks de catálogo se B/C ok.

VALIDAÇÃO
- Totais cart coerentes com BE para produto seed normal.
- PHASE_D_COMPLETE documenta qualquer exceção smoke (prod_009).
- Commit.

Resposta final: hash, logs, próxima (geralmente E em paralelo possível, ou E).
```

---

# Prompt — Fase E

```text
Sessão descartável — FASE E apenas. Sessão será descartada; handoff obrigatório no git.

PROJETO
- Workdir: C:\Users\pedro.torres\Projects\PuffyCalm
- Plano: docs/ECOMMERCE_MASTER_PLAN.md § Fase E (admin auth bridge) + § Segurança
- Ler: STATUS.md + phases complete anteriores
- Alvo: paletot.business@gmail.com admin no BACKEND (não só FE)

REGRA DE MEMÓRIA
- docs/phases/PHASE_E_COMPLETE.md: escolha E1 vs E2 e por quê; como configurar env; como testar auth.
- STATUS.md atualizado.
- Commit. Nunca gravar senhas/secrets no markdown.

PRÉ-REQUISITO: A done.

ESCOPO — FASE E
- Unificar autorização admin no BE.
- Opção E1 (preferida no plano): bridge Google → cookies JWT admin no FastAPI se email ∈ ADMIN_EMAILS env.
- Opção E2: login password JWT no painel + Google só storefront.
- Escolha UMA, implemente, documente.
- Env ADMIN_EMAILS (ou equivalente) no api — documentar NOME da var, não o segredo.
- FE admin: chamar /api/v1/admin/ping (e auth) com credentials include quando aplicável.
- Allowlist FE pode ficar como UX, mas 401/403 do BE é a barreira real.

PROIBIDO: F–P além do necessário para provar ping; não abrir CRUD pedidos/produtos ainda.

VALIDAÇÃO / DoD
- Com auth admin válida: GET /admin/ping → 200.
- Sem cookie/token: 401.
- User customer: 403 em only-admin ou equivalente.
- PHASE_E_COMPLETE + tests se houver pytest auth.
- Commit.

Resposta final: hash, como o owner configura Railway env, próxima fase F.
```

---

# Prompt — Fase F

```text
Sessão descartável — FASE F apenas. Sem memória; persista no repo.

PROJETO
- Workdir: C:\Users\pedro.torres\Projects\PuffyCalm
- Plano: docs/ECOMMERCE_MASTER_PLAN.md § Fase F
- Ler: STATUS.md + PHASE_E_COMPLETE.md (auth obrigatória)
- Models: backend/app/infrastructure/db/models/order.py

REGRA DE MEMÓRIA
- docs/phases/PHASE_F_COMPLETE.md (endpoints, máquina de estados, exemplos curl sem secrets).
- STATUS.md + commit.

PRÉ-REQUISITO: E done.

ESCOPO — FASE F (API only / backend)
- GET /admin/orders (filtros status, paginação).
- GET /admin/orders/{id} (itens, shipping, payment ids, totals, email).
- PATCH /admin/orders/{id} (status permitidos + admin_notes).
- Validar transições no application layer (rejeitar ilegais).
- Tudo RequireStaff/RequireAdmin — nunca público.
- Pytest para list/get/patch e transição ilegal.

PROIBIDO: UI admin completa (isso é G); products CRUD (H); recriar checkout.

VALIDAÇÃO
- pytest verde nos novos testes.
- DoD do master plan.
- PHASE_F_COMPLETE + STATUS + commit.

Resposta final: hash, lista de endpoints, próxima G.
```

---

# Prompt — Fase G

```text
Sessão descartável — FASE G apenas. Sem memória; escreva o handoff.

PROJETO
- Workdir: C:\Users\pedro.torres\Projects\PuffyCalm
- Plano: docs/ECOMMERCE_MASTER_PLAN.md § Fase G
- Ler: STATUS.md + PHASE_E_COMPLETE + PHASE_F_COMPLETE
- UI em src/app/(admin)/ — usar auth da Fase E

REGRA DE MEMÓRIA
- docs/phases/PHASE_G_COMPLETE.md + STATUS.md + commit.

PRÉ-REQUISITO: F done.

ESCOPO — FASE G
- Rotas /admin/orders e /admin/orders/[id] (ou equivalente Next App Router).
- Lista real + detalhe real + mudar status (chama API F).
- Sem dashboard com números inventados.
- Estados loading/empty/error.
- Mobile usável o suficiente (admin desktop-first ok se documentado).

PROIBIDO: products CRUD (H); CMS; quebrar storefront.

VALIDAÇÃO
- Pedido real/smoke aparece na lista.
- Patch status reflete após refresh.
- tsc; PHASE_G_COMPLETE + STATUS + commit (+ deploy se padrão).

Resposta final: hash, URLs admin, próxima H (se B+E ok).
```

---

# Prompt — Fase H

```text
Sessão descartável — FASE H apenas. Sem memória; handoff no git.

PROJETO
- Workdir: C:\Users\pedro.torres\Projects\PuffyCalm
- Plano: docs/ECOMMERCE_MASTER_PLAN.md § Fase H + cache §12
- Ler: STATUS.md + PHASE_E + PHASE_B (storefront deve ler API) + F/G se existirem

REGRA DE MEMÓRIA
- docs/phases/PHASE_H_COMPLETE.md (API + UI + revalidate strategy).
- STATUS.md + commit.

PRÉ-REQUISITO: E done e B done (catálogo FE na API).

ESCOPO — FASE H
- Admin API: CRUD produtos (create/update), publish/unpublish (status lifecycle do model).
- Categories M2M, specs, image URLs + order (upload real é Fase I — URLs ok agora).
- Validação server-side: preço, slug unique, SKU se houver.
- Admin UI: lista + form criar/editar.
- Após save: revalidateTag/path ou estratégia documentada para o FE não ficar stale.

PROIBIDO: storage upload binário (I); CMS home (J); inventário qty avançado (L) a menos que mínimo necessário.

VALIDAÇÃO
- Draft → publish → aparece no storefront.
- Unpublish → some do catálogo público.
- pytest + tsc; PHASE_H_COMPLETE + STATUS + commit.

Resposta final: hash, como publicar produto, próxima I.
```

---

# Prompt — Fase I

```text
Sessão descartável — FASE I apenas. Sem memória; documente storage no PHASE_I_COMPLETE.

PROJETO
- Workdir: C:\Users\pedro.torres\Projects\PuffyCalm
- Plano: docs/ECOMMERCE_MASTER_PLAN.md § Fase I
- Ler: STATUS.md + PHASE_H_COMPLETE.md
- Preferir storage já disponível (Railway bucket / S3 / R2) — não inventar se já houver

REGRA DE MEMÓRIA
- docs/phases/PHASE_I_COMPLETE.md: provider escolhido, env vars (nomes), limites de arquivo, fluxo delete.
- STATUS.md + commit. Zero secrets em plaintext.

PRÉ-REQUISITO: H done.

ESCOPO — FASE I
- POST /admin/media (multipart) com validação tipo/tamanho/MIME.
- Associar uploads a product_images.
- Política replace/delete e órfãos (mínimo documentado + implementado o essencial).
- Admin UI: upload na edição de produto.
- PDP/storefront mostra nova imagem após publish/revalidate.

PROIBIDO: CMS completo (J); recriar catálogo.

VALIDAÇÃO
- Upload → URL persistida → PDP ok.
- PHASE_I_COMPLETE + STATUS + commit.

Resposta final: hash, provider, próxima J ou K conforme STATUS.
```

---

# Prompt — Fase J

```text
Sessão descartável — FASE J apenas. Sem memória; handoff no repo.

PROJETO
- Workdir: C:\Users\pedro.torres\Projects\PuffyCalm
- Plano: docs/ECOMMERCE_MASTER_PLAN.md § Fase J (CMS-lite)
- Ler: STATUS.md + H/I completes
- Se ROI baixo, documente “defer” com justificativa — mas prefira entregar hero/promo editáveis se viável

REGRA DE MEMÓRIA
- docs/phases/PHASE_J_COMPLETE.md + STATUS.md + commit.

PRÉ-REQUISITO: H (I se imagens de hero forem upload).

ESCOPO — FASE J
- content_blocks ou settings JSON no BE.
- Admin edita promo ticker + hero slides (mínimo).
- Home consome API (não mock/site hardcoded nesses trechos).
- Revalidate home após save.

PROIBIDO: mega-CMS; reescrever todo o site; M (delete mocks) ainda não se outras áreas mockadas.

VALIDAÇÃO
- Mudar promo no admin → home atualiza.
- PHASE_J_COMPLETE + STATUS + commit.

Resposta final: hash, o que é editável, próxima recomendada.
```

---

# Prompt — Fase K

```text
Sessão descartável — FASE K apenas. Sem memória; handoff no git.

PROJETO
- Workdir: C:\Users\pedro.torres\Projects\PuffyCalm
- Plano: docs/ECOMMERCE_MASTER_PLAN.md § Fase K
- Ler: STATUS.md + PHASE_F_COMPLETE (orders API) + auth storefront
- Guest checkout deve continuar funcionando

REGRA DE MEMÓRIA
- docs/phases/PHASE_K_COMPLETE.md (estratégia guest lookup vs Google-linked).
- STATUS.md + commit.

PRÉ-REQUISITO: F done.

ESCOPO — FASE K
- /account/orders real (substituir ComingSoon).
- Estratégia: (1) email+código/public_code e/ou (2) pedidos pelo email da sessão Google.
- Não exigir login para comprar.
- UI empty/error decente.

PROIBIDO: inventário L; admin products.

VALIDAÇÃO
- Compra guest ainda ok.
- Conta logada ou lookup mostra pedido de teste.
- PHASE_K_COMPLETE + STATUS + commit.

Resposta final: hash, como o cliente vê pedidos, próxima.
```

---

# Prompt — Fase L

```text
Sessão descartável — FASE L apenas. Sem memória; handoff crítico (idempotência).

PROJETO
- Workdir: C:\Users\pedro.torres\Projects\PuffyCalm
- Plano: docs/ECOMMERCE_MASTER_PLAN.md § Fase L
- Ler: STATUS.md + F + H + webhook checkout service
- Cuidado máximo com double-delivery de webhook

REGRA DE MEMÓRIA
- docs/phases/PHASE_L_COMPLETE.md: regras de estoque, onde decrementa, testes de idempotência.
- STATUS.md + commit.

PRÉ-REQUISITO: F e H done.

ESCOPO — FASE L
- Evoluir inventário (stock_qty migration se necessário) ou documentar boolean + limites.
- Decrement/reserva no path paid (webhook) — IDEMPOTENTE.
- Status processing → shipped → delivered usáveis (API já F + UI G se existir).
- Produto sem estoque não vende no checkout.

PROIBIDO: recriar Stripe session flow; quebrar idempotency stripe_events.

VALIDAÇÃO
- pytest: double webhook não decrementa 2x; qty 0 bloqueia checkout.
- PHASE_L_COMPLETE + STATUS + commit.

Resposta final: hash, regras de estoque, próxima M se B–D+J ok.
```

---

# Prompt — Fase M

```text
Sessão descartável — FASE M apenas. Sem memória; handoff no repo.

PROJETO
- Workdir: C:\Users\pedro.torres\Projects\PuffyCalm
- Plano: docs/ECOMMERCE_MASTER_PLAN.md § Fase M
- Ler: STATUS.md — confirmar B,C,D e J (ou home sem mock) done

REGRA DE MEMÓRIA
- docs/phases/PHASE_M_COMPLETE.md: grep residual, o que sobrou de mock e por quê.
- STATUS.md + commit.

PRÉ-REQUISITO: paths de negócio no API (B–D; J se home merchandising).

ESCOPO — FASE M
- Remover imports de src/lib/mock dos caminhos de domínio (catalog, reviews, search, home merch se J done).
- Apagar ou isolar órfãos mock/cart.ts, mock/orders.ts.
- Fixtures só em testes/seed BE se necessário.
- Não quebrar build.

PROIBIDO: apagar seed BE; quebrar checkout.

VALIDAÇÃO
- grep mock em src/components e services de domínio = limpo (ou lista residual justificada).
- tsc build; PHASE_M_COMPLETE + STATUS + commit.

Resposta final: hash, residuals, próxima N/O/P.
```

---

# Prompt — Fase N

```text
Sessão descartável — FASE N apenas. Sem memória; handoff no git.

PROJETO
- Workdir: C:\Users\pedro.torres\Projects\PuffyCalm
- Plano: docs/ECOMMERCE_MASTER_PLAN.md § Fase N
- Copy UI em inglês
- Ler: STATUS.md

REGRA DE MEMÓRIA
- docs/phases/PHASE_N_COMPLETE.md + STATUS.md + commit.

ESCOPO — FASE N
- Substituir ComingSoon em about, help, returns, privacy, terms por conteúdo real EN (conciso, profissional).
- Melhorar empty/error states globais de API se ainda fracos (sem redesign total).

PROIBIDO: inventar compliance legal complexo sem base — use placeholders honestos de loja D2C se necessário, marcados no log.

VALIDAÇÃO
- Rotas não são ComingSoon.
- PHASE_N_COMPLETE + STATUS + commit.

Resposta final: hash, lista de páginas, próxima.
```

---

# Prompt — Fase O

```text
Sessão descartável — FASE O apenas. Sem memória; handoff no repo.

PROJETO
- Workdir: C:\Users\pedro.torres\Projects\PuffyCalm
- Plano: docs/ECOMMERCE_MASTER_PLAN.md § Fase O + observabilidade
- Ler: STATUS.md + checkout/webhook paths

REGRA DE MEMÓRIA
- docs/phases/PHASE_O_COMPLETE.md: o que logar, onde, smoke scripts.
- STATUS.md + commit.

ESCOPO — FASE O
- Logs estruturados em checkout create + webhook (order_id, event id; sem PII sensível demais / sem card data).
- Expandir pytest críticos se faltar.
- Script ou doc de smoke pós-deploy (health + opcional checkout test).
- Opcional Sentry se já houver facilidade — senão documentar como follow-up.

PROIBIDO: reescrever app; PayPal completo (P).

VALIDAÇÃO
- Falha simulada ou log path documentado rastreável por order_id.
- PHASE_O_COMPLETE + STATUS + commit.

Resposta final: hash, como diagnosticar pedido falho, próxima P.
```

---

# Prompt — Fase P

```text
Sessão descartável — FASE P (go-live hardening) apenas. Sem memória; handoff final.

PROJETO
- Workdir: C:\Users\pedro.torres\Projects\PuffyCalm
- Plano: docs/ECOMMERCE_MASTER_PLAN.md § Fase P + critério de sucesso final §1
- Ler: STATUS.md + TODOS os PHASE_*_COMPLETE.md
- Confirmar se B–M e E–G (mínimo ops) estão done; se não, listar bloqueios e NÃO fingir go-live

REGRA DE MEMÓRIA
- docs/phases/PHASE_P_COMPLETE.md: checklist go-live, o que ficou de fora, riscos residuais.
- STATUS.md → estado “MVP operável” ou “bloqueado por X”.
- Commit.

ESCOPO — FASE P
- Hardening: secrets audit (sem expor), rate limit notes, smoke SKU policy final (desligar da UI prod se ainda visível).
- Checklist: admin opera pedidos/produtos; cliente compra; sem mocks de domínio.
- PayPal só se explicitamente trivial — default NÃO.
- Atualizar docs/CONTINUE.md com estado final pós-P.

PROIBIDO: recriar Stripe; scope creep.

VALIDAÇÃO
- Checklist do master plan §1 marcado com evidência em PHASE_P_COMPLETE.
- Deploy prod healthy se mudanças.
- STATUS final.

Resposta final ao owner: “Ecommerce estado X”, o que falta se houver, commits, links dos logs.
```

---

## Template opcional de `PHASE_X_COMPLETE.md`

A IA pode copiar esta estrutura:

```markdown
# Fase X — Complete

- **Date:**
- **Commit:**
- **DoD met:** yes/no

## Summary
(what changed in plain language)

## Files touched
-

## Decisions
-

## Env / config (names only)
-

## How to verify
-

## Open issues / next
-
```

---

## Aviso final para o owner

1. **Documento mestre (o plano):** `docs/ECOMMERCE_MASTER_PLAN.md`  
2. **Documento de prompts (este):** `docs/PHASE_PROMPTS.md`  
3. **Estado entre IAs:** `docs/phases/STATUS.md` + `docs/phases/PHASE_*_COMPLETE.md`  

Cada IA **será descartada**. Por isso todo prompt exige que ela **escreva no repositório** o que fez — a próxima sessão sem memória só consegue continuar se isso existir no git.

# Rate limits — estado e notas (Fase P)

> Go-live hardening notes. **Não inventar** limites em prod sem deploy consciente.  
> Relacionado: `docs/security/KNOWN_VULNERABILITIES.md` · `PC-SEC-010`

---

## 1. Onde existe hoje

| Camada | Ambiente | Limite | Notas |
|--------|----------|--------|-------|
| **Nginx gateway** | Local Compose only (`docker/nginx/nginx.conf`) | `10r/s` por IP (`zone=api_limit`), burst 20 | Porta 8080 → API |
| **FastAPI** | Local + Railway prod | **Nenhum** middleware de rate limit | Sem SlowAPI / Redis throttle |
| **Railway edge** | Prod | Platform defaults only | Não substitui app-level throttle |
| **Auth login / refresh** | BE | Sem lockout / backoff | Residual risk |
| **Orders lookup** (`email`+`code`) | BE | Sem throttle | Residual — ver PC-SEC-010 |
| **Checkout session create** | BE | Sem throttle por IP/email | Abuse = pedidos `pending` + Stripe test load |

---

## 2. Política go-live (aceita para MVP)

1. **MVP operável** aceita ausência de rate limit app-level **com** observabilidade (Fase O) + volume baixo.
2. **Antes de ads / tráfego pago:** implementar throttle Redis em:
   - `POST /auth/login`, `POST /auth/refresh`
   - `GET /orders/lookup`, `GET /orders/by-email`
   - `POST /checkout/sessions`
3. Local nginx limit permanece para dev realism; **não** é o path de prod (Railway aponta direto no `api` service).
4. Webhooks Stripe **não** devem ser rate-limited de forma que cause retries longos; validação = assinatura + `stripe_events`.

---

## 3. Sugestão de implementação futura (não Fase P)

```text
Redis key: rl:{route}:{ip}  |  rl:email:{hash}
Window: 60s
login: 10/min/IP
orders lookup: 20/min/IP + 10/min/email
checkout create: 30/min/IP + 10/min/email
```

Resposta: HTTP **429** + `Retry-After`. Log estruturado `rate_limited` (sem PII).

---

## 4. Verificação

```bash
# Local (gateway)
curl -sI http://localhost:8080/health | head -5
# Prod — sem limit app-level (esperado até fix SEC-010)
curl -sS https://api-production-4f01.up.railway.app/health
```

**Signed Phase P:** rate-limit gap **documentado**; remediação = follow-up security, não bloqueio de “MVP operável” se volume orgânico baixo.

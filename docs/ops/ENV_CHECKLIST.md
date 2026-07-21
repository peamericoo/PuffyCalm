# Checklist de environment variables (prod + local)

> **Nunca colar valores secretos neste arquivo ou em logs de fase.**  
> Verificação operacional: presença / prefixo / comprimento — não o secret.  
> Atualizado: Fase A (2026-07-21)

Railway project: `divine-consideration` · env: `production`  
Web: `https://web-production-ea635.up.railway.app`  
API: `https://api-production-4f01.up.railway.app`

---

## 1. API service (`api`) — required for checkout

| Variable | Required | Purpose | Fase A prod |
|----------|----------|---------|-------------|
| `STRIPE_SECRET_KEY` | **Yes** | Stripe API (server only) | **SET** (test mode `sk_test…`) |
| `STRIPE_WEBHOOK_SECRET` | **Yes** | Verify webhook signatures | **SET** (`whsec…`) |
| `STRIPE_API_VERSION` | Yes | Pin API (custom Checkout needs ≥ basil) | **SET** |
| `STOREFRONT_URL` | **Yes** | `return_url` base for Session.create | **SET** (Railway web URL) |
| `DATABASE_URL` | **Yes** | Postgres async | **SET** |
| `REDIS_URL` | **Yes** | Refresh jti / Celery | **SET** |
| `SECRET_KEY` | **Yes** | JWT signing | **SET** |
| `CORS_ORIGINS` | **Yes** | Browser origins (web URL) | **SET** |
| `APP_ENV` | Yes | `production` vs dev cookies | **SET** |
| `ADMIN_EMAIL` | Yes | Seed primary + fallback allowlist | **SET** |
| `ADMIN_EMAILS` | **Yes (Fase E)** | Comma-separated Google emails → BE role `admin` | set on deploy (see below) |
| `STAFF_EMAILS` | Optional | Comma-separated Google emails → role `staff` | optional |
| `GOOGLE_CLIENT_ID` | **Yes (Fase E)** | OAuth Web client ID (ID token audience); same as web `AUTH_GOOGLE_ID` | set on deploy |
| `COOKIE_SAMESITE` | **Yes (prod cross-origin)** | `none` when web host ≠ api host (Railway) | set `none` in prod |
| `COOKIE_SECURE` | With SameSite=None | Must be true (or leave auto from `APP_ENV=production`) | auto true in prod |
| `FREE_SHIPPING_THRESHOLD_CENTS` | Ops | Shipping math | **SET = 7500** (Fase D; $75 free ship) |
| `FLAT_SHIPPING_CENTS` | Ops | Shipping math | **SET = 699** (Fase D; $6.99 flat) |
| `CELERY_BROKER_URL` | Optional MVP | Worker | SET |
| `CELERY_RESULT_BACKEND` | Optional MVP | Worker | SET |
| `S3_ENDPOINT_URL` | **Yes (Fase I prod)** | S3-compatible endpoint (Railway bucket) | set on deploy |
| `S3_BUCKET` | **Yes (Fase I prod)** | Bucket name (S3 API name) | set on deploy |
| `S3_ACCESS_KEY_ID` | **Yes (Fase I prod)** | Bucket access key | set on deploy |
| `S3_SECRET_ACCESS_KEY` | **Yes (Fase I prod)** | Bucket secret (never log) | set on deploy |
| `S3_REGION` | Yes | Usually `auto` for Railway | set on deploy |
| `S3_PUBLIC_BASE_URL` | **Yes (Fase I prod)** | **API media proxy base** (not raw bucket host). Railway buckets are private. Example: `https://api-….up.railway.app/media` | set on deploy |
| `MEDIA_MAX_BYTES` | Optional | Max upload size (default 5 MiB = 5242880) | optional |

**Rules:**

- Secrets **only** on Railway / local `.env` — never commit.
- Publishable Stripe key does **not** belong on `api`.
- Webhook URL (Stripe Dashboard / CLI):  
  `https://api-production-4f01.up.railway.app/api/v1/webhooks/stripe`
- **Fase E:** `ADMIN_EMAILS` is the real admin barrier (not FE `ADMIN_EMAIL`).  
  `GOOGLE_CLIENT_ID` is public client ID (not a secret), but keep env-only.

---

## 2. Web service (`web`) — storefront

| Variable | Required | Purpose | Fase A prod |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | **Yes** | Browser → FastAPI base | **SET** (api Railway public URL) |
| `NEXT_PUBLIC_USE_API_CATALOG` | Deprecated | Phase M: ignored; domain data always API | may be unset |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | **Yes** | Stripe.js / Elements | **SET** (test `pk_test…`) |
| `AUTH_SECRET` | **Yes** | Auth.js | **SET** |
| `AUTH_GOOGLE_ID` | **Yes** | Google OAuth | **SET** |
| `AUTH_GOOGLE_SECRET` | **Yes** | Google OAuth | **SET** |
| `AUTH_URL` | **Yes** | Canonical site URL for Auth.js | **SET** |
| `AUTH_TRUST_HOST` | Yes | Railway / proxy | **SET** |
| `ADMIN_EMAIL` | Yes | FE allowlist UX only (not BE auth) | **SET** |
| `NEXT_PUBLIC_APP_URL` | Recommended | Absolute links / metadata | **SET** |
| `NEXT_PUBLIC_SITE_NAME` | Recommended | Branding | **SET** |
| `NEXT_PUBLIC_DOMAIN` | Optional | Domain display | SET |
| `STAFF_EMAILS` | Optional | Extra FE staff allowlist | may be unset |

**Rules:**

- `NEXT_PUBLIC_*` is visible in the browser — never put server secrets there.
- FE admin email allowlist is **UX only**; real admin auth = **Fase E** BE JWT  
  (`POST /auth/google-exchange` + cookies → `GET /admin/ping`).

---

## 3. Local dev

| File | Service |
|------|---------|
| `.env` (from `.env.example`) | Docker Compose / API |
| `.env.local` (from `.env.local.example`) | Next.js |

Local Stripe:

```bash
# Terminal A — forward webhooks to gateway or API
stripe listen --forward-to localhost:8080/api/v1/webhooks/stripe
# Put printed whsec_… into API .env as STRIPE_WEBHOOK_SECRET (local only)
```

Local checklist (developer signs off, no values in git):

- [ ] `STRIPE_SECRET_KEY` (test) in API `.env`
- [ ] `STRIPE_WEBHOOK_SECRET` from `stripe listen`
- [ ] `STOREFRONT_URL=http://localhost:3000`
- [ ] `NEXT_PUBLIC_API_URL=http://localhost:8080` (or `:8000` if no nginx)
- [ ] Catalog/reviews/search always hit API (`NEXT_PUBLIC_API_URL`); no mock rollback (Phase M)
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (test) in `.env.local`
- [ ] Auth Google redirect URIs include `http://localhost:3000/api/auth/callback/google`
- [ ] API: `ADMIN_EMAILS` + `GOOGLE_CLIENT_ID` (same client id as `AUTH_GOOGLE_ID`)
- [ ] Local cookies: `COOKIE_SAMESITE=lax` OK (localhost same-site)
- [ ] Fase I media: either S3_* vars (Railway bucket) **or** leave unset for local `uploads/` + `/media`

---

## 4. Sign-off (Fase A)

| Check | Result | How verified |
|-------|--------|--------------|
| API health prod | **OK** | `GET https://api-production-4f01.up.railway.app/health` → 200 |
| API ready prod | **OK** | `GET …/ready` → postgres+redis true |
| Web prod | **OK** | `GET https://web-production-ea635.up.railway.app/` → 200 |
| Stripe keys present (api+web) | **OK** | Railway CLI keys present; prefixes `sk_test` / `pk_test` / `whsec` |
| STOREFRONT_URL / NEXT_PUBLIC_API_URL | **OK** | Set; cross-service Railway hosts |
| Shipping canônico 75 / 6.99 | **OK (Fase D)** | FE constants 75/6.99; Railway api 7500/699 |

**Signed:** Fase A automation · 2026-07-21 · **PASS** (prod env).  
**Fase D update:** shipping restored to business values (2026-07-21).

---

## 5. Commands (no secret output)

```bash
# Health
curl -sS https://web-production-ea635.up.railway.app/ -o NUL -w "%{http_code}\n"
curl -sS https://api-production-4f01.up.railway.app/health
curl -sS https://api-production-4f01.up.railway.app/ready

# Presence only (keys names)
railway variables --service api
railway variables --service web
```

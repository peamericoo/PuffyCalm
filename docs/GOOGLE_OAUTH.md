# Google OAuth — storefront customers (Auth.js)

## Goal

- **Customers** create/sign in with Google on the Next.js storefront (Auth.js v5).
- **Guest checkout** always works (no forced login).
- **Admin**: Google email `paletot.business@gmail.com` → role `admin` in session.
- **Free quotas only**: classic OAuth 2.0 Web Client (no Identity Platform billing, no Secret Manager required).

## GCP project

| Field | Value |
|-------|--------|
| Project | `easypuff-502919` (PuffyCalm) |
| Owner | `paletot.business@gmail.com` |

## Create OAuth client (free — Console only)

Google does **not** expose a stable public API to create Web OAuth clients on personal projects without an organization. Create once in Console:

1. Open [Google Auth Platform → Clients](https://console.cloud.google.com/auth/clients?project=easypuff-502919)  
   or [Credentials → Create OAuth client](https://console.cloud.google.com/apis/credentials/oauthclient?project=easypuff-502919)
2. If prompted, configure **OAuth consent screen** (External or Internal):
   - App name: **PuffyCalm**
   - Support email: `paletot.business@gmail.com`
   - Scopes: `openid`, `email`, `profile` (default)
   - Test users (while in Testing): add any Gmail you use to sign in
3. Create **OAuth client ID** → type **Web application**  
   - Name: `PuffyCalm Web`
   - **Authorized JavaScript origins**
     - `http://localhost:3000`
     - `https://web-production-ea635.up.railway.app`
     - (later) `https://puffycalm.com` / `https://www.puffycalm.com`
   - **Authorized redirect URIs**
     - `http://localhost:3000/api/auth/callback/google`
     - `https://web-production-ea635.up.railway.app/api/auth/callback/google`
     - (later) production custom domain same path
4. Copy **Client ID** + **Client secret** into `.env.local` and Railway `web` service.

## Env vars

**Provisioned (2026-07-20)** in **`.env.local`**, **`.env.google-oauth.local`** (gitignored), and **Railway `web`**.  
Do **not** put Client ID/Secret in committed markdown (GitHub push protection blocks them).

```bash
AUTH_SECRET=<per-environment>
AUTH_URL=http://localhost:3000          # prod: https://web-production-ea635.up.railway.app
AUTH_TRUST_HOST=true
AUTH_GOOGLE_ID=<from Google Cloud Console — never commit>
AUTH_GOOGLE_SECRET=<from Google Cloud Console — never commit>
ADMIN_EMAIL=paletot.business@gmail.com
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## App routes

| Path | Role |
|------|------|
| `/register` | “Create account with Google” → Auth.js → Google → `/account` |
| `/login` | Same OAuth (sign-in); first time = create account |
| `/account` | Session profile (requires sign-in) |
| `/api/auth/*` | Auth.js handlers |
| `/checkout` | **Never** requires auth (guest OK) |

## Verify

```bash
npm run dev
# open /register → Continue with Google → complete Google → land on /account
curl -sI http://localhost:3000/api/auth/providers | head
# should list google
```

Production: set the same vars on Railway `web`, redeploy, test  
`https://web-production-ea635.up.railway.app/register`.

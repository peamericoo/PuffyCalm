# PHASE J COMPLETE — CMS-lite home (promo + hero)

| Campo | Valor |
|-------|--------|
| **Fase** | J — CMS-lite home content |
| **Data** | 2026-07-21 |
| **Commit** | `99fe3dd` |
| **DoD atingido** | **SIM** — API + admin UI + storefront consome BE; revalidate home |

---

## 1. Objetivo

Hero slides e promo ticker editáveis sem deploy de código. Home e chrome do site leem da API (não de `lib/mock/site` nesses trechos).

**ROI:** positivo para MVP — promo e hero mudam com frequência de campanha; nav mega-menu permanece em código (não-escopo).

---

## 2. Modelo BE

| Item | Valor |
|------|--------|
| Tabela | `content_blocks` |
| PK | `key` (string, ex. `home`) |
| Payload | JSONB |
| Migration | `j1a2b3c4d5e6_create_content_blocks` |
| Seed | defaults espelhando o mock antigo; idempotente via `seed_home_content` |

### Payload `key=home`

```json
{
  "promoMessages": ["string", "..."],
  "heroSlides": [
    {
      "id": "slide_launch",
      "titleLine1": "...",
      "titleLine2": "...",
      "titleAccent": "optional",
      "subtitle": "...",
      "ctaLabel": "...",
      "ctaHref": "/category/all",
      "secondaryLabel": "optional",
      "secondaryHref": "optional",
      "imageUrl": "https://… or /media/…",
      "imageAlt": "..."
    }
  ]
}
```

**Limites:** 1–20 promos (≤200 chars); 1–8 slides; imageUrl = `http(s)` ou `/media/…`.

---

## 3. API

| Method | Path | Auth | Notas |
|--------|------|------|--------|
| `GET` | `/api/v1/content/home` | Público | Storefront; auto-seed defaults se row ausente |
| `GET` | `/api/v1/admin/content/home` | Staff/Admin | Leitura admin |
| `PUT` | `/api/v1/admin/content/home` | Staff/Admin | Replace completo de promo + hero |

Respostas camelCase (`promoMessages`, `heroSlides`, `updatedAt`).

---

## 4. Admin UI

| Path | Componente |
|------|------------|
| `/admin/content` | `ContentEditorView` |

- Nav **Content** no admin shell
- Promo: textarea (1 mensagem por linha)
- Hero: form por slide + add / remove / reorder
- Save → `PUT` → `revalidateHome()` → tags `home` + `content` + path `/`
- Image URLs manuais (https ou proxy `/media/…` da Fase I); sem upload dedicado de hero nesta fase

---

## 5. Storefront

| Peça | Comportamento |
|------|----------------|
| Layout storefront | `getHomeContent()` → `PromoBar` messages |
| Home page | `getHomeContent()` → `HeroCarousel` slides |
| Client cache | `fetch` tags `home`, `content`; `revalidate = 60` na home |
| Fallback | `src/lib/content/defaults.ts` se API falhar (nunca blank) |
| Mock | `promoMessages` / `heroSlides` em `site.ts` **deprecated** — não usados no chrome/home |

---

## 6. Revalidate

`POST /api/admin/revalidate` aceita `{ "home": true }`:

- Tags: `home`, `content`
- Path: `/`
- Fallback ISR ≤ 60s se revalidate falhar (mensagem na UI)

Helper: `src/lib/admin/revalidate-home.ts`.

---

## 7. Validação

| Check | Resultado |
|-------|-----------|
| Migration `j1a2b3c4d5e6` no Postgres Railway | OK |
| Seed home row | 6 promos, 4 slides |
| Unit normalize | 4 passed |
| API tests (`REQUIRE_READY=1`) | 5 + 4 = 9 passed |
| `tsc --noEmit` | OK |

**Fluxo ops:** Admin → Content → alterar promo → Save & revalidate → home/ticker atualiza (ou ≤60s ISR).

---

## 8. Fora de escopo (proposital)

- Mega-CMS / páginas legais / blog
- Nav / footer / lifestyle collections (ainda mock/código)
- Upload dedicado de imagens de hero (usar URL ou `/media/` da Fase I)
- Fase M (delete mocks)

---

## 9. Arquivos principais

**Backend**

- `app/infrastructure/db/models/content.py`
- `alembic/versions/j1a2b3c4d5e6_create_content_blocks.py`
- `app/application/content/*`
- `app/api/v1/content.py` + admin endpoints
- `tests/test_content_api.py`, `tests/test_content_normalize.py`

**Frontend**

- `src/lib/api/content.ts`, `admin-content.ts`
- `src/lib/content/defaults.ts`, `src/types/content.ts`
- `src/components/admin/content-editor-view.tsx`
- `src/app/(admin)/admin/content/page.tsx`
- PromoBar / HeroCarousel / layout / home page

---

## 10. Deploy notes

1. **API** redeploy → migration já aplicada no Postgres público; ensure_home roda no first GET se vazio.
2. **Web** redeploy → layout + home + `/admin/content`.
3. Após deploy: smoke `GET /api/v1/content/home` e save no admin.

---

## 11. Próxima fase recomendada

**K — Account orders** (cliente vê pedidos reais; guest checkout intacto)

Alternativa se ops de catálogo priorizar: **L** inventory/fulfillment.

Prompt: `docs/PHASE_PROMPTS.md` → Fase K.

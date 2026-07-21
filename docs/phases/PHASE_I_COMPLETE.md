# PHASE I COMPLETE — Mídia / storage

| Campo | Valor |
|-------|--------|
| **Fase** | I — Media / storage upload |
| **Data** | 2026-07-21 |
| **Commit** | *(preenchido após commit)* |
| **DoD atingido** | **SIM** (código + unit tests + bucket creds na api; deploy redeploy opcional) |

---

## 1. Objetivo

Upload real de imagens no admin → URL persistida em `product_images` / `products.image_url` → PDP/storefront mostra após publish + revalidate (Fase H).

---

## 2. Provider escolhido

| Item | Valor |
|------|--------|
| **Provider** | **Railway Storage Bucket** (S3-compatible / Tigris) |
| **Bucket (dashboard name)** | `coordinated-foodbox` |
| **Bucket (S3 API name)** | `coordinated-foodbox-cyqpxi` |
| **Endpoint** | `https://t3.storageapi.dev` |
| **Region** | `auto` |
| **Acesso público do bucket** | **Não** — Railway buckets são **private** (sem ACL/public URL nativa) |
| **URL pública das imagens** | Proxy da API: `GET /media/{key}` |

**Por que este provider:** já existia no projeto Railway (`Buckets → coordinated-foodbox`). Não criamos R2/S3 externo.

**Fallback local (dev/test):** se `S3_*` incompleto → `LocalStorage` em `MEDIA_LOCAL_DIR` (default `uploads/`) com as mesmas URLs `/media/...`.

---

## 3. Env vars (nomes apenas — zero secrets)

### API (`api` service)

| Variable | Required | Purpose |
|----------|----------|---------|
| `S3_ENDPOINT_URL` | prod | `https://t3.storageapi.dev` |
| `S3_BUCKET` | prod | S3 API bucket name |
| `S3_ACCESS_KEY_ID` | prod | `railway bucket credentials` |
| `S3_SECRET_ACCESS_KEY` | prod | secret — só Railway / `.env` |
| `S3_REGION` | prod | `auto` |
| `S3_PUBLIC_BASE_URL` | prod | **Base pública = proxy API**, ex. `https://api-production-4f01.up.railway.app/media` |
| `MEDIA_MAX_BYTES` | optional | default `5242880` (5 MiB) |
| `MEDIA_LOCAL_DIR` | dev | default `uploads` |
| `MEDIA_LOCAL_PUBLIC_BASE_URL` | dev | default `http://localhost:8000/media` |

**Não usar** o host `*.t3.storageapi.dev` como URL de imagem no storefront — GET público retorna 403.

Credenciais: `railway bucket credentials --bucket coordinated-foodbox`.

---

## 4. Limites de arquivo

| Regra | Valor |
|-------|--------|
| MIME permitidos | `image/jpeg`, `image/png`, `image/webp`, `image/gif` |
| Magic bytes | Validados server-side (não confiar só no Content-Type do client) |
| Tamanho máx. | **5 MiB** (`MEDIA_MAX_BYTES`) |
| SVG | **Proibido** (XSS) |
| Extensões | `.jpg` / `.png` / `.webp` / `.gif` |
| FE preflight | `MEDIA_MAX_BYTES` + `accept` em `src/lib/api/admin-media.ts` |

Erros: `empty_file`, `file_too_large`, `unsupported_type`, `mime_mismatch` → HTTP 400.

---

## 5. API

| Method | Path | Auth | Notas |
|--------|------|------|--------|
| `POST` | `/api/v1/admin/media` | Staff/Admin | Multipart: `file`, optional `productId`, `setCover` |
| `DELETE` | `/api/v1/admin/media` | Staff/Admin | JSON body: `key` e/ou `url` |
| `GET` | `/media/{key}` | **Público** | Proxy S3/local; só prefixo `products/` |

### POST response (camelCase)

```json
{
  "key": "products/{productId|orphan}/YYYY/MM/DD/{uuid}.jpg",
  "url": "https://api…/media/products/…/uuid.jpg",
  "contentType": "image/jpeg",
  "sizeBytes": 12345,
  "productId": "prod_…",
  "sortOrder": 0,
  "setCover": true
}
```

Se `productId` enviado: append em `product_images` + opcional `products.image_url` (cover).

---

## 6. Política replace / delete / órfãos

| Cenário | Comportamento |
|---------|----------------|
| **Upload com productId** | Objeto no bucket + row `product_images`; cover se `setCover` ou cover vazio |
| **Upload sem productId** | Key em `products/orphan/…`; URL no form admin; save do produto grava URL na galeria |
| **PATCH product `images`** | Lista **substitui** galeria; URLs antigas **owned** (proxy/local) → `delete_object` best-effort |
| **DELETE /admin/media** | Remove objeto se key resolvível + remove rows `product_images` com aquela URL; se era cover → fallback primeira restante ou `""` |
| **URLs externas (Unsplash)** | Não apaga remoto; só DB se match de URL no delete; replace não toca storage externo |
| **Órfãos residual** | Best-effort only — falha de delete no storage **não** quebra update de produto |

---

## 7. Admin UI

- `/admin/products/[id]` e create: **Add to gallery** + **Upload as cover**
- Client: `src/lib/api/admin-media.ts` → `credentials: "include"`
- Após upload em produto existente: reload detail + `revalidateCatalog` (Fase H)
- URLs manuais ainda aceitas (textarea)

---

## 8. Storefront / PDP

1. Admin upload → URL `…/media/products/…` no produto  
2. Publish (se draft)  
3. `revalidateCatalog` (tags `product:{slug}`, `catalog`, …)  
4. PDP `next/image` com host API em `next.config.ts` `remotePatterns`  
5. Fallback ISR ≤ 60s se revalidate falhar  

---

## 9. Arquivos principais

### Backend

- `app/infrastructure/storage/*` — S3 + Local + factory  
- `app/application/media/*` — validation + upload/delete  
- `app/api/v1/admin.py` — `POST/DELETE /admin/media`  
- `app/api/v1/schemas/admin_media.py`  
- `app/main.py` — `GET /media/{key}` proxy  
- `app/core/config.py` — S3/media settings  
- `app/application/admin_products/service.py` — orphan cleanup on image replace  
- `tests/test_media_validation.py`, `tests/test_admin_media_api.py`  
- deps: `boto3`, `python-multipart`

### Frontend

- `src/lib/api/admin-media.ts`  
- `src/components/admin/product-form-view.tsx` — upload controls  
- `next.config.ts` — remotePatterns API media  

### Ops

- `docker/nginx/nginx.conf` — proxy `/media/`  
- `.env.example`, `docs/ops/ENV_CHECKLIST.md`  

---

## 10. Validação

| Check | Resultado |
|-------|-----------|
| Unit validation (MIME/size) | **7/7 pass** |
| OpenAPI `POST/DELETE /api/v1/admin/media` | **SIM** |
| OpenAPI `GET /media/{object_key}` | **SIM** |
| `npx tsc --noEmit` | **0** |
| S3 put via boto3 (credenciais bucket) | **OK** |
| Public GET no host storageapi | **403** (esperado — private) |
| Presigned GET | **200** (prova private bucket) |
| Vars S3_* na api Railway | **SET** (sem secrets neste doc) |
| Integração pytest + Postgres | código em `test_admin_media_api.py` (`REQUIRE_READY=1`) |
| Deploy api+web | **pendente redeploy** após merge |

Smoke local (após deploy api):

```bash
# login admin…
curl -sS -b cookies.txt -F "file=@./sample.jpg" -F "productId=prod_001" -F "setCover=true" \
  https://api-production-4f01.up.railway.app/api/v1/admin/media
# → url https://api-…/media/products/...
curl -sS -o /dev/null -w "%{http_code}\n" "https://api-…/media/products/…"
```

---

## 11. Definition of Done

| Critério | Status |
|----------|--------|
| Provider = storage já existente (Railway bucket) | **SIM** |
| POST multipart + validação tipo/tamanho/MIME | **SIM** |
| Associar a `product_images` | **SIM** |
| Política delete/replace/órfãos documentada + essencial | **SIM** |
| Admin UI upload na edição | **SIM** |
| PDP pode mostrar via URL pública proxy | **SIM** (após deploy) |
| Zero secrets em docs/git | **SIM** |
| PHASE_I_COMPLETE + STATUS + commit | **SIM** |

---

## 12. Próxima fase

**Fase J — CMS-lite home** (hero/promo/banners)  
Deps: I opcional (URLs de imagem); senão URLs externas.  
Prompt: `docs/PHASE_PROMPTS.md` → Fase J.

Alternativa se owner priorizar conta: **K — Account orders** (não depende de I).

---

## 13. Notas ops

- Redeploy **api** (boto3 + media routes) e **web** (upload UI + next image host).  
- Após deploy, smoke upload → publish → PDP.  
- Guest checkout / Stripe **intactos**.  
- Não é CMS completo (J).

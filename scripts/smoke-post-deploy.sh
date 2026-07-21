#!/usr/bin/env bash
# PuffyCalm Phase O — post-deploy smoke (health + optional catalog/checkout)
# Usage:
#   ./scripts/smoke-post-deploy.sh
#   API_BASE=http://localhost:8080 ./scripts/smoke-post-deploy.sh
#   SMOKE_CHECKOUT=1 ./scripts/smoke-post-deploy.sh
set -euo pipefail

API_BASE="${API_BASE:-https://api-production-4f01.up.railway.app}"
API_BASE="${API_BASE%/}"
SMOKE_EMAIL="${SMOKE_EMAIL:-smoke+phase-o@example.com}"
failed=0

step() { printf '==> %s\n' "$*"; }
ok() { printf 'OK  %s\n' "$*"; }
fail() { printf 'FAIL %s\n' "$*"; failed=$((failed + 1)); }

step "API base: ${API_BASE}"

step "GET /health"
if health="$(curl -fsS --max-time 30 "${API_BASE}/health")"; then
  echo "$health" | grep -q '"status"[[:space:]]*:[[:space:]]*"ok"' && ok "health ok" || fail "health body unexpected: $health"
else
  fail "health request failed"
fi

step "GET /ready"
ready_code="$(curl -sS -o /tmp/pc_ready.json -w '%{http_code}' --max-time 30 "${API_BASE}/ready" || true)"
if [[ "$ready_code" == "200" ]]; then
  ok "ready HTTP 200 $(cat /tmp/pc_ready.json 2>/dev/null || true)"
else
  fail "ready HTTP ${ready_code} $(cat /tmp/pc_ready.json 2>/dev/null || true)"
fi

step "GET /api/v1/catalog"
if curl -fsS --max-time 30 "${API_BASE}/api/v1/catalog" >/tmp/pc_cat.json; then
  ok "catalog responded"
else
  fail "catalog request failed"
fi

if [[ "${SMOKE_CHECKOUT:-0}" == "1" ]]; then
  step "POST /api/v1/checkout/sessions (optional)"
  # Prefer python for JSON if available
  if command -v python3 >/dev/null 2>&1; then
    export API_BASE
    product_id="$(python3 - <<'PY'
import json,sys,urllib.request,os
base=os.environ.get("API_BASE","").rstrip("/")
with urllib.request.urlopen(base+"/api/v1/catalog", timeout=30) as r:
    data=json.load(r)
items=data.get("products") or []
if not items:
    sys.exit(2)
pid=items[0].get("id") or ""
print(pid)
PY
)" || product_id=""
  else
    product_id=""
  fi
  if [[ -z "${product_id}" ]]; then
    fail "could not resolve product id for checkout"
  else
    code="$(curl -sS -o /tmp/pc_checkout.json -w '%{http_code}' --max-time 60 \
      -X POST "${API_BASE}/api/v1/checkout/sessions" \
      -H 'Content-Type: application/json' \
      -d "{\"email\":\"${SMOKE_EMAIL}\",\"lines\":[{\"productId\":\"${product_id}\",\"quantity\":1}],\"shipping\":{\"fullName\":\"Smoke Tester\",\"line1\":\"1 Market St\",\"city\":\"San Francisco\",\"region\":\"CA\",\"postal\":\"94105\",\"country\":\"US\"}}")"
    if [[ "$code" == "201" ]]; then
      ok "checkout $(cat /tmp/pc_checkout.json)"
      echo "     Grep Railway logs by orderId from response (checkout_create_ok | stripe_webhook_ok)"
    else
      fail "checkout HTTP ${code} $(cat /tmp/pc_checkout.json 2>/dev/null || true)"
    fi
  fi
else
  echo "SKIP optional checkout (set SMOKE_CHECKOUT=1)"
fi

echo
if [[ "$failed" -gt 0 ]]; then
  fail "smoke finished with ${failed} failure(s)"
  exit 1
fi
ok "smoke passed"
exit 0

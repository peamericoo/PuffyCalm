# PuffyCalm Phase O — post-deploy smoke (health + optional catalog/checkout)
# Usage:
#   pwsh scripts/smoke-post-deploy.ps1
#   pwsh scripts/smoke-post-deploy.ps1 -ApiBase https://api-production-4f01.up.railway.app
#   pwsh scripts/smoke-post-deploy.ps1 -ApiBase http://localhost:8080 -Checkout
# Env: API_BASE, SMOKE_CHECKOUT=1, SMOKE_EMAIL

param(
  [string]$ApiBase = $(if ($env:API_BASE) { $env:API_BASE } else { "https://api-production-4f01.up.railway.app" }),
  [switch]$Checkout,
  [string]$Email = $(if ($env:SMOKE_EMAIL) { $env:SMOKE_EMAIL } else { "smoke+phase-o@example.com" })
)

$ErrorActionPreference = "Stop"
$ApiBase = $ApiBase.TrimEnd("/")
$doCheckout = $Checkout -or ($env:SMOKE_CHECKOUT -eq "1")

function Write-Step($msg) { Write-Host "==> $msg" -ForegroundColor Cyan }
function Write-Ok($msg) { Write-Host "OK  $msg" -ForegroundColor Green }
function Write-Fail($msg) { Write-Host "FAIL $msg" -ForegroundColor Red }

$failed = 0

Write-Step "API base: $ApiBase"

# --- /health ---
Write-Step "GET /health"
try {
  $h = Invoke-RestMethod -Uri "$ApiBase/health" -Method Get -TimeoutSec 30
  if ($h.status -ne "ok") { throw "status=$($h.status)" }
  Write-Ok "health status=ok service=$($h.service) env=$($h.env) version=$($h.version)"
} catch {
  Write-Fail "health: $_"
  $failed++
}

# --- /ready ---
Write-Step "GET /ready"
try {
  $r = Invoke-WebRequest -Uri "$ApiBase/ready" -Method Get -TimeoutSec 30 -SkipHttpErrorCheck
  $body = $r.Content | ConvertFrom-Json
  if ($r.StatusCode -ne 200) {
    Write-Fail "ready HTTP $($r.StatusCode) checks=$($body.checks | ConvertTo-Json -Compress)"
    $failed++
  } else {
    Write-Ok "ready status=$($body.status) postgres=$($body.checks.postgres) redis=$($body.checks.redis)"
  }
} catch {
  Write-Fail "ready: $_"
  $failed++
}

# --- catalog smoke (public) ---
Write-Step "GET /api/v1/catalog"
try {
  $cat = Invoke-RestMethod -Uri "$ApiBase/api/v1/catalog" -Method Get -TimeoutSec 30
  $n = 0
  if ($cat.products) { $n = @($cat.products).Count }
  Write-Ok "catalog responded (products≈$n total=$($cat.total))"
} catch {
  Write-Fail "catalog: $_"
  $failed++
}

# --- optional checkout (creates real pending order + needs Stripe) ---
if ($doCheckout) {
  Write-Step "POST /api/v1/checkout/sessions (optional — creates order)"
  try {
    # Resolve a published product id from catalog
    $list = Invoke-RestMethod -Uri "$ApiBase/api/v1/catalog" -Method Get -TimeoutSec 30
    $items = @()
    if ($list.products) { $items = @($list.products) }
    if ($items.Count -lt 1) { throw "no catalog products" }
    $pid = $items[0].id
    if (-not $pid) { throw "product id missing on first item" }

    $body = @{
      email = $Email
      lines = @(@{ productId = $pid; quantity = 1 })
      shipping = @{
        fullName = "Smoke Tester"
        line1 = "1 Market St"
        city = "San Francisco"
        region = "CA"
        postal = "94105"
        country = "US"
      }
    } | ConvertTo-Json -Depth 5

    $res = Invoke-WebRequest `
      -Uri "$ApiBase/api/v1/checkout/sessions" `
      -Method Post `
      -ContentType "application/json" `
      -Body $body `
      -TimeoutSec 60 `
      -SkipHttpErrorCheck

    $json = $res.Content | ConvertFrom-Json
    if ($res.StatusCode -ne 201) {
      Write-Fail "checkout HTTP $($res.StatusCode) body=$($res.Content)"
      $failed++
    } else {
      Write-Ok "checkout order_id=$($json.orderId) public_code=$($json.publicCode) total_cents=$($json.totalCents)"
      Write-Host "     Grep Railway logs: order_id=$($json.orderId)" -ForegroundColor Yellow
      Write-Host "     Event keys: checkout_create_ok | checkout_session_created | stripe_webhook_ok" -ForegroundColor Yellow
    }
  } catch {
    Write-Fail "checkout: $_"
    $failed++
  }
} else {
  Write-Host "SKIP optional checkout (pass -Checkout or SMOKE_CHECKOUT=1)" -ForegroundColor DarkGray
}

Write-Host ""
if ($failed -gt 0) {
  Write-Fail "smoke finished with $failed failure(s)"
  exit 1
}
Write-Ok "smoke passed"
exit 0

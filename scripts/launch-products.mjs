#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";

const DEFAULT_API_BASE = "https://api-production-4f01.up.railway.app";
const TRANSIENT_STATUSES = new Set([408, 429, 500, 502, 503, 504]);

function parseArgs(argv) {
  const args = {
    apiBase: process.env.PUFFYCALM_API_BASE || DEFAULT_API_BASE,
    payload: process.env.PUFFYCALM_PAYLOAD_FILE || "",
    report: process.env.PUFFYCALM_LAUNCH_REPORT || "",
    execute: false,
    updateExisting: false,
    delayMs: 250,
    retries: 3,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--execute") args.execute = true;
    else if (arg === "--update-existing") args.updateExisting = true;
    else if (arg === "--payload") args.payload = argv[++i] || "";
    else if (arg === "--report") args.report = argv[++i] || "";
    else if (arg === "--api") args.apiBase = argv[++i] || args.apiBase;
    else if (arg === "--delay-ms") args.delayMs = Number(argv[++i] || args.delayMs);
    else if (arg === "--retries") args.retries = Number(argv[++i] || args.retries);
    else if (arg === "--help") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  if (!args.payload) {
    throw new Error("Missing --payload or PUFFYCALM_PAYLOAD_FILE.");
  }
  args.apiBase = args.apiBase.replace(/\/$/, "");
  args.payload = resolve(args.payload);
  args.report = args.report
    ? resolve(args.report)
    : resolve(
        process.cwd(),
        `puffycalm-launch-report-${new Date().toISOString().replace(/[:.]/g, "-")}.json`,
      );
  return args;
}

function printHelp() {
  console.log(`Usage:
  node scripts/launch-products.mjs --payload <payload.json> --execute

Auth:
  PUFFYCALM_ADMIN_TOKEN=<bearer token>
  or PUFFYCALM_GOOGLE_ID_TOKEN=<google id token>
  or PUFFYCALM_ADMIN_EMAIL + PUFFYCALM_ADMIN_PASSWORD

Options:
  --api <url>              API base URL
  --report <path>          JSON report path
  --update-existing        PATCH existing SKUs instead of skipping them
  --delay-ms <number>      Delay between products, default 250
  --retries <number>       Transient retry count, default 3
`);
}

function sleep(ms) {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}

async function readJsonResponse(res) {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function apiUrl(apiBase, path) {
  return `${apiBase}${path.startsWith("/") ? path : `/${path}`}`;
}

async function apiFetch(apiBase, path, options = {}, retries = 0) {
  let attempt = 0;
  while (true) {
    const res = await fetch(apiUrl(apiBase, path), options);
    const data = await readJsonResponse(res);
    if (res.ok || !TRANSIENT_STATUSES.has(res.status) || attempt >= retries) {
      return { res, data, attempts: attempt + 1 };
    }
    const retryAfter = Number(res.headers.get("retry-after"));
    const backoffMs = Number.isFinite(retryAfter)
      ? retryAfter * 1000
      : 500 * 2 ** attempt;
    await sleep(backoffMs);
    attempt += 1;
  }
}

async function authenticate(apiBase) {
  const bearer = process.env.PUFFYCALM_ADMIN_TOKEN?.trim();
  if (bearer) return bearer;

  const googleIdToken = process.env.PUFFYCALM_GOOGLE_ID_TOKEN?.trim();
  if (googleIdToken) {
    const { res, data } = await apiFetch(
      apiBase,
      "/api/v1/auth/google-exchange",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken: googleIdToken }),
      },
      2,
    );
    if (!res.ok || !data.accessToken) {
      throw new Error(`Google exchange failed (${res.status}): ${JSON.stringify(data)}`);
    }
    return data.accessToken;
  }

  const email = process.env.PUFFYCALM_ADMIN_EMAIL?.trim();
  const password = process.env.PUFFYCALM_ADMIN_PASSWORD?.trim();
  if (email && password) {
    const { res, data } = await apiFetch(
      apiBase,
      "/api/v1/auth/login",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      },
      2,
    );
    if (!res.ok || !data.accessToken) {
      throw new Error(`Admin login failed (${res.status}): ${JSON.stringify(data)}`);
    }
    return data.accessToken;
  }

  throw new Error(
    "Missing auth. Set PUFFYCALM_ADMIN_TOKEN, PUFFYCALM_GOOGLE_ID_TOKEN, or admin email/password.",
  );
}

function productRows(payloadFile) {
  const products = payloadFile.products || [];
  return products.map((row) => ({
    source: row.source || {},
    payload: row.payload || row,
  }));
}

function assertNoImages(rows) {
  const bad = rows
    .filter(({ payload }) => {
      const images = Array.isArray(payload.images) ? payload.images : [];
      return Boolean(payload.imageUrl) || images.length > 0;
    })
    .map(({ payload }) => payload.id || payload.slug);
  if (bad.length > 0) {
    throw new Error(`Payload contains images for: ${bad.join(", ")}`);
  }
}

function validatePayload(payload) {
  const errors = [];
  if (!payload.id) errors.push("id missing");
  if (!payload.slug) errors.push("slug missing");
  if (!payload.name) errors.push("name missing");
  if (!Number.isFinite(payload.price) || payload.price <= 0) {
    errors.push("price invalid");
  }
  if (payload.imageUrl !== "") errors.push("imageUrl must be empty");
  if (!Array.isArray(payload.images) || payload.images.length !== 0) {
    errors.push("images must be []");
  }
  if (!Array.isArray(payload.categorySlugs) || payload.categorySlugs.length < 1) {
    errors.push("categorySlugs missing");
  }
  return errors;
}

async function getExistingProduct(apiBase, token, productId, retries) {
  const { res, data } = await apiFetch(
    apiBase,
    `/api/v1/admin/products/${encodeURIComponent(productId)}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
    retries,
  );
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`GET existing ${productId} failed (${res.status}): ${JSON.stringify(data)}`);
  }
  return data;
}

async function createProduct(apiBase, token, payload, retries) {
  return apiFetch(
    apiBase,
    "/api/v1/admin/products",
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
    retries,
  );
}

async function updateProduct(apiBase, token, payload, retries) {
  const { id, ...patch } = payload;
  return apiFetch(
    apiBase,
    `/api/v1/admin/products/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(patch),
    },
    retries,
  );
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const raw = JSON.parse(await readFile(args.payload, "utf8"));
  const rows = productRows(raw);
  assertNoImages(rows);

  const invalid = rows
    .map(({ payload }) => ({ id: payload.id, errors: validatePayload(payload) }))
    .filter((row) => row.errors.length > 0);
  if (invalid.length > 0) {
    throw new Error(`Invalid payloads: ${JSON.stringify(invalid, null, 2)}`);
  }

  const token = await authenticate(args.apiBase);
  const me = await apiFetch(
    args.apiBase,
    "/api/v1/auth/me",
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
    args.retries,
  );
  if (!me.res.ok) {
    throw new Error(`Auth check failed (${me.res.status}): ${JSON.stringify(me.data)}`);
  }
  if (!["admin", "staff"].includes(me.data.role)) {
    throw new Error(`Authenticated user is not admin/staff: ${me.data.role}`);
  }

  const startedAt = new Date().toISOString();
  const results = [];
  console.log(
    `${args.execute ? "EXECUTE" : "DRY-RUN"} ${rows.length} products from ${basename(args.payload)} as ${me.data.email}`,
  );

  for (const [index, row] of rows.entries()) {
    const payload = row.payload;
    const prefix = `[${index + 1}/${rows.length}] ${payload.id}`;
    try {
      const existing = await getExistingProduct(args.apiBase, token, payload.id, args.retries);
      if (existing && !args.updateExisting) {
        console.log(`${prefix} skip existing`);
        results.push({
          id: payload.id,
          slug: payload.slug,
          status: "skipped_existing",
          httpStatus: 200,
          imageUrl: existing.imageUrl || "",
          imagesCount: Array.isArray(existing.images) ? existing.images.length : 0,
        });
        await sleep(args.delayMs);
        continue;
      }

      if (!args.execute) {
        console.log(`${prefix} dry-run ${existing ? "would patch" : "would create"}`);
        results.push({
          id: payload.id,
          slug: payload.slug,
          status: existing ? "dry_run_update" : "dry_run_create",
        });
        await sleep(args.delayMs);
        continue;
      }

      const op = existing && args.updateExisting ? updateProduct : createProduct;
      const { res, data, attempts } = await op(args.apiBase, token, payload, args.retries);
      if (!res.ok) {
        console.log(`${prefix} failed ${res.status}`);
        results.push({
          id: payload.id,
          slug: payload.slug,
          status: "failed",
          httpStatus: res.status,
          attempts,
          error: data,
        });
      } else {
        console.log(`${prefix} ${existing ? "updated" : "created"} ${res.status}`);
        results.push({
          id: data.id || payload.id,
          slug: data.slug || payload.slug,
          status: existing ? "updated" : "created",
          httpStatus: res.status,
          attempts,
          productStatus: data.status,
          imageUrl: data.imageUrl || "",
          imagesCount: Array.isArray(data.images) ? data.images.length : 0,
        });
      }
    } catch (error) {
      console.log(`${prefix} exception`);
      results.push({
        id: payload.id,
        slug: payload.slug,
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
      });
    }
    await sleep(args.delayMs);
  }

  const summary = {
    startedAt,
    finishedAt: new Date().toISOString(),
    apiBase: args.apiBase,
    payloadFile: args.payload,
    execute: args.execute,
    updateExisting: args.updateExisting,
    totals: {
      processed: results.length,
      created: results.filter((r) => r.status === "created").length,
      updated: results.filter((r) => r.status === "updated").length,
      skippedExisting: results.filter((r) => r.status === "skipped_existing").length,
      failed: results.filter((r) => r.status === "failed").length,
      withImages: results.filter((r) => r.imageUrl || r.imagesCount > 0).length,
    },
    results,
  };
  await writeFile(args.report, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  console.log(`Report: ${args.report}`);
  console.log(JSON.stringify(summary.totals, null, 2));
  if (summary.totals.failed > 0 || summary.totals.withImages > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

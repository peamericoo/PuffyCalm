#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";

const DEFAULT_API_BASE = "https://api-production-4f01.up.railway.app";
const TRANSIENT_STATUSES = new Set([408, 429, 500, 502, 503, 504]);
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function parseArgs(argv) {
  const args = {
    apiBase: process.env.PUFFYCALM_API_BASE || DEFAULT_API_BASE,
    payload: process.env.PUFFYCALM_PAYLOAD_FILE || "",
    report: process.env.PUFFYCALM_IMAGE_REPORT || "",
    execute: false,
    publish: false,
    delayMs: 400,
    retries: 3,
    downloadTimeoutMs: 15000,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--execute") args.execute = true;
    else if (arg === "--publish") args.publish = true;
    else if (arg === "--payload") args.payload = argv[++i] || "";
    else if (arg === "--report") args.report = argv[++i] || "";
    else if (arg === "--api") args.apiBase = argv[++i] || args.apiBase;
    else if (arg === "--delay-ms") args.delayMs = Number(argv[++i] || args.delayMs);
    else if (arg === "--retries") args.retries = Number(argv[++i] || args.retries);
    else if (arg === "--download-timeout-ms") {
      args.downloadTimeoutMs = Number(argv[++i] || args.downloadTimeoutMs);
    }
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
        `puffycalm-image-publish-report-${new Date().toISOString().replace(/[:.]/g, "-")}.json`,
      );
  return args;
}

function printHelp() {
  console.log(`Usage:
  node scripts/upload-product-images-and-publish.mjs --payload <payload.json> --execute --publish

Auth:
  PUFFYCALM_ADMIN_TOKEN=<bearer token>
  or PUFFYCALM_GOOGLE_ID_TOKEN=<google id token>
  or PUFFYCALM_ADMIN_EMAIL + PUFFYCALM_ADMIN_PASSWORD

Behavior:
  - Downloads source photoReferenceOnly from the payload file.
  - Uploads it through POST /api/v1/admin/media.
  - Links it to productId and sets it as cover.
  - Optionally publishes each product with --publish.
  - Skips products that already have a cover image.
`);
}

function sleep(ms) {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}

function apiUrl(apiBase, path) {
  return `${apiBase}${path.startsWith("/") ? path : `/${path}`}`;
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
      : 750 * 2 ** attempt;
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

function extensionForType(contentType, fallbackUrl) {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("gif")) return "gif";
  if (contentType.includes("jpeg") || contentType.includes("jpg")) return "jpg";
  const clean = fallbackUrl.split("?")[0].toLowerCase();
  if (clean.endsWith(".png")) return "png";
  if (clean.endsWith(".webp")) return "webp";
  if (clean.endsWith(".gif")) return "gif";
  return "jpg";
}

async function downloadImage(url, retries, timeoutMs) {
  let attempt = 0;
  while (true) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        headers: {
          Accept: "image/webp,image/jpeg,image/png,image/gif,*/*;q=0.5",
          "User-Agent": "PuffyCalmAdminLaunch/1.0",
        },
        signal: controller.signal,
      });
      const contentType = (res.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
      if (res.ok && ALLOWED_IMAGE_TYPES.has(contentType)) {
        const buffer = Buffer.from(await res.arrayBuffer());
        if (buffer.length < 128) throw new Error(`Downloaded image too small: ${url}`);
        return { buffer, contentType };
      }
      if (!TRANSIENT_STATUSES.has(res.status) || attempt >= retries) {
        throw new Error(`Image download failed (${res.status}, ${contentType || "no content-type"}): ${url}`);
      }
    } catch (error) {
      if (attempt >= retries) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Image download failed after ${attempt + 1} attempt(s): ${url} (${message})`);
      }
    } finally {
      clearTimeout(timeout);
    }
    await sleep(750 * 2 ** attempt);
    attempt += 1;
  }
}

function hasProductImage(product) {
  return Boolean(product.imageUrl) || (Array.isArray(product.images) && product.images.length > 0);
}

async function getProduct(apiBase, token, productId, retries) {
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
  if (!res.ok) {
    throw new Error(`Product ${productId} not found/readable (${res.status}): ${JSON.stringify(data)}`);
  }
  return data;
}

async function uploadMedia(apiBase, token, productId, sourceUrl, image, retries) {
  const ext = extensionForType(image.contentType, sourceUrl);
  const file = new File([image.buffer], `${productId}.${ext}`, {
    type: image.contentType,
  });
  const form = new FormData();
  form.set("file", file);
  form.set("productId", productId);
  form.set("setCover", "true");

  return apiFetch(
    apiBase,
    "/api/v1/admin/media",
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: form,
    },
    retries,
  );
}

async function publishProduct(apiBase, token, productId, retries) {
  return apiFetch(
    apiBase,
    `/api/v1/admin/products/${encodeURIComponent(productId)}/publish`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
    retries,
  );
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const raw = JSON.parse(await readFile(args.payload, "utf8"));
  const rows = productRows(raw);
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
  if (!me.res.ok || !["admin", "staff"].includes(me.data.role)) {
    throw new Error(`Auth check failed (${me.res.status}): ${JSON.stringify(me.data)}`);
  }

  const startedAt = new Date().toISOString();
  const results = [];
  console.log(
    `${args.execute ? "EXECUTE" : "DRY-RUN"} images${args.publish ? " + publish" : ""} for ${rows.length} products from ${basename(args.payload)} as ${me.data.email}`,
  );

  for (const [index, row] of rows.entries()) {
    const payload = row.payload;
    const sourceUrl = String(row.source.photoReferenceOnly || "").trim();
    const prefix = `[${index + 1}/${rows.length}] ${payload.id}`;
    try {
      if (!sourceUrl) {
        throw new Error("Missing source photo URL");
      }
      const before = await getProduct(args.apiBase, token, payload.id, args.retries);
      if (hasProductImage(before)) {
        let publish = null;
        if (args.execute && args.publish && before.status !== "published") {
          publish = await publishProduct(args.apiBase, token, payload.id, args.retries);
          if (!publish.res.ok) {
            results.push({
              id: payload.id,
              slug: payload.slug,
              status: "failed",
              step: "publish_existing_image",
              httpStatus: publish.res.status,
              error: publish.data,
              sourceUrl,
            });
            console.log(`${prefix} existing image publish failed ${publish.res.status}`);
            await sleep(args.delayMs);
            continue;
          }
        }
        const after = publish?.data || before;
        console.log(`${prefix} skipped existing image${publish ? " + published" : ""}`);
        results.push({
          id: payload.id,
          slug: after.slug || payload.slug,
          status: publish ? "skipped_existing_image_published" : "skipped_existing_image",
          productStatus: after.status,
          imageUrl: after.imageUrl || "",
          imagesCount: Array.isArray(after.images) ? after.images.length : null,
          sourceUrl,
        });
        await sleep(args.delayMs);
        continue;
      }
      if (!args.execute) {
        console.log(`${prefix} dry-run would upload image${args.publish ? " and publish" : ""}`);
        results.push({
          id: payload.id,
          slug: payload.slug,
          status: "dry_run",
          beforeStatus: before.status,
          beforeImageUrl: before.imageUrl || "",
          sourceUrl,
        });
        await sleep(args.delayMs);
        continue;
      }

      const image = await downloadImage(sourceUrl, args.retries, args.downloadTimeoutMs);
      const uploaded = await uploadMedia(args.apiBase, token, payload.id, sourceUrl, image, args.retries);
      if (!uploaded.res.ok) {
        results.push({
          id: payload.id,
          slug: payload.slug,
          status: "failed",
          step: "upload",
          httpStatus: uploaded.res.status,
          error: uploaded.data,
          sourceUrl,
        });
        console.log(`${prefix} upload failed ${uploaded.res.status}`);
        await sleep(args.delayMs);
        continue;
      }

      let publish = null;
      if (args.publish) {
        publish = await publishProduct(args.apiBase, token, payload.id, args.retries);
        if (!publish.res.ok) {
          results.push({
            id: payload.id,
            slug: payload.slug,
            status: "failed",
            step: "publish",
            httpStatus: publish.res.status,
            error: publish.data,
            uploadedUrl: uploaded.data.url || "",
            sourceUrl,
          });
          console.log(`${prefix} publish failed ${publish.res.status}`);
          await sleep(args.delayMs);
          continue;
        }
      }

      const after = publish?.data || (await getProduct(args.apiBase, token, payload.id, args.retries));
      console.log(`${prefix} image uploaded${args.publish ? " + published" : ""}`);
      results.push({
        id: payload.id,
        slug: after.slug || payload.slug,
        status: args.publish ? "uploaded_published" : "uploaded",
        productStatus: after.status,
        uploadedUrl: uploaded.data.url || "",
        imageUrl: after.imageUrl || "",
        imagesCount: Array.isArray(after.images) ? after.images.length : null,
        contentType: uploaded.data.contentType || image.contentType,
        sizeBytes: uploaded.data.sizeBytes || image.buffer.length,
        sourceUrl,
      });
    } catch (error) {
      console.log(`${prefix} exception`);
      results.push({
        id: payload.id,
        slug: payload.slug,
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
        sourceUrl,
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
    publish: args.publish,
    totals: {
      processed: results.length,
      uploaded: results.filter((r) => r.status === "uploaded" || r.status === "uploaded_published").length,
      reusedExistingImage: results.filter(
        (r) => r.status === "skipped_existing_image" || r.status === "skipped_existing_image_published",
      ).length,
      published: results.filter(
        (r) => r.status === "uploaded_published" || r.status === "skipped_existing_image_published",
      ).length,
      failed: results.filter((r) => r.status === "failed").length,
      missingFinalImage: args.execute
        ? results.filter((r) => r.status !== "failed" && !r.imageUrl).length
        : 0,
    },
    results,
  };
  await writeFile(args.report, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  console.log(`Report: ${args.report}`);
  console.log(JSON.stringify(summary.totals, null, 2));
  if (summary.totals.failed > 0 || summary.totals.missingFinalImage > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

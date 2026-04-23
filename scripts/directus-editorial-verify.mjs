/**
 * Verifies Directus editorial collections are registered and readable with admin credentials.
 * Requires a running Directus (e.g. `pnpm dev:infra`) and Prisma migrations applied so tables exist.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const REQUIRED_ITEM_COLLECTIONS = [
  "categories",
  "collections",
  "content_items",
  "content_item_collection_links",
  "content_item_media_asset_links",
  "media_assets"
];

function loadEnvFile() {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env"), "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (trimmed.length === 0 || trimmed.startsWith("#")) {
        continue;
      }
      const eq = trimmed.indexOf("=");
      if (eq === -1) {
        continue;
      }
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  } catch {
    // optional .env
  }
}

async function login(baseUrl, email, password) {
  const response = await fetch(new URL("/auth/login", baseUrl).toString(), {
    body: JSON.stringify({ email, password }),
    headers: { "content-type": "application/json" },
    method: "POST"
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Directus login failed (HTTP ${response.status}): ${text.slice(0, 400)}`
    );
  }

  const payload = await response.json();

  if (
    typeof payload !== "object" ||
    payload === null ||
    !("data" in payload) ||
    typeof payload.data !== "object" ||
    payload.data === null ||
    !("access_token" in payload.data) ||
    typeof payload.data.access_token !== "string"
  ) {
    throw new Error("Directus login response did not include access_token.");
  }

  return payload.data.access_token;
}

async function fetchItems(collection, baseUrl, token) {
  const url = new URL(`/items/${collection}`, baseUrl);
  url.searchParams.set("limit", "1");

  const response = await fetch(url.toString(), {
    headers: {
      accept: "application/json",
      authorization: `Bearer ${token}`
    }
  });

  return response;
}

async function main() {
  loadEnvFile();

  const baseUrlRaw =
    process.env.DIRECTUS_URL ??
    process.env.CMS_PUBLIC_URL ??
    "http://localhost:8055";
  const baseUrl = baseUrlRaw.endsWith("/")
    ? baseUrlRaw.slice(0, -1)
    : baseUrlRaw;

  const email =
    process.env.DIRECTUS_ADMIN_EMAIL ?? "admin@homeflix.local";
  const password =
    process.env.DIRECTUS_ADMIN_PASSWORD ?? "homeflix-admin-password";

  const health = await fetch(new URL("/server/health", baseUrl).toString(), {
    headers: { accept: "application/json" }
  });

  if (!health.ok) {
    console.error(
      `Directus health check failed (HTTP ${health.status}). Is Docker up? See docs/phase-4-backoffice.md`
    );
    process.exit(2);
  }

  const token = await login(baseUrl, email, password);
  const failures = [];

  for (const collection of REQUIRED_ITEM_COLLECTIONS) {
    const response = await fetchItems(collection, baseUrl, token);

    if (!response.ok) {
      failures.push(
        `${collection}: HTTP ${response.status} ${(await response.text()).slice(0, 200)}`
      );
    }
  }

  if (failures.length > 0) {
    console.error(
      "Directus editorial collections are not fully operable yet. Typical fix: import tables in Studio (apps/cms/bootstrap/IMPORT-RUNBOOK.md) or apply a schema snapshot.\n"
    );
    for (const line of failures) {
      console.error(` - ${line}`);
    }
    process.exit(1);
  }

  console.log("Directus editorial verify passed.");
  console.log(` - baseUrl: ${baseUrl}`);
  console.log(` - collections checked: ${REQUIRED_ITEM_COLLECTIONS.join(", ")}`);
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(2);
});

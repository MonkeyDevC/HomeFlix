/**
 * Smoke mínimo: liveness, readiness y status de la API (sin autenticación de catálogo).
 * Uso: node scripts/smoke-operations.mjs [baseUrl]
 *    o HOMEFLIX_SMOKE_API_BASE_URL=https://api.example.com node scripts/smoke-operations.mjs
 */

const baseRaw =
  process.env.HOMEFLIX_SMOKE_API_BASE_URL ??
  process.argv[2] ??
  "http://localhost:4000";

const base = baseRaw.replace(/\/$/, "");

const paths = [
  { name: "liveness", path: "/health" },
  { name: "readiness", path: "/ready" },
  { name: "status", path: "/api/v1/status" }
];

let failed = false;

for (const item of paths) {
  const url = new URL(item.path, base).toString();

  try {
    const response = await fetch(url, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(8000)
    });
    const ok = response.ok;
    console.log(`${item.name}: HTTP ${response.status} ${ok ? "OK" : "FAIL"}`);

    if (!ok) {
      failed = true;
    }
  } catch (error) {
    console.error(
      `${item.name}: ERROR`,
      error instanceof Error ? error.message : error
    );
    failed = true;
  }
}

if (failed) {
  console.error(
    "\nsmoke-operations: uno o más checks fallaron (API caída, readiness 503 o status HTTP error)."
  );
  process.exit(1);
}

console.error("\nsmoke-operations: todos los checks respondieron HTTP 2xx.");

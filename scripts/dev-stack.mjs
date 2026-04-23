/**
 * Arranque unificado: Postgres + Directus (Docker en segundo plano) y luego API + cliente en paralelo.
 *
 * - HOMEFLIX_DEV_STACK_SKIP_DOCKER=1  → no ejecuta Docker (usa contenedores ya levantados).
 * - HOMEFLIX_DEV_STACK_WAIT_TIMEOUT=120  → segundos para `docker compose up --wait` (por defecto 120).
 * - HOMEFLIX_DEV_STACK_NO_PORT_CLEAN=1  → no libera puertos antes de arrancar.
 */

import { spawn, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const composeFile = "docker-compose.dev.yml";

/** No pisa variables ya definidas en el entorno (p. ej. CI). */
function mergeRootDotEnv() {
  const envPath = resolve(root, ".env");

  if (!existsSync(envPath)) {
    return;
  }

  const text = readFileSync(envPath, "utf8");

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (trimmed === "" || trimmed.startsWith("#")) {
      continue;
    }

    const eq = trimmed.indexOf("=");

    if (eq <= 0) {
      continue;
    }

    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

mergeRootDotEnv();

const skipDocker =
  process.env.HOMEFLIX_DEV_STACK_SKIP_DOCKER === "1" ||
  process.env.HOMEFLIX_DEV_STACK_SKIP_DOCKER === "true";

const noPortClean =
  process.env.HOMEFLIX_DEV_STACK_NO_PORT_CLEAN === "1" ||
  process.env.HOMEFLIX_DEV_STACK_NO_PORT_CLEAN === "true";

const waitTimeoutSeconds = Number.parseInt(
  process.env.HOMEFLIX_DEV_STACK_WAIT_TIMEOUT ?? "120",
  10
);

function envPort(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === "") {
    return fallback;
  }

  const n = Number.parseInt(raw, 10);

  return Number.isInteger(n) && n > 0 && n <= 65535 ? n : fallback;
}

/** Host de Directus en docker-compose.dev.yml (mapeo fijo). */
const DIRECTUS_HOST_PORT = 8055;

function stopInfraContainers() {
  if (skipDocker) {
    return;
  }

  console.error(
    "[dev:stack] docker compose stop postgres directus (libera puerto host de Postgres y 8055)…\n"
  );

  spawnSync("docker", ["compose", "-f", composeFile, "stop", "postgres", "directus"], {
    cwd: root,
    shell: process.platform === "win32",
    stdio: "pipe"
  });
}

function killListenersOnPort(port) {
  if (process.platform === "win32") {
    const script = `$ErrorActionPreference = 'SilentlyContinue'
Get-NetTCPConnection -LocalPort ${port} -State Listen |
  Select-Object -ExpandProperty OwningProcess -Unique |
  ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }`;

    spawnSync("powershell", ["-NoProfile", "-NonInteractive", "-Command", script], {
      cwd: root,
      stdio: "pipe"
    });

    return;
  }

  spawnSync(
    "sh",
    [
      "-c",
      `pids=$(lsof -t -iTCP:${port} -sTCP:LISTEN 2>/dev/null || true); if [ -n "$pids" ]; then kill -9 $pids 2>/dev/null || true; fi`
    ],
    { cwd: root, stdio: "pipe" }
  );
}

function cleanDevStackPorts() {
  if (noPortClean) {
    console.error(
      "[dev:stack] HOMEFLIX_DEV_STACK_NO_PORT_CLEAN activado: no se liberan puertos.\n"
    );

    return;
  }

  const postgresPort = envPort("POSTGRES_PORT", 5432);
  const apiPort = envPort("API_PORT", 4000);
  const clientPort = envPort("CLIENT_PORT", 3000);
  const ports = [...new Set([postgresPort, DIRECTUS_HOST_PORT, apiPort, clientPort])].sort(
    (a, b) => a - b
  );

  stopInfraContainers();

  for (const p of ports) {
    console.error(`[dev:stack] Liberando listeners en puerto ${p}…`);
    killListenersOnPort(p);
  }

  console.error("[dev:stack] Limpieza de puertos hecha.\n");
}

function runDockerUp() {
  const args = [
    "compose",
    "-f",
    composeFile,
    "up",
    "-d",
    "--wait",
    "--wait-timeout",
    String(Number.isFinite(waitTimeoutSeconds) ? waitTimeoutSeconds : 120),
    "postgres",
    "directus"
  ];

  const result = spawnSync("docker", args, {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32"
  });

  if (result.error) {
    console.error(result.error);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function runDevApps() {
  const child = spawn("pnpm", ["run", "dev:apps"], {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: process.env
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      process.exit(1);
    }
    process.exit(code ?? 0);
  });

  child.on("error", (err) => {
    console.error(err);
    process.exit(1);
  });

  const forward = (signal) => {
    if (child.pid && !child.killed) {
      child.kill(signal);
    }
  };

  process.on("SIGINT", () => forward("SIGINT"));
  process.on("SIGTERM", () => forward("SIGTERM"));
}

console.error(
  "HomeFlix dev:stack → infra (postgres + directus) y luego API + cliente. Ctrl+C detiene API/cliente; los contenedores siguen arriba (usa pnpm infra:down para bajarlos).\n"
);

cleanDevStackPorts();

if (!skipDocker) {
  runDockerUp();
} else {
  console.error(
    "HOMEFLIX_DEV_STACK_SKIP_DOCKER activado: omitiendo docker compose.\n"
  );
}

runDevApps();

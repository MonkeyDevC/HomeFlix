import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const composeFile = path.join(root, "docker-compose.dev.yml");

const result = spawnSync(
  "docker",
  ["compose", "-f", composeFile, "config"],
  {
    cwd: root,
    encoding: "utf8",
    shell: process.platform === "win32"
  }
);

if (result.status !== 0) {
  if (result.stderr) {
    process.stderr.write(result.stderr);
  }

  if (result.stdout) {
    process.stderr.write(result.stdout);
  }

  console.error(
    "\ncompose-config: `docker compose config` falló. ¿Está Docker instalado y en PATH?"
  );
  process.exit(result.status ?? 1);
}

if (process.env.HOMEFLIX_VERBOSE_COMPOSE === "1" && result.stdout) {
  process.stdout.write(result.stdout);
}

console.error("compose-config: OK (docker compose config válido).");

import { config as loadEnv } from "dotenv";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildApp } from "./app.js";
import { loadApiConfig } from "./env.js";

const here = dirname(fileURLToPath(import.meta.url));
const rootEnv = resolve(here, "..", "..", "..", ".env");
const apiEnv = resolve(here, "..", ".env");

if (existsSync(rootEnv)) {
  loadEnv({ path: rootEnv });
}

if (existsSync(apiEnv)) {
  loadEnv({ path: apiEnv, override: true });
}


const config = loadApiConfig();
const app = await buildApp(config);

await app.listen({
  host: config.host,
  port: config.port
});

const shutdown = async (): Promise<void> => {
  await app.close();
};

process.on("SIGINT", () => {
  void shutdown();
});

process.on("SIGTERM", () => {
  void shutdown();
});

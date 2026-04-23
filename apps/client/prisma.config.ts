import { config as loadEnv } from "dotenv";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "prisma/config";

const here = dirname(fileURLToPath(import.meta.url));
const rootEnv = resolve(here, "..", "..", ".env");
const clientEnv = resolve(here, ".env");

if (existsSync(rootEnv)) {
  loadEnv({ path: rootEnv });
}

if (existsSync(clientEnv)) {
  loadEnv({ path: clientEnv, override: true });
}

const datasourceUrl =
  process.env.DATABASE_URL ??
  "postgresql://homeflix:homeflix_dev_password@localhost:5432/homeflix";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations"
  },
  datasource: {
    url: datasourceUrl
  }
});

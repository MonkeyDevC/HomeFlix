import { existsSync } from "node:fs";
import path from "node:path";
import { config as loadEnv } from "dotenv";

const envCandidates = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "..", "..", ".env")
];

for (const envPath of envCandidates) {
  if (existsSync(envPath)) {
    loadEnv({ path: envPath });
  }
}

/**
 * Variables de entorno leídas en el monolito (servidor).
 * Sin dependencias extra: falla explícito si falta lo crítico.
 */
export function getDatabaseUrlOrThrow(): string {
  const url = process.env.DATABASE_URL;

  if (url === undefined || url.trim() === "") {
    throw new Error("DATABASE_URL no está definida (requerida para Prisma Family V1).");
  }

  return url;
}

/** Secreto HS256 para cookies de sesión Family (mín. 32 caracteres). */
export function getFamilyJwtSecretOrThrow(): string {
  const secret = process.env.FAMILY_JWT_SECRET;

  if (secret === undefined || secret.trim().length < 32) {
    throw new Error(
      "FAMILY_JWT_SECRET debe definirse con al menos 32 caracteres (auth Family V1)."
    );
  }

  return secret.trim();
}

/** Directorio base para assets locales Family V1 (persistidos en disco). */
export function getFamilyStorageRoot(): string {
  const configured = process.env.FAMILY_STORAGE_ROOT;
  if (configured !== undefined && configured.trim() !== "") {
    return configured.trim();
  }
  return "public/storage";
}

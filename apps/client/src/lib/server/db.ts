import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma-family/client";
import { getDatabaseUrlOrThrow } from "./env";

/**
 * Sondas usadas para validar que el cliente Prisma en cach\u00e9 incluye todos los modelos
 * que espera el c\u00f3digo actual. Si alguno de estos delegados falta en el singleton
 * global (t\u00edpicamente tras un `prisma generate` en caliente durante `next dev`),
 * descartamos la instancia obsoleta y creamos una nueva.
 *
 * IMPORTANTE: Cada vez que agregues un modelo NUEVO al schema y el c\u00f3digo comience a
 * usarlo, agr\u00e9galo aqu\u00ed para evitar el cl\u00e1sico error "Cannot read properties of
 * undefined (reading 'findMany')" tras un hot-reload sin reinicio del server.
 */
const REQUIRED_PRISMA_DELEGATES = [
  "user",
  "profile",
  "contentItem",
  "mediaAsset",
  "category",
  "collection",
  "profileContentAccess",
  "watchHistory",
  "profileWatchlistItem"
] as const;

function hasAllDelegates(client: PrismaClient): boolean {
  const record = client as unknown as Record<string, unknown>;
  for (const key of REQUIRED_PRISMA_DELEGATES) {
    if (record[key] === undefined) {
      return false;
    }
  }
  return true;
}

const globalForPrisma = globalThis as unknown as {
  familyPrisma?: PrismaClient;
};

function createFamilyPrisma(): PrismaClient {
  const adapter = new PrismaPg({
    connectionString: getDatabaseUrlOrThrow()
  });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"]
  });
}

/**
 * Cliente Prisma del esquema `family_v1`. Usar solo en servidor (RSC, route handlers, server actions).
 * Prisma 7 requiere adaptador de driver (`@prisma/adapter-pg`), alineado con el API legado del repo.
 */
export function getFamilyPrisma(): PrismaClient {
  const cached = globalForPrisma.familyPrisma;
  if (cached !== undefined && hasAllDelegates(cached)) {
    return cached;
  }

  if (cached !== undefined && !hasAllDelegates(cached)) {
    // Cliente obsoleto tras un `prisma generate` en caliente: descartamos conexiones
    // abiertas antes de sustituir la instancia para no filtrar pooled connections.
    void cached.$disconnect().catch(() => {
      /* noop */
    });
  }

  const fresh = createFamilyPrisma();
  globalForPrisma.familyPrisma = fresh;
  return fresh;
}

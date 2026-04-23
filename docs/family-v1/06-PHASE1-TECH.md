# FASE 1 — base técnica monolítica (realizada)

## Prisma en el monolito

- Esquema PostgreSQL dedicado: **`family_v1`** (no colisiona con tablas `public` del API legado).
- Archivos: `apps/client/prisma/schema.prisma`, `apps/client/prisma.config.ts`, migración inicial en `apps/client/prisma/migrations/`.
- Cliente generado en `apps/client/src/generated/prisma-family/` (gitignored; se regenera con `pnpm db:family:generate` o en `pnpm build` del client).
- Acceso servidor: `getFamilyPrisma()` en `apps/client/src/lib/server/db.ts` (Prisma 7 + `@prisma/adapter-pg` + `DATABASE_URL`).

## Scripts

| Comando (raíz) | Efecto |
|----------------|--------|
| `pnpm db:family:generate` | `prisma generate` en client |
| `pnpm db:family:migrate` | `prisma migrate dev` en client |
| `pnpm db:family:deploy` | `prisma migrate deploy` en client |

Misma variable **`DATABASE_URL`** que el resto del monorepo. El API legado sigue usando `public`; Family usa solo `family_v1`.

## API interna mínima

- `GET /api/family/db-health` — comprueba `SELECT 1` vía Prisma.

## Auth

- `getFamilySession()` devuelve `null` (placeholder). Sesión real: FASE 3+.

## Cliente sin Mux

- Dependencias `@mux/*` eliminadas del cliente.
- Reproductor: `FamilyPlaybackDeferred` (mensaje hasta player local).
- Upload dev: `MediaUploadSurface` stub sin llamadas Mux.

## Dominio (FASE 2)

- Ver `07-PHASE2-DOMAIN.md`: modelo Prisma simplificado, `ProfileContentAccess`, `listPublishedCatalogForProfile`, `GET /api/family/catalog-preview`.

## Próximo (FASE 3+)

- Player local y uploads a disco.
- Retirada progresiva de dependencia del API Fastify en storefront.

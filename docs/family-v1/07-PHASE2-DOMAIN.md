# FASE 2 — dominio simplificado y catálogo por perfil

## Objetivo cumplido

- Modelo Prisma **mínimo** en `family_v1`, alineado a `03-DOMAIN_CONTRACTS.md`.
- **`ProfileContentAccess`** es la única regla de inclusión en catálogo por perfil (junto a `editorial_status = published`).
- **`MediaAsset`** es local: `file_path`, `content_item_id` opcional, `status`, `size_bytes`; **sin** tabla puente ítem↔media ni campos de proveedor externo.
- **`Profile.user_id`** obligatorio; rol de usuario `admin` | `family_viewer` (default `family_viewer`).
- **`ContentItem`**: `thumbnail_path`, `poster_path`, categoría opcional (`category_id`); sin `published_at` (la publicación es el estado editorial).

## Migración

- Carpeta: `apps/client/prisma/migrations/20260420120000_family_phase2_domain/`.
- Aplicar con `pnpm db:family:deploy` (raíz del monorepo).

## Consulta canónica de catálogo

- `listPublishedCatalogForProfile(profileId, viewerRole)` en `apps/client/src/lib/server/catalog/catalog-for-profile.ts`.
- Regla central: `prismaWhereStorefrontVisibleContent` en `content-storefront-visibility.ts` (publicación + `release_scope` + `accessGrants`).

## Escenarios de producto (DB)

| Situación | Visible en catálogo del perfil |
|-----------|----------------------------------|
| Publicado, sin fila `ProfileContentAccess` | No |
| Borrador, con fila de acceso | No |
| Publicado, con fila de acceso | Sí |
| Varios perfiles con distintas filas de acceso | Sí (catálogos distintos) |
| `WatchHistory` por `profile_id` + `content_item_id` | Sí (modelo listo; UI en fases posteriores) |

## Próximo (FASE 3+)

- Auth de sesión y sustitución de `profileId` en query string por contexto seguro.
- CRUD admin y asignación de `ProfileContentAccess`.
- Player y uploads locales.

# FASE 4 — Backoffice admin interno (Family V1)

## Objetivo

Panel **admin** dentro del monolito `apps/client` para gestionar el catálogo editorial **sin Directus**: categorías, colecciones, ítems de contenido, enlaces a colecciones y **ProfileContentAccess** (qué perfiles ven cada ítem).

## Rutas UI

- `/admin` — resumen y contadores.
- `/admin/categories` — listado, crear, editar, eliminar.
- `/admin/collections` — listado, crear, editar, eliminar.
- `/admin/content` — listado con estado editorial, visibilidad y número de perfiles con acceso.
- `/admin/content/new` — alta de ítem (sin uploads).
- `/admin/content/[id]` — ficha: formulario editorial, editor de colecciones, editor de accesos por perfil.

## Rutas API (JSON)

Todas bajo `/api/family/admin/*`, `runtime = nodejs`, guard **`requireAdminApi`** (sesión + rol `admin`).

- `GET|POST /api/family/admin/categories`
- `GET|PATCH|DELETE /api/family/admin/categories/[id]`
- `GET|POST /api/family/admin/collections`
- `GET|PATCH|DELETE /api/family/admin/collections/[id]`
- `GET|POST /api/family/admin/content`
- `GET|PATCH|DELETE /api/family/admin/content/[id]`
- `GET|PUT /api/family/admin/content/[id]/collections` — cuerpo `{ links: [{ collectionId, position }] }`
- `GET|PUT /api/family/admin/content/[id]/profile-access` — cuerpo `{ profileIds: string[] }`
- `GET /api/family/admin/profiles` — listado para el editor de accesos.

Contratos TypeScript: `apps/client/src/lib/family/admin-contracts.ts`.

## Reglas de dominio (recordatorio)

- Solo usuarios con rol **`admin`** entran a `(admin)` y a las APIs admin (doble chequeo: layout + API).
- Un **ContentItem** publicado **sin** filas en `ProfileContentAccess` **no** aparece en el catálogo de ningún perfil.
- **draft** / **archived** no se tratan como visibles en consumo (la lógica de catálogo sigue en capa catálogo; el admin solo edita datos y asignaciones).

## Fuera de alcance en esta fase

Uploads reales, player final, storefront completo, búsqueda avanzada, analytics, CMS enterprise, permisos granulares, bulk edit.

## FASE 5

Subir esta base con uploads locales, reproductor y consumo alineado al catálogo ya gobernado por perfil y accesos explícitos.

# Conectividad oficial — Family V1

Este documento congela la estrategia final de conectividad tras FASE 8 y la mini-fase de limpieza.

## Regla principal

HomeFlix Family V1 es un **monolito Next.js full-stack**. No toda lectura necesita un endpoint HTTP.

## Estrategia oficial

### 1) Lecturas de storefront

Se resuelven **server-side directo** con Prisma y helpers del monolito:

- Home → `getFamilyHomeForProfile`
- Search → `searchFamilyCatalogForProfile`
- Detail → `getContentDetailForActiveProfile`
- Continue Watching → `listContinueWatchingForProfile`
- Resume progress → `getWatchProgressForProfileContent`

No se usan endpoints `/api/family/home`, `/api/family/search`, `/api/family/catalog`, `/api/family/catalog-preview` ni `/api/family/content/[slug]/detail` en el flujo activo.

### 2) Lecturas de admin

Las páginas de admin leen server-side con Prisma desde el monolito:

- listados de categorías, colecciones y contenido
- fichas de edición
- carga inicial de links de colección
- carga inicial de accesos por perfil
- resumen inicial de media

Por eso se eliminaron los `GET` redundantes de `/api/family/admin/*`.

### 3) Mutaciones Family

Se mantienen en `/api/family/*` porque sí aportan valor real:

- `/api/family/auth/login`
- `/api/family/auth/logout`
- `/api/family/auth/me`
- `/api/family/auth/active-profile` (`POST` y `DELETE`)
- `/api/family/history/upsert`
- `/api/family/admin/categories` (`POST`)
- `/api/family/admin/categories/[id]` (`PATCH`, `DELETE`)
- `/api/family/admin/collections` (`POST`)
- `/api/family/admin/collections/[id]` (`PATCH`, `DELETE`)
- `/api/family/admin/content` (`POST`)
- `/api/family/admin/content/[id]` (`PATCH`, `DELETE`)
- `/api/family/admin/content/[id]/collections` (`PUT`)
- `/api/family/admin/content/[id]/profile-access` (`PUT`)
- `/api/family/admin/content/[id]/media/video`
- `/api/family/admin/content/[id]/media/poster`
- `/api/family/admin/content/[id]/media/thumbnail`

### 4) Técnicos mínimos

Solo quedan endpoints técnicos con valor explícito:

- `/api/family/db-health` — chequeo técnico/admin de Prisma ↔ PostgreSQL
- `/api/family/media/[id]` — proxy validado para reproducción local

## Legacy retirado del flujo Family

- No quedan referencias activas a `/api/v1/*` dentro del flujo Family V1.
- Se eliminó la consola `/dev` y los helpers cliente que dependían de Fastify legado.
- Se eliminó el uso de `localStorage` como pseudo-sesión para conectores legacy.

## Principio operativo

Si una página server-side ya puede leer Prisma con un helper claro, **esa es la estrategia preferida**.

Si una interacción requiere cliente, mutación o proxy controlado, **vive en `/api/family/*`**.

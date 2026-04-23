# FASE 4 — Backoffice editorial operable (Directus)

## Objetivo

Que Directus deje de ser solo documentación y pase a ser el **panel editorial real** sobre las tablas ya endurecidas en PostgreSQL (Prisma FASE 3), sin romper la separación editorial / técnico ni el consumo público vía API.

## Estrategia Directus ↔ Prisma ↔ API

| Rol | Responsabilidad |
| --- | --- |
| **Directus (Studio)** | Autoría y CRUD editorial sobre tablas `categories`, `collections`, `content_items`, vínculos y **selección** de `media_assets` existentes para `content_item_media_asset_links`. |
| **PostgreSQL** | Única base física compartida con `apps/api` (misma `DATABASE_URL` que Prisma en local vía Docker). |
| **Prisma / API** | Persistencia y contratos públicos ya existentes; la API **no** duplica el panel editorial. El client sigue leyendo solo la API. |

No hay “dos fuentes de verdad editoriales”: **Directus edita las filas** que la API ya sirve. Hasta que exista un job de sync bidireccional explícito (fuera de FASE 4), **no hay segunda copia del modelo**: es la misma tabla.

## Limitación ambiental (honesta)

En entornos sin **Docker** o sin red hacia `CMS_PUBLIC_URL`, no se puede verificar el runtime completo de Directus. En este repositorio se entrega:

- **Runbook reproducible** (`apps/cms/bootstrap/IMPORT-RUNBOOK.md`)
- **Script de verificación** (`pnpm cms:verify`) que comprueba login y lectura de ítems cuando Directus está arriba
- **Volumen Docker** para aplicar snapshots con la CLI de Directus cuando existan (`apps/cms/snapshot/`)

Si `pnpm cms:verify` falla por red o Docker, el fallo es **esperado** hasta levantar `pnpm dev:infra`.

## Orden operativo recomendado (local)

1. `corepack pnpm infra:check` (Docker + Compose).
2. `corepack pnpm db:migrate` (Prisma crea tablas editoriales y técnicas).
3. `corepack pnpm dev:infra` (Postgres + Directus).
4. Seguir **`apps/cms/bootstrap/IMPORT-RUNBOOK.md`** (importación única desde Studio) **o** aplicar un snapshot generado por el equipo (`apps/cms/snapshot/README.md`).
5. `corepack pnpm cms:verify` — debe listar colecciones editoriales accesibles.
6. Crear categoría, colección, ítem en borrador, publicar, enlazar media técnico según el runbook.
7. `corepack pnpm dev:api` y comprobar `GET /api/v1/content-items` desde el client probe.

## Qué queda fuera de FASE 4

- Storefront Netflix, player, playback firmado, favoritos, analytics, RBAC final de viewers.
- Sync automático avanzado Directus ↔ API distinto de “misma base de datos”.
- Tratar `media_assets` como entidad editorial completa (solo vínculo y lectura operativa).

## Happy path editorial (resumen)

1. Studio Directus → importar tablas según runbook.
2. CRUD `Category` y `Collection`.
3. CRUD `ContentItem` (`editorial_status`: draft / published / archived; `visibility` según dominio).
4. Asociar categoría/colección primaria en `content_items` o vía tablas de enlace según prefieras en Studio.
5. En `content_item_media_asset_links`, vincular un `media_assets` existente con `role` primary (un solo primary por ítem; coherente con API).
6. Publicar (`editorial_status = published`).
7. Ver el ítem en `GET /api/v1/content-items` (API lee las mismas filas).

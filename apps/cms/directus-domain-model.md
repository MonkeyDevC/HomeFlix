# Directus Domain Model Notes

This file maps the FASE 3 domain model to the future Directus editorial schema.

## Editorial Source Of Truth

Directus is the **authoring** source of truth for editorial fields (`content_items`, `categories`, `collections`, links between them). The **served** store for the public API today is **Prisma/PostgreSQL** in `apps/api` until FASE 4 adds a reproducible Directus bootstrap and optional sync jobs. The API must never treat `MediaAsset.legacyPipelineContentItemId` as catalog ownership.

### FASE 4 operability

Studio debe **importar** las tablas físicas ya creadas por Prisma (misma base Docker). El procedimiento ordenado está en `apps/cms/bootstrap/IMPORT-RUNBOOK.md`. Tras importar, `pnpm cms:verify` desde el monorepo comprueba que las colecciones respondan vía API de Directus. Un snapshot versionable puede generarse con la CLI dentro del contenedor (`apps/cms/snapshot/README.md`).

Directus owns editorial content authoring:

- `content_items`
- `categories`
- `collections`
- editorial status
- editorial visibility
- editorial ordering inside collections

The client never reads Directus directly. Public reads go through `apps/api`.

## Target Collections

### content_items

Maps to `ContentItem`.

Fields:

- `id`
- `slug`
- `title`
- `synopsis`
- `type`
- `editorial_status`
- `visibility`
- `primary_category_id`
- `primary_collection_id`
- `primary_media_asset_id` (denormalized mirror of the primary link; must stay aligned with `content_item_media_asset_links` where `role = primary`)
- `published_at`
- `created_at`
- `updated_at`

### categories

Maps to `Category`.

Fields:

- `id`
- `slug`
- `name`
- `description`
- `created_at`
- `updated_at`

### collections

Maps to `Collection`.

Fields:

- `id`
- `slug`
- `name`
- `description`
- `created_at`
- `updated_at`

### content_item_collection_links

Maps to ordered editorial membership.

Fields:

- `id` (UUID, PK — necesario para que Directus introspecte bien la colección)
- `content_item_id`
- `collection_id`
- `position`
- `created_at`

Unicidad lógica del vínculo: par `(content_item_id, collection_id)`.

### content_item_media_asset_links

Maps editorial content to technical assets. The API remains the owner of the technical `MediaAsset` lifecycle.

Fields:

- `id`
- `content_item_id`
- `media_asset_id`
- `role`
- `created_at`

### profiles and watch_history

These exist in the FASE 3 API persistence model so client reads and progress can be validated. Directus may inspect them later, but they are not editorial authoring surfaces in FASE 3.

## FASE 4 Bootstrap Rule

FASE 4 should create Directus collections from this mapping or a controlled schema snapshot. It must not introduce a second editorial model with different naming.

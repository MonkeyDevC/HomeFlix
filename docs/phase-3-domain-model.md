# FASE 3 Domain Model

FASE 3 makes the catalog domain operational without building the final storefront or backoffice.

## Decision

- Directus is the editorial source of truth.
- The API exposes catalog contracts and coordinates public reads.
- Prisma/PostgreSQL stores the minimum model needed for catalog reads, media association and profile progress.
- `ContentItem` and `MediaAsset` remain separate entities.
- `ContentItemMediaAssetLink` is the **only authoritative** relationship between editorial content and technical video assets.
- `MediaAsset.legacyPipelineContentItemId` (DB column `content_item_id`) is a **non-authoritative** upload-time hint from the Phase 2 pipeline.
- `ContentItem.primaryMediaAssetId` is a **denormalized convenience pointer** kept in sync when linking with `role=primary`.

## Source of truth and sync (FASE 3 hardening)

| Layer | Role today |
| --- | --- |
| **Directus** | Intended editorial authoring surface; collections listed in `apps/cms/directus-domain-model.md`. Bootstrap in Studio is **deferred to FASE 4**. |
| **Prisma / PostgreSQL** | Operational persistence backing the public API **right now**. Until a reproducible Directus sync exists, treat Prisma as the **live** projection of the target editorial model, not a competing editorial editor. |
| **API** | Validates reads, orchestrates `ContentItemMediaAssetLink`, owns `WatchHistory`, exposes normalized contracts to the client. |
| **Client** | Reads **only** the API. |

This is **not** “two editorial sources of truth”: Directus is the **authoring** target; Prisma is the **served** store until FASE 4 wires sync.

## API Endpoints

- `GET /api/v1/content-items`
- `GET /api/v1/content-items/:id`
- `POST /api/v1/content-items/:id/media-assets/:mediaAssetId/link`
- `GET /api/v1/categories`
- `GET /api/v1/collections`
- `GET /api/v1/collections/:id/items`
- `GET /api/v1/profiles`
- `GET /api/v1/profiles/:id/watch-history`
- `POST /api/v1/profiles/:id/watch-history`

No full editorial CRUD is implemented in the API. Editorial authoring belongs to Directus.

### Collection items response

`GET /api/v1/collections/:id/items` returns:

- `collection`: summary
- `items[]`: each entry has `position` (nullable editorial weight), `sortIndex` (stable order in the payload), and `contentItem` (full read model including `primaryMedia` resolved from the official primary link).

### Catalog errors (hardening)

Additional semantic codes include `duplicate_primary_media_link`, `invalid_media_link_role`, and generic `validation_error` for other request issues.

## Prisma Model

FASE 3 adds:

- `Category`
- `Collection`
- `ContentItem`
- `ContentItemCollectionLink`
- `ContentItemMediaAssetLink`
- `Profile`
- `WatchHistory`

`MediaAsset` remains the technical table from FASE 2 and is linked from `ContentItemMediaAssetLink`.

PostgreSQL enforces **at most one** `ContentItemMediaAssetLink` row with `role = 'primary'` per `content_item_id` (partial unique index, migration `20260421103000_phase_3_domain_hardening_primary_link`).

## Ownership

| Concern | Owner |
| --- | --- |
| Editorial metadata | Directus |
| `ContentItem.editorialStatus` | Directus |
| Technical media status | Mux, observed and persisted by API |
| `ContentItemMediaAssetLink` | API orchestration in FASE 3, Directus workflow in FASE 4 |
| Watch progress | API |
| Public catalog contract shape | API |
| Public rendering | Client |

## Modeling Choices

`ContentItem.type` supports `movie`, `clip` and `episode`. `episode` is allowed as a content unit, but seasons and series are deferred.

`ContentItemMediaAssetLink.role` supports `primary`, `trailer` and `teaser`. These are enough to express the minimum relationship without adding tracks, variants or renditions prematurely.

`Profile.familySafe` is intentionally simple. Full maturity rating, PINs and RBAC are deferred.

`WatchHistory` stores one row per profile/content item pair. It may reference a `MediaAsset` when known, but progress belongs to the profile and content relationship, not to Mux.

## Directus Mapping

The target Directus collections are:

- `content_items`
- `categories`
- `collections`
- `content_item_collection_links`
- `content_item_media_asset_links`
- `profiles`
- `watch_history`

Directus should administer editorial collections first. FASE 4 will bootstrap these collections and permissions in Directus Studio or a reproducible setup script.

## Deferred

- Final Directus workflow and RBAC.
- Full editorial CRUD surface.
- Storefront rows and recommendation layout.
- Playback and signed playback URLs.
- Search, favorites and analytics.
- Orphan upload cleanup job.

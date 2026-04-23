# Implementation Order

## Completed Foundation

### FASE 0

1. Define tripartite architecture: `apps/client`, `apps/api`, `apps/cms`.
2. Freeze domain naming: `ContentItem`, `MediaAsset`, `Collection`, `Category`, `Profile`.
3. Define base contracts for media pipeline and playback.
4. Document service boundaries and state ownership.

### FASE 1

1. Adopt Fastify for `apps/api`.
2. Adopt Next.js for `apps/client`.
3. Adopt Directus for `apps/cms`.
4. Adopt PostgreSQL for local development.
5. Expose health, status and auth foundation routes.
6. Connect the client to API status.

### FASE 2

1. Adopt Mux as the only video provider for this phase.
2. Add Prisma/PostgreSQL persistence for technical `MediaAsset` records.
3. Implement direct upload URL creation through the API.
4. Keep the video binary path from browser to Mux.
5. Implement signed Mux webhook validation.
6. Centralize ready/failed technical status transitions.
7. Add idempotent webhook processing with stored Mux event ids.
8. Add explicit `uploading` state between upload URL creation and Mux processing.
9. Persist `playbackId` for a future playback phase.
10. Add a technical client upload probe.
11. Document local env, webhook testing and orphan upload cleanup rules.

## Next Phases

### FASE 3

1. Add Prisma/PostgreSQL catalog tables for `ContentItem`, `Category`, `Collection`, `Profile` and `WatchHistory`.
2. Add explicit `ContentItemMediaAssetLink` association.
3. Expose catalog, category, collection, profile and watch-history routes under `/api/v1`.
4. Add a technical catalog probe in the client.
5. Document Directus editorial mapping for FASE 4.

### FASE 4

1. Bootstrap Directus collections from the documented catalog model.
2. Implement the real editorial backoffice workflow in Directus Studio.
3. Add publishing workflow and administrative permissions.
4. Add editorial audit trail.
5. Add cleanup for orphan `uploading` assets that never produce a Mux asset.

### FASE 5

1. Implement playback contract using `PlaybackPolicy`.
2. Decide signed playback token ownership.
3. Add playback status/readiness surfaces without catalog overbuild.
4. Keep media provider integration Mux-only unless a new ADR explicitly changes it.

## Rules

- The client consumes the API, never Directus directly.
- Directus controls `ContentItem.status`.
- Mux controls technical `MediaAsset.status`; the API persists the observed state.
- Video binaries do not pass through Fastify as the primary upload flow.
- Naming changes require an explicit decision update before implementation.

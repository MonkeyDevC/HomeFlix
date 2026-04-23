# HomeFlix API

`apps/api` is the Fastify application backend boundary for HomeFlix.

In FASE 3 it owns:

- Runtime bootstrapping for the Fastify service.
- `GET /health` for infrastructure compatibility.
- Versioned routes under `/api/v1`.
- `GET /api/v1/status` for client technical connectivity.
- `GET /api/v1/auth/foundation` for future auth strategy.
- Mux direct upload intent creation.
- Signed Mux webhook validation.
- Idempotent webhook handling with stored Mux event ids.
- Minimal PostgreSQL persistence for technical `MediaAsset` state.
- Centralized technical state transitions for `uploading`, `processing`, `ready` and `failed`.
- Catalog read contracts for `ContentItem`, `Category` and `Collection`.
- Explicit `ContentItem` to `MediaAsset` linking.
- Profile listing and minimal watch-history upsert/read support.

It does not own binary video transport, editorial UI, storefront rendering, production authentication, final playback, or full editorial CRUD in this phase.

## Commands

```bash
corepack pnpm --filter @homeflix/api dev
corepack pnpm --filter @homeflix/api build
corepack pnpm --filter @homeflix/api start
corepack pnpm --filter @homeflix/api db:generate
corepack pnpm --filter @homeflix/api db:migrate
```

## Local endpoints

- `GET http://localhost:4000/health`
- `GET http://localhost:4000/api/v1`
- `GET http://localhost:4000/api/v1/health`
- `GET http://localhost:4000/api/v1/status`
- `GET http://localhost:4000/api/v1/auth/foundation`
- `POST http://localhost:4000/api/v1/media-assets/uploads`
- `POST http://localhost:4000/api/v1/media-assets/webhooks/mux`
- `GET http://localhost:4000/api/v1/media-assets/:id`
- `GET http://localhost:4000/api/v1/media-assets/:id/status`
- `GET http://localhost:4000/api/v1/content-items`
- `GET http://localhost:4000/api/v1/content-items/:id`
- `POST http://localhost:4000/api/v1/content-items/:id/media-assets/:mediaAssetId/link`
- `GET http://localhost:4000/api/v1/categories`
- `GET http://localhost:4000/api/v1/collections`
- `GET http://localhost:4000/api/v1/collections/:id/items`
- `GET http://localhost:4000/api/v1/profiles`
- `GET http://localhost:4000/api/v1/profiles/:id/watch-history`
- `POST http://localhost:4000/api/v1/profiles/:id/watch-history`

## Environment

```env
DATABASE_URL=postgres://homeflix:homeflix_dev_password@localhost:5432/homeflix
MUX_TOKEN_ID=
MUX_TOKEN_SECRET=
MUX_WEBHOOK_SECRET=
MUX_TEST_UPLOADS=true
API_PUBLIC_URL=http://localhost:4000
CLIENT_ORIGIN=http://localhost:3000
CMS_PUBLIC_URL=http://localhost:8055
```

## Boundary

Video upload binaries must go directly from the browser or future CMS workflow to Mux. The API creates upload intent, persists provider metadata, validates webhooks and exposes technical status.

The API does not own editorial publishing decisions. `ContentItem.status` is controlled by the CMS. `MediaAsset.status` is technical state observed from Mux webhooks.

`MediaAsset.status` uses `uploading` after a direct upload URL is created and before Mux reports `video.upload.asset_created`.

Directus is the editorial source of truth. The API exposes catalog contracts and owns technical orchestration, media associations and watch progress.

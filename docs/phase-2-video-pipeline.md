# FASE 2 Video Pipeline

FASE 2 implements the first real technical video pipeline for HomeFlix.

## Decision

- Video provider: Mux only.
- Upload strategy: direct upload URL created by `apps/api`.
- Binary path: browser to Mux, never through Fastify as the main transport.
- Webhook strategy: Mux webhook into `apps/api`.
- Persistence: minimal `MediaAsset` table in PostgreSQL through Prisma.
- CMS role: Directus remains the editorial workspace and does not own the FASE 2 technical asset writes.

## Runtime Environment

Required for the API:

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

Required for the client:

```env
NEXT_PUBLIC_HOMEFLIX_API_BASE_URL=http://localhost:4000
```

## Endpoints

- `POST /api/v1/media-assets/uploads`
- `POST /api/v1/media-assets/webhooks/mux`
- `GET /api/v1/media-assets/:id`
- `GET /api/v1/media-assets/:id/status`

## Upload Flow

```mermaid
sequenceDiagram
  participant Client as apps/client
  participant API as apps/api
  participant DB as PostgreSQL
  participant Mux as Mux

  Client->>API: POST /api/v1/media-assets/uploads
  API->>DB: create MediaAsset draft
  API->>Mux: create direct upload URL
  Mux-->>API: upload URL and upload id
  API->>DB: mark MediaAsset uploading
  API-->>Client: uploadUrl and mediaAssetId
  Client->>Mux: PUT video binary directly
  Mux-->>API: video.upload.asset_created webhook
  API->>DB: mark MediaAsset processing
  Mux-->>API: signed webhook
  API->>DB: apply ready or failed transition
  Client->>API: GET MediaAsset status
```

## State Ownership

- `ContentItem.status`: controlled by Directus/CMS. It is editorial state.
- `MediaAsset.status`: controlled by Mux events and persisted by the API as observed technical state.
- The API validates, persists and exposes technical state. It does not become the origin of video processing truth.

## Minimal Persistence

`apps/api/prisma/schema.prisma` defines only the technical fields needed in this phase:

- `id`
- `provider`
- `providerAssetId`
- `providerUploadId`
- `providerPlaybackId`
- `playbackId`
- `contentItemId`
- `status`
- `playbackPolicy`
- `sourceFilename`
- `mimeType`
- `durationSeconds`
- `createdAt`
- `updatedAt`
- `readyAt`
- `failedAt`
- `failureReason`
- `lastWebhookEventId`
- `rawWebhookLastEventType`
- `rawWebhookLastEventAt`

No editorial catalog schema is introduced in FASE 2.

## Webhook Validation

The Mux webhook route validates the `mux-signature` header with `MUX_WEBHOOK_SECRET` before parsing or applying supported events.

Webhook events are idempotent. The API stores every claimed Mux event in `media_asset_webhook_events` using the provider event id as a unique key. If the same event arrives again, the transition is not applied again and the response marks it as `idempotentReplay`.

Supported Mux events:

- `video.upload.asset_created`
- `video.asset.ready`
- `video.asset.errored`
- `video.upload.errored`

Unsupported events are acknowledged as accepted but not applied.

## Event Normalization

Mux payloads are normalized through `mapMuxEventToDomain(event)` before state transitions run. Route handlers do not branch directly on Mux event names. The transition service receives domain-shaped events such as `asset-created`, `asset-ready`, `asset-failed` or `unsupported`.

## Uploading State

`uploading` is the explicit technical state after the API creates a Mux Direct Upload URL and before Mux reports that an asset was created from the upload.

State flow:

```text
draft -> uploading -> processing -> ready
draft -> uploading -> processing -> failed
draft -> failed
```

`draft -> failed` is reserved for API-side failures while creating the Mux upload intent.

## Orphan Uploads

An orphan upload is a `MediaAsset` stuck in `uploading` because the API created a Mux upload URL but the user never uploaded a valid video file, or the upload expired before Mux created an asset.

FASE 2 and FASE 3 do not implement cleanup jobs. The FASE 4 cleanup rule should be:

- Find `MediaAsset` rows with `status = uploading` older than the configured direct-upload timeout.
- Verify no provider asset id was attached.
- Transition them to `failed` with a clear `failureReason`, for example `Upload expired before Mux created an asset`.
- Do not change `ContentItem.status` during this cleanup.

## Local Validation Notes

1. Start PostgreSQL: `corepack pnpm dev:db`.
2. Apply the API migration: `corepack pnpm db:migrate`.
3. Configure Mux credentials and webhook secret in the API environment.
4. Start API: `corepack pnpm dev:api`.
5. Start client: `corepack pnpm dev:client`.
6. Use the client "Direct Upload Probe" to select a video and create a direct upload.
7. Expose `POST /api/v1/media-assets/webhooks/mux` to Mux using a local tunnel when testing real webhooks.

Without real Mux credentials, the API intentionally returns `invalid_config` for upload creation.

## Deferred

- Final player and playback tokens.
- Signed playback UX.
- Editorial publishing workflow.
- Directus schema modeling for catalog management.
- Watch history and continue watching.

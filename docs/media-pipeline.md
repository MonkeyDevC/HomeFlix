# Media Pipeline Contract

The HomeFlix media pipeline separates editorial content from technical video assets.

## Direct Upload Contract

```ts
type CreateUploadRequest = {
  contentItemId: string;
  mimeType?: string;
  sourceFilename?: string;
};

type CreateUploadResponse = {
  uploadUrl: string;
  mediaAssetId: string;
  provider: "mux";
  providerUploadId: string;
  status: "uploading";
};
```

FASE 2 implements this contract through Mux Direct Uploads:

- The client asks the API for an upload intent.
- The API creates a minimal `MediaAsset`.
- The API asks Mux for a direct upload URL.
- The client uploads the binary directly to Mux.
- The binary never crosses `apps/api` as the main upload path.

## Webhook Contract

The stable provider-independent contract remains:

```ts
type MediaWebhookEvent = {
  type: "asset.ready" | "asset.failed";
  mediaAssetId: string;
};
```

FASE 2 also supports the Mux wire events needed to map provider state into HomeFlix state:

- `video.upload.asset_created`
- `video.asset.ready`
- `video.asset.errored`
- `video.upload.errored`

The API verifies `mux-signature`, maps supported events in one transition service, persists the observed state, and returns `MediaWebhookAckResponse`.

`MediaWebhookAckResponse` includes `webhookEventId` and can include `idempotentReplay: true` when Mux retries an event that was already claimed.

## Event Normalization

Provider payloads must be normalized before transitions:

```ts
const domainEvent = mapMuxEventToDomain(muxEvent);
```

Route handlers and controllers must not branch directly on Mux event strings. Provider strings are mapped once, then the backend works with domain-shaped events.

## Playback Contract

```ts
type PlaybackRequest = {
  mediaAssetId: string;
  userId: string;
};

type PlaybackResponse = {
  playbackUrl: string;
  policy: "public" | "signed";
};
```

Playback is still deferred. FASE 2 stores provider playback identifiers so a future playback phase can use the existing persistence foundation.

FASE 2 also persists `playbackId` explicitly. With Mux, `playbackId` and `providerPlaybackId` are the same value today, but `playbackId` is the provider-neutral field the playback contract will use later.

## State Ownership

`ContentItem.status` is controlled by Directus/CMS. It is editorial state.

`MediaAsset.status` is controlled by Mux events and observed by the API. It is technical state.

The API can validate, persist and expose state, but it must not invent a second origin of truth for processing.

## Current Scope

Implemented in FASE 2:

- Mux direct upload creation.
- Minimal PostgreSQL persistence for `MediaAsset`.
- Signed Mux webhook validation.
- Webhook idempotency via stored provider event ids.
- Explicit `uploading` state before provider processing starts.
- Ready/failed transitions through one backend service.
- Technical client upload probe.

Deferred:

- Final player.
- Signed playback tokens.
- Catalog UI.
- Editorial publishing workflow.
- Directus schema synchronization.
- Cleanup job for orphan `uploading` assets that never produce a Mux asset.

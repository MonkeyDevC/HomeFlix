# Domain Model

## Entities

### ContentItem

Represents editorial content visible to users.

Base fields:

| Field | Type | Notes |
| --- | --- | --- |
| `id` | `ContentItemId` | Editorial identifier |
| `slug` | `string` | Future content URL |
| `title` | `string` | Visible title |
| `synopsis` | `string | null` | Editorial summary |
| `type` | `ContentItemType` | `movie`, `clip` or `episode` |
| `editorialStatus` | `ContentItemStatus` | Editorial state |
| `visibility` | `PublicationVisibility` | Future publication visibility |
| `primaryMediaAssetId` | `MediaAssetId | null` | Denormalized pointer; must match `ContentItemMediaAssetLink` with `role=primary` when set. The **authoritative** join is always the link row, not this column alone. |
| `primaryCategoryId` | `CategoryId | null` | Optional editorial classification |
| `primaryCollectionId` | `CollectionId | null` | Optional editorial grouping |
| `publishedAt` | `ISODateString | null` | Editorial publication date |

`episode` is included as a content type because HomeFlix may contain serialized family or long-form content, but seasons/series are intentionally not modeled in FASE 3.

### Category

Represents editorial classification for browsing and future filtering.

Base fields:

| Field | Type | Notes |
| --- | --- | --- |
| `id` | `CategoryId` | Category identifier |
| `slug` | `string` | Stable category key |
| `name` | `string` | Editorial name |
| `description` | `string | null` | Optional explanation |

### Collection

Represents an editorial grouping for future storefront curation.

Base fields:

| Field | Type | Notes |
| --- | --- | --- |
| `id` | `CollectionId` | Collection identifier |
| `slug` | `string` | Stable collection key |
| `name` | `string` | Editorial name |
| `description` | `string | null` | Optional explanation |

Membership in a collection is modeled by `ContentItemCollectionLink` with optional `position` for stable storefront ordering (API responses include `position` and a computed `sortIndex`).

### ContentItemMediaAssetLink

Represents the association between editorial content and technical video assets.

Base fields:

| Field | Type | Notes |
| --- | --- | --- |
| `contentItemId` | `ContentItemId` | Editorial side |
| `mediaAssetId` | `MediaAssetId` | Technical side |
| `role` | `primary | trailer | teaser` | Purpose of the technical asset |

`primary`, `trailer` and `teaser` are the only roles in FASE 3. They cover the expected minimum relationship without introducing variants or tracks prematurely.

At most **one** `primary` link may exist per `ContentItem` (enforced in PostgreSQL and in the catalog service transaction).

### Profile

Represents a consumption identity inside the household.

Base fields:

| Field | Type | Notes |
| --- | --- | --- |
| `id` | `ProfileId` | Profile identifier |
| `displayName` | `string` | Visible profile name |
| `avatarKey` | `string | null` | Future avatar selection |
| `familySafe` | `boolean` | Minimal maturity-control flag |

### WatchHistory

Represents progress for a profile against a content item.

Base fields:

| Field | Type | Notes |
| --- | --- | --- |
| `id` | `WatchHistoryId` | Progress identifier |
| `profileId` | `ProfileId` | Profile owner |
| `contentItemId` | `ContentItemId` | Editorial content |
| `mediaAssetId` | `MediaAssetId | null` | Technical asset used when known |
| `progressSeconds` | `number` | Non-negative progress |
| `completedAt` | `ISODateString | null` | Completion timestamp |
| `lastWatchedAt` | `ISODateString` | Last activity timestamp |

### MediaAsset

Represents a technical video asset.

Domain fields:

| Field | Type | Notes |
| --- | --- | --- |
| `id` | `MediaAssetId` | Internal technical identifier |
| `status` | `MediaAssetStatus` | Technical processing state |
| `playbackPolicy` | `PlaybackPolicy` | Playback policy contract |
| `providerAssetId` | `string | null` | Mux asset id in FASE 2 |
| `providerPlaybackId` | `string | null` | Mux playback id when available |
| `playbackId` | `string | null` | Provider-neutral playback id for FASE 3 |
| `durationSeconds` | `number | null` | Technical duration |
| `legacyPipelineContentItemId` | `string | null` | Optional hint from the Phase 2 upload request, stored as `media_assets.content_item_id`. **Not** an authoritative catalog association; use `ContentItemMediaAssetLink` for that. |

FASE 2 persistence adds operational fields such as provider upload id, source filename, MIME type, timestamps, `lastWebhookEventId` and raw last webhook metadata. Those fields support the pipeline but do not merge `MediaAsset` with `ContentItem`.

## Statuses

`ContentItemStatus`:

- `draft`: editorial content is not published.
- `published`: content is visible according to visibility rules.
- `archived`: content is retired without physical deletion.

`PublicationVisibility`:

- `private`: default; not intended for broad household browsing until workflows say otherwise.
- `household`: shared-home consumption intent when editorial rules allow it.
- `public-internal`: optional staging or intranet-style visibility; **not** public-internet distribution.

**How `editorialStatus` and `visibility` combine:** `editorialStatus` decides lifecycle (`draft` → `published` → `archived`). `visibility` constrains who may see a **published** item in future consumption surfaces. A `draft` item is never treated as publicly visible regardless of `visibility`. Technical `MediaAsset.status` is independent of both.

`MediaAssetStatus`:

- `draft`: asset record exists before provider upload is created.
- `uploading`: Mux upload URL exists and the browser may be sending the binary directly to Mux.
- `processing`: Mux has an upload/asset in progress.
- `ready`: Mux reported the asset is ready.
- `failed`: Mux reported upload or processing failure.

## Required Separation

A published `ContentItem` does not imply that a `MediaAsset` is ready. A ready `MediaAsset` does not imply editorial publication.

Publication is editorial. Technical availability is provider-driven processing state.

## PlaybackPolicy

`PlaybackPolicy` remains:

- `public`: future playback without per-user signing.
- `signed`: future playback with a token or authorization decision.

FASE 3 keeps playback policy and provider playback ids as persisted preparation. It does not implement the final player or signed playback tokens.

## Roles

`Role` remains limited to:

- `admin`
- `viewer`

Production auth and RBAC are not implemented in FASE 3.

## State Ownership

`ContentItem.editorialStatus` is controlled by the CMS. The API reads, normalizes unknown legacy strings to `draft` for stable contracts, and must not become a second editorial source of truth.

`MediaAsset.status` is controlled by Mux events. The API verifies Mux webhooks, maps provider events and persists the observed technical state.

`WatchHistory` is controlled by the API because it is consumption state, not editorial state and not provider processing state.

This rule prevents duplicated publication logic and inconsistent state between CMS, API and provider.

Webhook event ids are stored for idempotency. If Mux retries the same webhook event, the API returns without reapplying the transition.

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

The API will own future permission resolution and playback URL creation. The client consumes the API and does not query Directus directly for playback.

import type {
  CategoryId,
  CollectionId,
  ContentItemId,
  ContentItemMediaAssetRole,
  ContentItemStatus,
  ContentItemType,
  MediaAssetId,
  MediaAssetStatus,
  PlaybackPolicy,
  ProfileId,
  PublicationVisibility,
  WatchHistoryId
} from "@homeflix/domain";
import type { ISODateString, Nullable } from "@homeflix/types";
import type { ApiResponse } from "./api-response.js";

export type CatalogErrorCode =
  | "category_not_found"
  | "collection_not_found"
  | "content_item_not_found"
  | "duplicate_primary_media_link"
  | "invalid_media_link_role"
  | "media_asset_not_found"
  | "profile_not_found"
  | "validation_error"
  | "watch_history_not_found"
  /** FASE 6: playback resolution (optional; many cases use `PlaybackDetailPayload.canPlay` instead). */
  | "playback_not_available"
  /** FASE 7 */
  | "unauthorized"
  | "forbidden"
  | "content_not_visible";

/**
 * Why public playback cannot start yet (Mux-ready path only in FASE 6).
 */
export type PlaybackUnavailableReason =
  | "no_primary_media"
  | "media_not_ready"
  | "missing_playback_id"
  | "requires_signed_playback"
  /** FASE 7: faltan MUX_SIGNING_KEY / MUX_PRIVATE_KEY u error al firmar. */
  | "playback_signing_not_configured";

/**
 * Resolved playback for the storefront player (Mux `playback-id`).
 * `canPlay === false` still returns the editorial `contentItem` for UX fallbacks.
 */
export interface PlaybackDetailPayload {
  readonly contentItem: ContentItemReadModel;
  readonly canPlay: boolean;
  /** Public Mux playback id for `@mux/mux-player-react` when `canPlay` is true. */
  readonly muxPlaybackId: string | null;
  /**
   * JWT firmado por la API para `playback-token` cuando `playbackPolicy === "signed"`.
   * Null si es público o no aplica.
   */
  readonly muxPlaybackToken: string | null;
  readonly playbackPolicy: PlaybackPolicy;
  readonly startPositionSeconds: number;
  readonly primaryMediaAssetId: MediaAssetId | null;
  readonly mediaAssetStatus: MediaAssetStatus | null;
  readonly unavailableReason: PlaybackUnavailableReason | null;
}

export type PlaybackDetailResponse = ApiResponse<PlaybackDetailPayload>;

/**
 * In-progress row derived from persisted `WatchHistory` (not localStorage).
 */
export interface ContinueWatchingEntry {
  readonly profileId: ProfileId;
  readonly contentItemId: ContentItemId;
  readonly contentItemSlug: string;
  readonly contentItemTitle: string;
  readonly mediaAssetId: MediaAssetId | null;
  readonly progressSeconds: number;
  readonly durationSeconds: number | null;
  readonly completed: boolean;
  readonly lastWatchedAt: ISODateString;
}

export interface ContinueWatchingPayload {
  readonly profile: ProfileSummary;
  readonly entries: readonly ContinueWatchingEntry[];
}

export type ContinueWatchingResponse = ApiResponse<ContinueWatchingPayload>;

export interface CategorySummary {
  readonly id: CategoryId;
  readonly slug: string;
  readonly name: string;
  readonly description: Nullable<string>;
}

export interface CollectionSummary {
  readonly id: CollectionId;
  readonly slug: string;
  readonly name: string;
  readonly description: Nullable<string>;
}

export interface MediaAssetReadModel {
  readonly id: MediaAssetId;
  readonly status: MediaAssetStatus;
  readonly playbackPolicy: PlaybackPolicy;
  readonly playbackId: Nullable<string>;
  readonly providerPlaybackId: Nullable<string>;
  readonly durationSeconds: Nullable<number>;
}

export interface LinkedMediaAssetSummary {
  readonly role: ContentItemMediaAssetRole;
  readonly mediaAsset: MediaAssetReadModel;
}

export interface ContentItemReadModel {
  readonly id: ContentItemId;
  readonly slug: string;
  readonly title: string;
  readonly synopsis: Nullable<string>;
  readonly type: ContentItemType;
  readonly editorialStatus: ContentItemStatus;
  readonly visibility: PublicationVisibility;
  /**
   * Denormalized pointer kept in sync with the official `primary` link.
   * The authoritative join is always `ContentItemMediaAssetLink` with role `primary`.
   */
  readonly primaryMediaAssetId: Nullable<MediaAssetId>;
  /** Resolved from the official primary link when present; otherwise null. */
  readonly primaryMedia: Nullable<MediaAssetReadModel>;
  readonly primaryCategory: Nullable<CategorySummary>;
  readonly primaryCollection: Nullable<CollectionSummary>;
  readonly publishedAt: Nullable<ISODateString>;
  readonly mediaAssets: readonly LinkedMediaAssetSummary[];
}

export interface ContentItemDetailPayload {
  readonly contentItem: ContentItemReadModel;
}

export interface ProfileSummary {
  readonly id: ProfileId;
  readonly displayName: string;
  readonly avatarKey: Nullable<string>;
  readonly familySafe: boolean;
}

export interface WatchHistoryEntry {
  readonly id: WatchHistoryId;
  readonly profileId: ProfileId;
  readonly contentItemId: ContentItemId;
  readonly mediaAssetId: Nullable<MediaAssetId>;
  readonly progressSeconds: number;
  readonly completedAt: Nullable<ISODateString>;
  readonly lastWatchedAt: ISODateString;
  readonly contentItem: ContentItemReadModel;
}

/**
 * Body for `POST /content-items/:id/media-assets/:mediaAssetId/link`.
 * When `role` is omitted, the API defaults to `primary` (explicit default, not an implicit null).
 */
export interface LinkMediaAssetRequest {
  readonly role?: ContentItemMediaAssetRole;
}

export interface LinkMediaAssetPayload {
  readonly contentItemId: ContentItemId;
  readonly mediaAssetId: MediaAssetId;
  readonly role: ContentItemMediaAssetRole;
}

export interface UpsertWatchHistoryRequest {
  readonly contentItemId: string;
  readonly mediaAssetId?: string;
  readonly progressSeconds: number;
  readonly completedAt?: ISODateString | null;
}

/**
 * One horizontal row in the storefront home: a collection and its published items.
 */
export interface CatalogHomePreviewRow {
  readonly collection: CollectionSummary;
  readonly items: readonly ContentItemReadModel[];
}

/**
 * Aggregated payload for the consumption home (hero + rows).
 * Only includes `editorialStatus === "published"` items in `featured` and row `items`.
 */
export interface CatalogHomePreviewPayload {
  readonly featured: readonly ContentItemReadModel[];
  readonly collections: readonly CollectionSummary[];
  readonly rows: readonly CatalogHomePreviewRow[];
}

export interface CatalogSearchPayload {
  readonly query: string;
  readonly results: readonly ContentItemReadModel[];
}

export type CatalogHomePreviewResponse = ApiResponse<CatalogHomePreviewPayload>;

export type CatalogSearchResponse = ApiResponse<CatalogSearchPayload>;

/**
 * Stable card-facing projection of a catalog item (alias of the public read shape fields).
 */
export type ContentItemCardSummary = Pick<
  ContentItemReadModel,
  | "id"
  | "slug"
  | "title"
  | "synopsis"
  | "type"
  | "editorialStatus"
  | "visibility"
  | "primaryCategory"
  | "primaryCollection"
  | "primaryMedia"
  | "publishedAt"
>;

export type CategoryListResponse = ApiResponse<{
  readonly categories: readonly CategorySummary[];
}>;

export interface CollectionContentItemEntry {
  /** Editorial ordering weight inside the collection when configured. */
  readonly position: number | null;
  /** Stable 0-based order in the response after sorting by `position` then `createdAt`. */
  readonly sortIndex: number;
  readonly contentItem: ContentItemReadModel;
}

export type CollectionItemsResponse = ApiResponse<{
  readonly collection: CollectionSummary;
  readonly items: readonly CollectionContentItemEntry[];
}>;

export type CollectionListResponse = ApiResponse<{
  readonly collections: readonly CollectionSummary[];
}>;

export type ContentItemDetailResponse = ApiResponse<ContentItemDetailPayload>;

export type ContentItemListResponse = ApiResponse<{
  readonly contentItems: readonly ContentItemReadModel[];
}>;

export type LinkMediaAssetResponse = ApiResponse<LinkMediaAssetPayload>;

export type ProfileListResponse = ApiResponse<{
  readonly profiles: readonly ProfileSummary[];
}>;

export type WatchHistoryListResponse = ApiResponse<{
  readonly profile: ProfileSummary;
  readonly watchHistory: readonly WatchHistoryEntry[];
}>;

export type WatchHistoryUpsertResponse = ApiResponse<WatchHistoryEntry>;

import type { ContentItemMediaAssetRole, MediaAssetId } from "@homeflix/domain";
import { canAccessContentItemForConsumption } from "@homeflix/domain";
import type {
  CatalogHomePreviewPayload,
  CatalogHomePreviewRow,
  CatalogSearchPayload,
  CategorySummary,
  CollectionContentItemEntry,
  CollectionSummary,
  ContinueWatchingEntry,
  ContinueWatchingPayload,
  ContentItemReadModel,
  LinkMediaAssetPayload,
  PlaybackDetailPayload,
  UpsertWatchHistoryRequest,
  WatchHistoryEntry
} from "@homeflix/contracts";
import { ApiError } from "../../errors/api-error.js";
import {
  assertAdmin,
  assertContentReadable,
  assertProfileAccessible,
  type CatalogAuthContext
} from "./catalog-authz.js";
import { isPrismaUniqueViolation } from "./catalog-prisma.js";
import { CatalogRepository } from "./catalog.repository.js";
import {
  toCategorySummary,
  toCollectionSummary,
  toContentItemReadModel,
  toProfileSummary,
  toWatchHistoryEntry
} from "./catalog.mapper.js";
import type { MuxPlaybackSigner } from "./mux-playback-signer.js";
import { isUuid } from "./catalog.validation.js";

function isWatchHistoryCompleted(entry: WatchHistoryEntry): boolean {
  if (entry.completedAt !== null) {
    return true;
  }

  const durationSeconds = entry.contentItem.primaryMedia?.durationSeconds;

  if (
    durationSeconds === null ||
    durationSeconds === undefined ||
    durationSeconds <= 0
  ) {
    return false;
  }

  const threshold = Math.max(durationSeconds * 0.97, durationSeconds - 2);
  return entry.progressSeconds >= threshold;
}

function isReadableItem(auth: CatalogAuthContext, item: ContentItemReadModel): boolean {
  return canAccessContentItemForConsumption({
    editorialStatus: item.editorialStatus,
    role: auth.role,
    visibility: item.visibility
  });
}

export class CatalogService {
  constructor(
    private readonly repository?: CatalogRepository,
    private readonly muxSigner: MuxPlaybackSigner | null = null
  ) {}

  async listContentItems(auth: CatalogAuthContext): Promise<ContentItemReadModel[]> {
    const records = await this.getRepository().listContentItems();
    return records
      .map(toContentItemReadModel)
      .filter((item) => isReadableItem(auth, item));
  }

  async getHomePreview(auth: CatalogAuthContext): Promise<CatalogHomePreviewPayload> {
    const collectionRecords = await this.getRepository().listCollections();
    const collections = collectionRecords.map(toCollectionSummary);

    const featuredRecords =
      await this.getRepository().listPublishedContentItems(12);
    const featured = featuredRecords
      .map(toContentItemReadModel)
      .filter((item) => isReadableItem(auth, item));

    const maxCollections = 16;
    const maxItemsPerRow = 20;
    const rows: CatalogHomePreviewRow[] = [];
    const collectionSlice = collectionRecords.slice(0, maxCollections);
    const itemsByCollection =
      await this.getRepository().listCollectionItemsForCollections(
        collectionSlice.map((col) => col.id)
      );

    for (const col of collectionSlice) {
      const linkRows = itemsByCollection.get(col.id) ?? [];
      const items = linkRows
        .map((row) => toContentItemReadModel(row.contentItem))
        .filter((item) => item.editorialStatus === "published")
        .filter((item) => isReadableItem(auth, item))
        .slice(0, maxItemsPerRow);

      if (items.length > 0) {
        rows.push({
          collection: toCollectionSummary(col),
          items
        });
      }
    }

    return {
      collections,
      featured,
      rows
    };
  }

  async searchStorefrontCatalog(
    auth: CatalogAuthContext,
    query: string
  ): Promise<CatalogSearchPayload> {
    const trimmed = query.trim();

    if (trimmed.length === 0) {
      return {
        query: "",
        results: []
      };
    }

    if (trimmed.length > 200) {
      throw new ApiError(
        400,
        "validation_error",
        "Search query must be at most 200 characters.",
        { maxLength: 200 }
      );
    }

    const records = await this.getRepository().searchPublishedContentItems(
      trimmed,
      50
    );

    return {
      query: trimmed,
      results: records
        .map(toContentItemReadModel)
        .filter((item) => isReadableItem(auth, item))
    };
  }

  async getContentItem(
    auth: CatalogAuthContext,
    idOrSlug: string
  ): Promise<ContentItemReadModel> {
    const record = await this.getRepository().findContentItemByIdOrSlug(idOrSlug);

    if (record === null) {
      throw new ApiError(
        404,
        "content_item_not_found",
        "ContentItem was not found.",
        { contentItemId: idOrSlug }
      );
    }

    const item = toContentItemReadModel(record);
    assertContentReadable(auth, item);
    return item;
  }

  async listCategories(auth: CatalogAuthContext): Promise<CategorySummary[]> {
    void auth;
    const records = await this.getRepository().listCategories();
    return records.map(toCategorySummary);
  }

  async listCollections(auth: CatalogAuthContext): Promise<CollectionSummary[]> {
    void auth;
    const records = await this.getRepository().listCollections();
    return records.map(toCollectionSummary);
  }

  async listCollectionItems(
    auth: CatalogAuthContext,
    idOrSlug: string
  ): Promise<{
    readonly collection: CollectionSummary;
    readonly items: readonly CollectionContentItemEntry[];
  }> {
    const collection = await this.getRepository().findCollectionByIdOrSlug(idOrSlug);

    if (collection === null) {
      throw new ApiError(
        404,
        "collection_not_found",
        "Collection was not found.",
        { collectionId: idOrSlug }
      );
    }

    const rows = await this.getRepository().listCollectionItems(collection.id);

    const items: readonly CollectionContentItemEntry[] = rows
      .map((row, sortIndex) => ({
        contentItem: toContentItemReadModel(row.contentItem),
        position: row.position,
        sortIndex
      }))
      .filter((entry) => isReadableItem(auth, entry.contentItem));

    return {
      collection: toCollectionSummary(collection),
      items
    };
  }

  async listProfiles(auth: CatalogAuthContext) {
    const records = await this.getRepository().listProfiles();

    const filtered =
      auth.role === "admin"
        ? records
        : records.filter(
            (profile) =>
              profile.userId !== null && profile.userId === auth.userId
          );

    return filtered.map(toProfileSummary);
  }

  async listWatchHistory(
    auth: CatalogAuthContext,
    profileId: string
  ): Promise<{
    readonly profile: ReturnType<typeof toProfileSummary>;
    readonly watchHistory: WatchHistoryEntry[];
  }> {
    const profile = await this.getRepository().findProfileById(profileId);

    if (profile === null) {
      throw new ApiError(404, "profile_not_found", "Profile was not found.", {
        profileId
      });
    }

    assertProfileAccessible(auth, profile);

    const records = await this.getRepository().listWatchHistory(profile.id);

    const watchHistory = records
      .map(toWatchHistoryEntry)
      .filter((entry) => isReadableItem(auth, entry.contentItem));

    return {
      profile: toProfileSummary(profile),
      watchHistory
    };
  }

  async listContinueWatching(
    auth: CatalogAuthContext,
    profileId: string
  ): Promise<ContinueWatchingPayload> {
    const { profile, watchHistory } = await this.listWatchHistory(auth, profileId);
    const entries: ContinueWatchingEntry[] = [];

    for (const row of watchHistory) {
      if (isWatchHistoryCompleted(row)) {
        continue;
      }

      if (row.progressSeconds < 2) {
        continue;
      }

      entries.push({
        completed: false,
        contentItemId: row.contentItemId,
        contentItemSlug: row.contentItem.slug,
        contentItemTitle: row.contentItem.title,
        durationSeconds: row.contentItem.primaryMedia?.durationSeconds ?? null,
        lastWatchedAt: row.lastWatchedAt,
        mediaAssetId: row.mediaAssetId,
        profileId: row.profileId,
        progressSeconds: row.progressSeconds
      });
    }

    return {
      entries,
      profile
    };
  }

  async getPlaybackDetail(
    auth: CatalogAuthContext,
    contentItemIdOrSlug: string,
    profileId: string | undefined
  ): Promise<PlaybackDetailPayload> {
    const record =
      await this.getRepository().findContentItemByIdOrSlug(contentItemIdOrSlug);

    if (record === null) {
      throw new ApiError(
        404,
        "content_item_not_found",
        "ContentItem was not found.",
        { contentItemId: contentItemIdOrSlug }
      );
    }

    const contentItem = toContentItemReadModel(record);
    assertContentReadable(auth, contentItem);
    const primary = contentItem.primaryMedia;

    if (primary === null) {
      return {
        canPlay: false,
        contentItem,
        mediaAssetStatus: null,
        muxPlaybackId: null,
        muxPlaybackToken: null,
        playbackPolicy: "public",
        primaryMediaAssetId: null,
        startPositionSeconds: 0,
        unavailableReason: "no_primary_media"
      };
    }

    if (primary.status !== "ready") {
      return {
        canPlay: false,
        contentItem,
        mediaAssetStatus: primary.status,
        muxPlaybackId: null,
        muxPlaybackToken: null,
        playbackPolicy: primary.playbackPolicy,
        primaryMediaAssetId: primary.id,
        startPositionSeconds: 0,
        unavailableReason: "media_not_ready"
      };
    }

    const muxPlaybackId = primary.playbackId ?? primary.providerPlaybackId;

    if (muxPlaybackId === null || muxPlaybackId.trim() === "") {
      return {
        canPlay: false,
        contentItem,
        mediaAssetStatus: primary.status,
        muxPlaybackId: null,
        muxPlaybackToken: null,
        playbackPolicy: primary.playbackPolicy,
        primaryMediaAssetId: primary.id,
        startPositionSeconds: 0,
        unavailableReason: "missing_playback_id"
      };
    }

    let startPositionSeconds = 0;

    if (profileId !== undefined) {
      const profile = await this.getRepository().findProfileById(profileId);

      if (profile === null) {
        throw new ApiError(404, "profile_not_found", "Profile was not found.", {
          profileId
        });
      }

      assertProfileAccessible(auth, profile);

      const existing =
        await this.getRepository().findWatchHistoryByProfileAndContentItem(
          profileId,
          contentItem.id
        );

      if (existing !== null) {
        const rawProgress = Math.floor(existing.progressSeconds);
        startPositionSeconds = Math.max(0, rawProgress);

        if (primary.durationSeconds !== null && primary.durationSeconds > 0) {
          const maxStart = Math.max(0, primary.durationSeconds - 2);
          startPositionSeconds = Math.min(startPositionSeconds, maxStart);
        }
      }
    }

    if (primary.playbackPolicy === "signed") {
      if (this.muxSigner === null) {
        return {
          canPlay: false,
          contentItem,
          mediaAssetStatus: primary.status,
          muxPlaybackId,
          muxPlaybackToken: null,
          playbackPolicy: primary.playbackPolicy,
          primaryMediaAssetId: primary.id,
          startPositionSeconds,
          unavailableReason: "playback_signing_not_configured"
        };
      }

      try {
        const muxPlaybackToken = await this.muxSigner.signPlaybackToken(
          muxPlaybackId
        );

        return {
          canPlay: true,
          contentItem,
          mediaAssetStatus: primary.status,
          muxPlaybackId,
          muxPlaybackToken,
          playbackPolicy: primary.playbackPolicy,
          primaryMediaAssetId: primary.id,
          startPositionSeconds,
          unavailableReason: null
        };
      } catch {
        return {
          canPlay: false,
          contentItem,
          mediaAssetStatus: primary.status,
          muxPlaybackId,
          muxPlaybackToken: null,
          playbackPolicy: primary.playbackPolicy,
          primaryMediaAssetId: primary.id,
          startPositionSeconds,
          unavailableReason: "playback_signing_not_configured"
        };
      }
    }

    return {
      canPlay: true,
      contentItem,
      mediaAssetStatus: primary.status,
      muxPlaybackId,
      muxPlaybackToken: null,
      playbackPolicy: primary.playbackPolicy,
      primaryMediaAssetId: primary.id,
      startPositionSeconds,
      unavailableReason: null
    };
  }

  async upsertWatchHistory(
    auth: CatalogAuthContext,
    profileId: string,
    input: UpsertWatchHistoryRequest
  ): Promise<WatchHistoryEntry> {
    const profile = await this.getRepository().findProfileById(profileId);

    if (profile === null) {
      throw new ApiError(404, "profile_not_found", "Profile was not found.", {
        profileId
      });
    }

    assertProfileAccessible(auth, profile);

    const contentItem = await this.getRepository().findContentItemByIdOrSlug(
      input.contentItemId
    );

    if (contentItem === null) {
      throw new ApiError(
        404,
        "content_item_not_found",
        "ContentItem was not found.",
        { contentItemId: input.contentItemId }
      );
    }

    const readModel = toContentItemReadModel(contentItem);
    assertContentReadable(auth, readModel);

    if (input.mediaAssetId !== undefined) {
      if (!isUuid(input.mediaAssetId)) {
        throw new ApiError(
          400,
          "validation_error",
          "mediaAssetId must be a valid UUID when provided.",
          { mediaAssetId: input.mediaAssetId }
        );
      }

      const mediaAsset = await this.getRepository().findMediaAssetById(
        input.mediaAssetId
      );

      if (mediaAsset === null) {
        throw new ApiError(
          404,
          "media_asset_not_found",
          "MediaAsset was not found.",
          { mediaAssetId: input.mediaAssetId }
        );
      }
    }

    const record = await this.getRepository().upsertWatchHistory(profile.id, {
      ...input,
      contentItemId: contentItem.id
    });

    return toWatchHistoryEntry(record);
  }

  async linkMediaAsset(
    auth: CatalogAuthContext,
    input: {
      readonly contentItemIdOrSlug: string;
      readonly mediaAssetId: string;
      readonly role: ContentItemMediaAssetRole;
    }
  ): Promise<LinkMediaAssetPayload> {
    assertAdmin(auth);

    const contentItem = await this.getRepository().findContentItemByIdOrSlug(
      input.contentItemIdOrSlug
    );

    if (contentItem === null) {
      throw new ApiError(
        404,
        "content_item_not_found",
        "ContentItem was not found.",
        { contentItemId: input.contentItemIdOrSlug }
      );
    }

    if (!isUuid(input.mediaAssetId)) {
      throw new ApiError(
        400,
        "validation_error",
        "mediaAssetId must be a valid UUID.",
        { mediaAssetId: input.mediaAssetId }
      );
    }

    try {
      const link = await this.getRepository().linkMediaAsset({
        contentItemId: contentItem.id,
        mediaAssetId: input.mediaAssetId,
        role: input.role
      });

      if (link === null) {
        throw new ApiError(
          404,
          "media_asset_not_found",
          "MediaAsset was not found.",
          {
            contentItemId: input.contentItemIdOrSlug,
            mediaAssetId: input.mediaAssetId
          }
        );
      }

      return {
        contentItemId: link.contentItemId as LinkMediaAssetPayload["contentItemId"],
        mediaAssetId: link.mediaAssetId as MediaAssetId,
        role: link.role
      };
    } catch (error: unknown) {
      if (isPrismaUniqueViolation(error)) {
        if (input.role === "primary") {
          throw new ApiError(
            409,
            "duplicate_primary_media_link",
            "A primary media link already exists for this ContentItem.",
            {
              contentItemId: contentItem.id,
              mediaAssetId: input.mediaAssetId
            }
          );
        }

        throw new ApiError(
          400,
          "validation_error",
          "This media asset is already linked with the same role for this ContentItem.",
          {
            contentItemId: contentItem.id,
            mediaAssetId: input.mediaAssetId,
            role: input.role
          }
        );
      }

      throw error;
    }
  }

  private getRepository(): CatalogRepository {
    if (this.repository === undefined) {
      throw new ApiError(
        503,
        "invalid_config",
        "DATABASE_URL is required for FASE 3 catalog persistence."
      );
    }

    return this.repository;
  }
}

import {
  type CategoryId,
  type CollectionId,
  type ContentItemId,
  type ContentItemMediaAssetRole,
  type ContentItemType,
  type MediaAssetId,
  type MediaAssetStatus,
  normalizeContentItemStatus,
  normalizePublicationVisibility,
  type PlaybackPolicy,
  type ProfileId,
  type PublicationVisibility,
  type WatchHistoryId
} from "@homeflix/domain";
import type {
  CategorySummary,
  CollectionSummary,
  ContentItemReadModel,
  LinkedMediaAssetSummary,
  MediaAssetReadModel,
  ProfileSummary,
  WatchHistoryEntry
} from "@homeflix/contracts";

export interface CatalogCategoryRecord {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly description: string | null;
}

export interface CatalogCollectionRecord {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly description: string | null;
}

export interface CatalogMediaAssetRecord {
  readonly id: string;
  readonly status: string;
  readonly playbackPolicy: string;
  readonly playbackId: string | null;
  readonly providerPlaybackId: string | null;
  readonly durationSeconds: number | null;
}

export interface CatalogMediaAssetLinkRecord {
  readonly role: string;
  readonly mediaAsset: CatalogMediaAssetRecord;
}

export interface CatalogContentItemRecord {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly synopsis: string | null;
  readonly type: string;
  readonly editorialStatus: string;
  readonly visibility: string;
  readonly primaryMediaAssetId: string | null;
  readonly publishedAt: Date | null;
  readonly primaryCategory: CatalogCategoryRecord | null;
  readonly primaryCollection: CatalogCollectionRecord | null;
  readonly mediaAssetLinks: readonly CatalogMediaAssetLinkRecord[];
}

export interface CatalogProfileRecord {
  readonly id: string;
  readonly displayName: string;
  readonly avatarKey: string | null;
  readonly familySafe: boolean;
  readonly userId: string | null;
}

export interface CatalogWatchHistoryRecord {
  readonly id: string;
  readonly profileId: string;
  readonly contentItemId: string;
  readonly mediaAssetId: string | null;
  readonly progressSeconds: number;
  readonly completedAt: Date | null;
  readonly lastWatchedAt: Date;
  readonly contentItem: CatalogContentItemRecord;
}

export function toCategorySummary(
  record: CatalogCategoryRecord
): CategorySummary {
  return {
    description: record.description,
    id: record.id as CategoryId,
    name: record.name,
    slug: record.slug
  };
}

export function toCollectionSummary(
  record: CatalogCollectionRecord
): CollectionSummary {
  return {
    description: record.description,
    id: record.id as CollectionId,
    name: record.name,
    slug: record.slug
  };
}

export function toMediaAssetReadModel(
  record: CatalogMediaAssetRecord
): MediaAssetReadModel {
  return {
    durationSeconds: record.durationSeconds,
    id: record.id as MediaAssetId,
    playbackId: record.playbackId,
    playbackPolicy: record.playbackPolicy as PlaybackPolicy,
    providerPlaybackId: record.providerPlaybackId,
    status: record.status as MediaAssetStatus
  };
}

export function toLinkedMediaAssetSummary(
  record: CatalogMediaAssetLinkRecord
): LinkedMediaAssetSummary {
  return {
    mediaAsset: toMediaAssetReadModel(record.mediaAsset),
    role: record.role as ContentItemMediaAssetRole
  };
}

export function toContentItemReadModel(
  record: CatalogContentItemRecord
): ContentItemReadModel {
  const primaryLink = record.mediaAssetLinks.find((link) => link.role === "primary");
  const primaryMedia =
    primaryLink === undefined ? null : toMediaAssetReadModel(primaryLink.mediaAsset);
  const primaryMediaAssetIdFromLink =
    primaryLink === undefined ? null : (primaryLink.mediaAsset.id as MediaAssetId);
  const primaryMediaAssetId =
    primaryMediaAssetIdFromLink ??
    (record.primaryMediaAssetId === null
      ? null
      : (record.primaryMediaAssetId as MediaAssetId));

  return {
    editorialStatus: normalizeContentItemStatus(record.editorialStatus),
    id: record.id as ContentItemId,
    mediaAssets: record.mediaAssetLinks.map(toLinkedMediaAssetSummary),
    primaryCategory:
      record.primaryCategory === null
        ? null
        : toCategorySummary(record.primaryCategory),
    primaryCollection:
      record.primaryCollection === null
        ? null
        : toCollectionSummary(record.primaryCollection),
    primaryMedia,
    primaryMediaAssetId,
    publishedAt: record.publishedAt?.toISOString() ?? null,
    slug: record.slug,
    synopsis: record.synopsis,
    title: record.title,
    type: record.type as ContentItemType,
    visibility: normalizePublicationVisibility(record.visibility)
  };
}

export function toProfileSummary(record: CatalogProfileRecord): ProfileSummary {
  return {
    avatarKey: record.avatarKey,
    displayName: record.displayName,
    familySafe: record.familySafe,
    id: record.id as ProfileId
  };
}

export function toWatchHistoryEntry(
  record: CatalogWatchHistoryRecord
): WatchHistoryEntry {
  return {
    completedAt: record.completedAt?.toISOString() ?? null,
    contentItem: toContentItemReadModel(record.contentItem),
    contentItemId: record.contentItemId as ContentItemId,
    id: record.id as WatchHistoryId,
    lastWatchedAt: record.lastWatchedAt.toISOString(),
    mediaAssetId:
      record.mediaAssetId === null ? null : (record.mediaAssetId as MediaAssetId),
    profileId: record.profileId as ProfileId,
    progressSeconds: record.progressSeconds
  };
}

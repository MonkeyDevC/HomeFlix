import assert from "node:assert/strict";
import { CatalogService } from "../apps/api/dist/modules/catalog/catalog.service.js";

const category = {
  description: "Family films and home videos.",
  id: "11111111-1111-4111-8111-111111111111",
  name: "Family",
  slug: "family"
};

const collection = {
  description: "Small validation set for the catalog domain.",
  id: "22222222-2222-4222-8222-222222222222",
  name: "Fixture Collection",
  slug: "fixture-collection"
};

const mediaAsset = {
  durationSeconds: 42,
  id: "33333333-3333-4333-8333-333333333333",
  playbackId: "playback_fixture",
  playbackPolicy: "public",
  providerPlaybackId: "playback_fixture",
  status: "ready"
};

const contentItem = {
  editorialStatus: "published",
  id: "44444444-4444-4444-8444-444444444444",
  mediaAssetLinks: [
    {
      mediaAsset,
      role: "primary"
    }
  ],
  primaryCategory: category,
  primaryCollection: collection,
  primaryMediaAssetId: mediaAsset.id,
  publishedAt: new Date("2026-04-20T00:00:00.000Z"),
  slug: "fixture-content",
  synopsis: "A fixture item that proves editorial and technical domains are linked but separate.",
  title: "Fixture Content",
  type: "clip",
  visibility: "household"
};

const contentWithoutMedia = {
  editorialStatus: "draft",
  id: "55555555-5555-4555-8555-555555555555",
  mediaAssetLinks: [],
  primaryCategory: null,
  primaryCollection: null,
  primaryMediaAssetId: null,
  publishedAt: null,
  slug: "fixture-without-media",
  synopsis: null,
  title: "Fixture Without Media",
  type: "movie",
  visibility: "private"
};

const profile = {
  avatarKey: null,
  displayName: "Family Room",
  familySafe: true,
  id: "66666666-6666-4666-8666-666666666666"
};

const watchHistory = new Map();

const repository = {
  async listContentItems() {
    return [contentItem, contentWithoutMedia];
  },

  async findContentItemByIdOrSlug(value) {
    return [contentItem, contentWithoutMedia].find(
      (candidate) => candidate.id === value || candidate.slug === value
    ) ?? null;
  },

  async listCategories() {
    return [category];
  },

  async listCollections() {
    return [collection];
  },

  async findCollectionByIdOrSlug(value) {
    return value === collection.id || value === collection.slug ? collection : null;
  },

  async listCollectionItems(collectionId) {
    return collectionId === collection.id
      ? [{ contentItem, position: 0 }]
      : [];
  },

  async listProfiles() {
    return [profile];
  },

  async findProfileById(id) {
    return id === profile.id ? profile : null;
  },

  async listWatchHistory(profileId) {
    return [...watchHistory.values()].filter((entry) => entry.profileId === profileId);
  },

  async upsertWatchHistory(profileId, input) {
    const foundContentItem = await this.findContentItemByIdOrSlug(input.contentItemId);

    if (foundContentItem === null) {
      return null;
    }

    const id = `${profileId}:${foundContentItem.id}`;
    const record = {
      completedAt: input.completedAt === undefined || input.completedAt === null
        ? null
        : new Date(input.completedAt),
      contentItem: foundContentItem,
      contentItemId: foundContentItem.id,
      id: "77777777-7777-4777-8777-777777777777",
      lastWatchedAt: new Date("2026-04-20T00:10:00.000Z"),
      mediaAssetId: input.mediaAssetId ?? null,
      profileId,
      progressSeconds: input.progressSeconds
    };

    watchHistory.set(id, record);
    return record;
  },

  async findMediaAssetById(id) {
    return id === mediaAsset.id ? { id: mediaAsset.id } : null;
  },

  async linkMediaAsset(input) {
    const foundContentItem =
      [contentItem, contentWithoutMedia].find(
        (candidate) => candidate.id === input.contentItemId
      ) ?? null;

    if (foundContentItem === null || input.mediaAssetId !== mediaAsset.id) {
      return null;
    }

    if (input.role === "primary") {
      foundContentItem.mediaAssetLinks = foundContentItem.mediaAssetLinks.filter(
        (link) => link.role !== "primary"
      );
    }

    foundContentItem.primaryMediaAssetId = mediaAsset.id;
    foundContentItem.mediaAssetLinks = [
      ...foundContentItem.mediaAssetLinks,
      {
        mediaAsset,
        role: input.role
      }
    ];

    return {
      contentItemId: foundContentItem.id,
      mediaAssetId: mediaAsset.id,
      role: input.role
    };
  }
};

const service = new CatalogService(repository);

const contentItems = await service.listContentItems();
assert.equal(contentItems.length, 2);
assert.equal(contentItems[0].editorialStatus, "published");
assert.equal(contentItems[0].mediaAssets[0].mediaAsset.status, "ready");
assert.equal(contentItems[1].mediaAssets.length, 0);

const detail = await service.getContentItem("fixture-content");
assert.equal(detail.id, contentItem.id);
assert.equal(detail.primaryCategory?.slug, "family");
assert.equal(detail.primaryMedia?.status, "ready");
assert.equal(detail.primaryMediaAssetId, mediaAsset.id);

const collections = await service.listCollections();
assert.equal(collections[0].slug, "fixture-collection");

const collectionItems = await service.listCollectionItems("fixture-collection");
assert.equal(collectionItems.collection.id, collection.id);
assert.equal(collectionItems.items.length, 1);
assert.equal(collectionItems.items[0].sortIndex, 0);
assert.equal(collectionItems.items[0].position, 0);
assert.equal(collectionItems.items[0].contentItem.id, contentItem.id);

const profiles = await service.listProfiles();
assert.equal(profiles[0].id, profile.id);

const link = await service.linkMediaAsset({
  contentItemIdOrSlug: "fixture-without-media",
  mediaAssetId: mediaAsset.id,
  role: "primary"
});
assert.equal(link.role, "primary");
assert.equal(link.mediaAssetId, mediaAsset.id);

const progress = await service.upsertWatchHistory(profile.id, {
  contentItemId: contentItem.id,
  mediaAssetId: mediaAsset.id,
  progressSeconds: 120
});
assert.equal(progress.profileId, profile.id);
assert.equal(progress.progressSeconds, 120);
assert.equal(progress.contentItem.id, contentItem.id);

const history = await service.listWatchHistory(profile.id);
assert.equal(history.watchHistory.length, 1);
assert.equal(history.watchHistory[0].contentItemId, contentItem.id);

console.log("Phase 3 catalog fixture passed.");

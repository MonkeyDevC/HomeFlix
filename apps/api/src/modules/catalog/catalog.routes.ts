import type { FastifyInstance } from "fastify";
import type {
  CatalogHomePreviewResponse,
  CatalogSearchResponse,
  CategoryListResponse,
  CollectionItemsResponse,
  CollectionListResponse,
  ContinueWatchingResponse,
  ContentItemDetailResponse,
  ContentItemListResponse,
  LinkMediaAssetResponse,
  PlaybackDetailResponse,
  ProfileListResponse,
  WatchHistoryListResponse,
  WatchHistoryUpsertResponse
} from "@homeflix/contracts";
import type { ApiRuntimeConfig } from "../../env.js";
import { createPrismaClient } from "../../infrastructure/database/prisma-client.js";
import { CatalogRepository } from "./catalog.repository.js";
import { CatalogService } from "./catalog.service.js";
import { createMuxPlaybackSigner } from "./mux-playback-signer.js";
import {
  parseCatalogSearchQuery,
  parseLinkMediaAssetRequest,
  parseOptionalProfileIdFromQuery,
  parseRouteId,
  parseRouteParam,
  parseUpsertWatchHistoryRequest
} from "./catalog.validation.js";

export async function registerCatalogRoutes(
  app: FastifyInstance,
  config: ApiRuntimeConfig
): Promise<void> {
  const prisma =
    config.databaseUrl === undefined
      ? undefined
      : createPrismaClient(config.databaseUrl);
  const repository =
    prisma === undefined ? undefined : new CatalogRepository(prisma);
  const muxSigner = createMuxPlaybackSigner(config);
  const service = new CatalogService(repository, muxSigner);

  if (prisma !== undefined) {
    app.addHook("onClose", async () => {
      await prisma.$disconnect();
    });
  }

  app.get(
    "/catalog/home-preview",
    async (request): Promise<CatalogHomePreviewResponse> => ({
      ok: true,
      data: await service.getHomePreview(request.auth!)
    })
  );

  app.get(
    "/catalog/search",
    async (request): Promise<CatalogSearchResponse> => ({
      ok: true,
      data: await service.searchStorefrontCatalog(
        request.auth!,
        parseCatalogSearchQuery(request.query)
      )
    })
  );

  app.get(
    "/content-items",
    async (request): Promise<ContentItemListResponse> => ({
      ok: true,
      data: {
        contentItems: await service.listContentItems(request.auth!)
      }
    })
  );

  app.get(
    "/content-items/:id/playback",
    async (request): Promise<PlaybackDetailResponse> => ({
      ok: true,
      data: await service.getPlaybackDetail(
        request.auth!,
        parseRouteId(request.params),
        parseOptionalProfileIdFromQuery(request.query)
      )
    })
  );

  app.get(
    "/content-items/:id",
    async (request): Promise<ContentItemDetailResponse> => ({
      ok: true,
      data: {
        contentItem: await service.getContentItem(
          request.auth!,
          parseRouteId(request.params)
        )
      }
    })
  );

  app.post(
    "/content-items/:id/media-assets/:mediaAssetId/link",
    async (request): Promise<LinkMediaAssetResponse> => {
      const body = parseLinkMediaAssetRequest(request.body);

      return {
        ok: true,
        data: await service.linkMediaAsset(request.auth!, {
          contentItemIdOrSlug: parseRouteId(request.params),
          mediaAssetId: parseRouteParam(request.params, "mediaAssetId"),
          role: body.role ?? "primary"
        })
      };
    }
  );

  app.get(
    "/categories",
    async (request): Promise<CategoryListResponse> => ({
      ok: true,
      data: {
        categories: await service.listCategories(request.auth!)
      }
    })
  );

  app.get(
    "/collections",
    async (request): Promise<CollectionListResponse> => ({
      ok: true,
      data: {
        collections: await service.listCollections(request.auth!)
      }
    })
  );

  app.get(
    "/collections/:id/items",
    async (request): Promise<CollectionItemsResponse> => ({
      ok: true,
      data: await service.listCollectionItems(
        request.auth!,
        parseRouteId(request.params)
      )
    })
  );

  app.get(
    "/profiles",
    async (request): Promise<ProfileListResponse> => ({
      ok: true,
      data: {
        profiles: await service.listProfiles(request.auth!)
      }
    })
  );

  app.get(
    "/profiles/:id/continue-watching",
    async (request): Promise<ContinueWatchingResponse> => ({
      ok: true,
      data: await service.listContinueWatching(
        request.auth!,
        parseRouteId(request.params)
      )
    })
  );

  app.get(
    "/profiles/:id/watch-history",
    async (request): Promise<WatchHistoryListResponse> => ({
      ok: true,
      data: await service.listWatchHistory(
        request.auth!,
        parseRouteId(request.params)
      )
    })
  );

  app.post(
    "/profiles/:id/watch-history",
    async (request): Promise<WatchHistoryUpsertResponse> => ({
      ok: true,
      data: await service.upsertWatchHistory(
        request.auth!,
        parseRouteId(request.params),
        parseUpsertWatchHistoryRequest(request.body)
      )
    })
  );
}

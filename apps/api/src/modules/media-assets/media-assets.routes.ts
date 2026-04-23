import type { FastifyInstance } from "fastify";
import type {
  CreateUploadApiResponse,
  MediaAssetSummaryResponse,
  MediaWebhookAckResponse
} from "@homeflix/contracts";
import type { ApiRuntimeConfig } from "../../env.js";
import {
  createAuthenticateConsumer,
  createRequireAdmin
} from "../auth/auth.middleware.js";
import { createPrismaClient } from "../../infrastructure/database/prisma-client.js";
import { MediaAssetRepository } from "./media-asset.repository.js";
import { MediaAssetsService } from "./media-assets.service.js";
import {
  parseCreateUploadRequest,
  parseMediaAssetIdParam
} from "./media-assets.validation.js";

export async function registerMediaAssetRoutes(
  app: FastifyInstance,
  config: ApiRuntimeConfig
): Promise<void> {
  const prisma =
    config.databaseUrl === undefined
      ? undefined
      : createPrismaClient(config.databaseUrl);
  const repository =
    prisma === undefined ? undefined : new MediaAssetRepository(prisma);
  const service = new MediaAssetsService(config, repository);

  if (prisma !== undefined) {
    app.addHook("onClose", async () => {
      await prisma.$disconnect();
    });
  }

  const adminOnly = {
    preHandler: [createAuthenticateConsumer(config), createRequireAdmin()]
  };

  app.post(
    "/media-assets/uploads",
    adminOnly,
    async (request, reply): Promise<CreateUploadApiResponse> => {
      const upload = await service.createUpload(
        parseCreateUploadRequest(request.body)
      );

      reply.code(201);

      return {
        ok: true,
        data: upload
      };
    }
  );

  app.get(
    "/media-assets/:id",
    adminOnly,
    async (request): Promise<MediaAssetSummaryResponse> => ({
      ok: true,
      data: await service.getMediaAsset(parseMediaAssetIdParam(request.params))
    })
  );

  app.get(
    "/media-assets/:id/status",
    adminOnly,
    async (request): Promise<MediaAssetSummaryResponse> => ({
      ok: true,
      data: await service.getMediaAssetStatus(
        parseMediaAssetIdParam(request.params)
      )
    })
  );

  await app.register(async (webhooks) => {
    webhooks.addContentTypeParser(
      "application/json",
      { parseAs: "string" },
      (_request, body, done) => {
        done(null, body);
      }
    );

    webhooks.post(
      "/media-assets/webhooks/mux",
      async (request): Promise<MediaWebhookAckResponse> => ({
        ok: true,
        data: await service.handleMuxWebhook(
          typeof request.body === "string" ? request.body : "",
          headerToString(request.headers["mux-signature"])
        )
      })
    );
  });
}

function headerToString(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

import type { FastifyInstance } from "fastify";
import type { ApiResponse } from "@homeflix/contracts";
import type { ApiRuntimeConfig } from "../env.js";
import { createAuthenticateConsumer } from "../modules/auth/auth.middleware.js";
import { registerAuthRoutes } from "../modules/auth/auth.routes.js";
import { registerCatalogRoutes } from "../modules/catalog/catalog.routes.js";
import { registerHealthRoutes } from "../modules/health/health.routes.js";
import { registerMediaAssetRoutes } from "../modules/media-assets/media-assets.routes.js";
import { sendReadinessReply } from "../modules/readiness/readiness.controller.js";
import { registerStatusRoutes } from "../modules/status/status.routes.js";

export async function registerV1Routes(
  app: FastifyInstance,
  config: ApiRuntimeConfig
): Promise<void> {
  app.get("/ready", async (_request, reply) => {
    await sendReadinessReply(reply, config);
  });

  app.get("/", async (): Promise<ApiResponse<{ readonly version: "v1" }>> => ({
    ok: true,
    data: {
      version: "v1"
    }
  }));

  await registerHealthRoutes(app, config);
  await registerStatusRoutes(app, config);
  await registerAuthRoutes(app, config);
  await registerMediaAssetRoutes(app, config);
  await app.register(async (catalogScope) => {
    catalogScope.addHook("preHandler", createAuthenticateConsumer(config));
    await registerCatalogRoutes(catalogScope, config);
  });
}

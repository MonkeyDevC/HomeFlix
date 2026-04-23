import type { FastifyInstance } from "fastify";
import { getHealthResponse } from "./health.controller.js";
import type { ApiRuntimeConfig } from "../../env.js";

export async function registerHealthRoutes(
  app: FastifyInstance,
  config: ApiRuntimeConfig
): Promise<void> {
  app.get("/health", async () => getHealthResponse(config));
}

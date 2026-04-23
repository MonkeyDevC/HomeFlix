import type { FastifyInstance } from "fastify";
import { getServiceStatusResponse } from "./status.controller.js";
import type { ApiRuntimeConfig } from "../../env.js";

export async function registerStatusRoutes(
  app: FastifyInstance,
  config: ApiRuntimeConfig
): Promise<void> {
  app.get("/status", async () => await getServiceStatusResponse(config));
}

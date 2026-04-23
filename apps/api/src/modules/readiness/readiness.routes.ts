import type { FastifyInstance } from "fastify";
import type { ApiRuntimeConfig } from "../../env.js";
import { sendReadinessReply } from "./readiness.controller.js";

export async function registerReadinessRoutes(
  app: FastifyInstance,
  config: ApiRuntimeConfig
): Promise<void> {
  app.get("/ready", async (_request, reply) => {
    await sendReadinessReply(reply, config);
  });
}

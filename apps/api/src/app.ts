import cors from "@fastify/cors";
import { randomUUID } from "node:crypto";
import Fastify, { type FastifyInstance } from "fastify";
import { loadApiConfig, type ApiRuntimeConfig } from "./env.js";
import { buildApiLoggerOptions } from "./logging/logger-config.js";
import { getHealthResponse } from "./modules/health/health.controller.js";
import { registerReadinessRoutes } from "./modules/readiness/readiness.routes.js";
import { registerErrorHandling } from "./plugins/error-handler.js";
import { registerV1Routes } from "./routes/v1.routes.js";

export async function buildApp(
  config: ApiRuntimeConfig = loadApiConfig()
): Promise<FastifyInstance> {
  const app = Fastify({
    genReqId: () => randomUUID(),
    logger: config.env === "test" ? false : buildApiLoggerOptions(config)
  });

  await app.register(cors, {
    origin: config.clientOrigin
  });

  registerErrorHandling(app);

  app.addHook("onResponse", (request, reply, done) => {
    request.log.info(
      {
        durationMs: reply.elapsedTime,
        event: "http_request_complete",
        method: request.method,
        statusCode: reply.statusCode,
        url: request.url
      },
      "request_complete"
    );
    done();
  });

  app.get("/health", async () => getHealthResponse(config));
  await registerReadinessRoutes(app, config);
  await app.register(async (v1) => registerV1Routes(v1, config), {
    prefix: "/api/v1"
  });

  return app;
}

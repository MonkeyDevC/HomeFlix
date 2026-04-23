import { HOMEFLIX_PHASE } from "@homeflix/config";
import type { ReadinessResponse } from "@homeflix/contracts";
import type { FastifyReply } from "fastify";
import type { ApiRuntimeConfig } from "../../env.js";
import { probePostgres } from "./readiness.service.js";

export async function evaluateReadiness(
  config: ApiRuntimeConfig
): Promise<{ readonly httpStatus: 200 | 503; readonly body: ReadinessResponse }> {
  const timestamp = new Date().toISOString();

  if (config.databaseUrl === undefined) {
    return {
      body: {
        data: {
          apiVersion: "v1",
          checks: [
            {
              name: "postgres",
              note: "DATABASE_URL is not set; catalog and auth persistence are unavailable.",
              status: "skipped"
            }
          ],
          phase: HOMEFLIX_PHASE,
          ready: false,
          service: "homeflix-api",
          timestamp
        },
        ok: true
      },
      httpStatus: 200
    };
  }

  const probe = await probePostgres(config.databaseUrl);

  if (!probe.ok) {
    return {
      body: {
        data: {
          apiVersion: "v1",
          checks: [
            {
              name: "postgres",
              note: probe.note,
              status: "failed"
            }
          ],
          phase: HOMEFLIX_PHASE,
          ready: false,
          service: "homeflix-api",
          timestamp
        },
        ok: true
      },
      httpStatus: 503
    };
  }

  return {
    body: {
      data: {
        apiVersion: "v1",
        checks: [
          {
            name: "postgres",
            note: probe.note,
            status: "ok"
          }
        ],
        phase: HOMEFLIX_PHASE,
        ready: true,
        service: "homeflix-api",
        timestamp
      },
      ok: true
    },
    httpStatus: 200
  };
}

export async function sendReadinessReply(
  reply: FastifyReply,
  config: ApiRuntimeConfig
): Promise<void> {
  const result = await evaluateReadiness(config);
  await reply.code(result.httpStatus).send(result.body);
}

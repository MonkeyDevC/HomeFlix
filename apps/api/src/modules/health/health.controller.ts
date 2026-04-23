import type { HealthCheckResponse } from "@homeflix/contracts";
import { HOMEFLIX_PHASE } from "@homeflix/config";
import type { ApiRuntimeConfig } from "../../env.js";

export function getHealthResponse(config: ApiRuntimeConfig): HealthCheckResponse {
  return {
    ok: true,
    data: {
      apiVersion: "v1",
      environment: config.env,
      phase: HOMEFLIX_PHASE,
      service: "homeflix-api",
      status: "ok",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime())
    }
  };
}

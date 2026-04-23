import type {
  ServiceOperationalStatus,
  ServiceStatusResponse
} from "@homeflix/contracts";
import { HOMEFLIX_PHASE } from "@homeflix/config";
import type { ApiRuntimeConfig } from "../../env.js";
import {
  buildDirectusDependencyNote,
  directusDependencyStatus,
  probeDirectusHealth
} from "./directus-health.js";

export async function getServiceStatusResponse(
  config: ApiRuntimeConfig
): Promise<ServiceStatusResponse> {
  const directusProbe = await probeDirectusHealth(config.cmsPublicUrl);
  const postgresConfigured = config.databaseUrl !== undefined;
  const muxUploadConfigured =
    config.mux.tokenId !== undefined && config.mux.tokenSecret !== undefined;
  const operationalStatus: ServiceOperationalStatus =
    postgresConfigured && muxUploadConfigured ? "ok" : "degraded";

  return {
    ok: true,
    data: {
      apiVersion: "v1",
      dependencies: [
        {
          name: "postgres",
          note:
            config.databaseUrl === undefined
              ? "DATABASE_URL is required for FASE 3 catalog and MediaAsset persistence and is not configured."
              : "DATABASE_URL is configured for FASE 3 catalog and MediaAsset persistence.",
          status: config.databaseUrl === undefined ? "not_configured" : "configured"
        },
        {
          name: "directus",
          note: buildDirectusDependencyNote(directusProbe),
          status: directusDependencyStatus(directusProbe),
          url: config.cmsPublicUrl
        },
        {
          name: "media-provider",
          note:
            config.mux.tokenId === undefined ||
            config.mux.tokenSecret === undefined
              ? "Mux direct upload credentials are required for the FASE 2 media pipeline and are not fully configured."
              : "Mux direct upload credentials are configured. Webhook secret is validated on incoming webhook requests.",
          status:
            config.mux.tokenId === undefined ||
            config.mux.tokenSecret === undefined
              ? "missing_credentials"
              : "configured"
        }
      ],
      environment: config.env,
      phase: HOMEFLIX_PHASE,
      service: "homeflix-api",
      status: operationalStatus
    }
  };
}

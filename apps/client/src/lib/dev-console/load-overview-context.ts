import type {
  ServiceDependency,
  ServiceDependencyStatus,
  ServiceOperationalStatus,
  ServiceStatusPayload
} from "@homeflix/contracts";
import { getClientRuntimeConfig } from "../../config/client-env";
import { fetchApiStatus } from "../api/api-http-client";

export type DevExecutiveState = "OK" | "DEGRADED" | "ERROR" | "BLOCKED";

export type DevOverviewContext =
  | {
      readonly kind: "blocked";
      readonly message: string;
    }
  | {
      readonly kind: "api_error";
      readonly message: string;
      readonly endpoint?: string;
    }
  | {
      readonly kind: "ready";
      readonly executive: DevExecutiveState;
      readonly warnings: number;
      readonly errors: number;
      readonly summary: string;
      readonly payload: ServiceStatusPayload;
    };

function depHealthPercent(status: ServiceDependencyStatus): number {
  switch (status) {
    case "configured":
      return 100;
    case "deferred":
      return 62;
    case "not_configured":
      return 38;
    case "missing_credentials":
      return 18;
    default:
      return 40;
  }
}

export function dependencyVisualScore(dep: ServiceDependency): number {
  return depHealthPercent(dep.status);
}

function countIssues(deps: readonly ServiceDependency[]): {
  readonly warnings: number;
  readonly errors: number;
} {
  let warnings = 0;
  let errors = 0;

  for (const dep of deps) {
    if (dep.status === "missing_credentials") {
      errors += 1;
    } else if (dep.status === "not_configured" || dep.status === "deferred") {
      warnings += 1;
    }
  }

  return { errors, warnings };
}

function deriveExecutive(
  apiStatus: ServiceOperationalStatus,
  deps: readonly ServiceDependency[],
  counts: { readonly warnings: number; readonly errors: number }
): DevExecutiveState {
  if (counts.errors > 0) {
    return "ERROR";
  }

  if (apiStatus === "degraded" || counts.warnings > 0) {
    return "DEGRADED";
  }

  return "OK";
}

export async function loadDevOverviewContext(): Promise<DevOverviewContext> {
  const cfg = getClientRuntimeConfig();

  if (!cfg.ok) {
    return { kind: "blocked", message: cfg.message };
  }

  const api = await fetchApiStatus(cfg.config.apiBaseUrl);

  if (api.state !== "ok") {
    return {
      endpoint: api.endpoint,
      kind: "api_error",
      message: api.message
    };
  }

  const envelope = api.response;

  if (!envelope.ok) {
    return {
      kind: "api_error",
      message: envelope.error.message,
      endpoint: api.endpoint
    };
  }

  const payload = envelope.data;
  const counts = countIssues(payload.dependencies);
  const executive = deriveExecutive(payload.status, payload.dependencies, counts);

  const summary =
    executive === "OK"
      ? "Último `/api/v1/status`: dependencias declaradas como configuradas; el storefront puede operar si la API y la DB están arriba."
      : executive === "DEGRADED"
        ? "La API responde pero marca gaps (sin credenciales completas, integraciones diferidas o dependencias no configuradas): riesgo en reproducción firmada o lecturas de catálogo."
        : "Hay al menos una dependencia con `missing_credentials`: la API puede rechazar reproducción, uploads o lecturas hasta corregir variables de entorno.";

  return {
    executive,
    errors: counts.errors,
    kind: "ready",
    payload,
    summary,
    warnings: counts.warnings
  };
}

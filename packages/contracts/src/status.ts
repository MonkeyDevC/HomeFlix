import type { ApiResponse } from "./api-response.js";

export type ServiceDependencyName = "postgres" | "directus" | "media-provider";

export type ServiceDependencyStatus =
  | "configured"
  | "not_configured"
  | "deferred"
  | "missing_credentials";

export interface ServiceDependency {
  readonly name: ServiceDependencyName;
  readonly status: ServiceDependencyStatus;
  readonly url?: string;
  readonly note: string;
}

export type ServiceOperationalStatus = "ok" | "degraded";

export interface ServiceStatusPayload {
  readonly service: "homeflix-api";
  readonly phase: "3" | "4" | "5" | "6" | "7" | "8";
  readonly apiVersion: "v1";
  readonly environment: string;
  /**
   * `degraded`: proceso vivo pero dependencias críticas ausentes o no verificadas
   * (p. ej. sin DATABASE_URL o sin credenciales Mux completas).
   */
  readonly status: ServiceOperationalStatus;
  readonly dependencies: readonly ServiceDependency[];
}

export type ServiceStatusResponse = ApiResponse<ServiceStatusPayload>;

import type { ApiResponse } from "./api-response.js";

export type ReadinessCheckName = "postgres";

export type ReadinessCheckStatus = "ok" | "skipped" | "failed";

export interface ReadinessCheck {
  readonly name: ReadinessCheckName;
  readonly status: ReadinessCheckStatus;
  readonly note: string;
}

export interface ReadinessPayload {
  readonly service: "homeflix-api";
  readonly phase: "3" | "4" | "5" | "6" | "7" | "8";
  readonly apiVersion: "v1";
  /** true si la API puede atender tráfico de datos con Postgres cuando aplica. */
  readonly ready: boolean;
  readonly checks: readonly ReadinessCheck[];
  readonly timestamp: string;
}

export type ReadinessResponse = ApiResponse<ReadinessPayload>;

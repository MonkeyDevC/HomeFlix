import type { ApiResponse } from "./api-response.js";

export interface HealthPayload {
  readonly service: "homeflix-api";
  readonly phase: "3" | "4" | "5" | "6" | "7" | "8";
  readonly apiVersion: "v1";
  readonly environment: string;
  readonly status: "ok";
  readonly timestamp: string;
  readonly uptimeSeconds: number;
}

export type HealthCheckResponse = ApiResponse<HealthPayload>;

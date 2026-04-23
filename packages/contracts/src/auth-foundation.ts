import type { ApiResponse } from "./api-response.js";

export type AuthFoundationStatus =
  | "foundation-only"
  | "phase-7-consumer-auth";

export type AuthTokenStrategy =
  | "api-issued-session-token"
  | "api-issued-jwt-bearer";

export type AuthTokenTransport = "authorization-header";

export interface AuthFoundationPayload {
  readonly status: AuthFoundationStatus;
  readonly strategy: AuthTokenStrategy;
  readonly tokenTransport: AuthTokenTransport;
  readonly owner: "apps/api";
  readonly notes: readonly string[];
}

export type AuthFoundationResponse = ApiResponse<AuthFoundationPayload>;

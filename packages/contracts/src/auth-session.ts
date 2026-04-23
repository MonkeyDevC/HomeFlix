import type { ApiResponse } from "./api-response.js";

export type HomeflixAuthRole = "admin" | "viewer";

export interface AuthUserSummary {
  readonly id: string;
  readonly email: string;
  readonly role: HomeflixAuthRole;
}

export interface AuthProfileSummary {
  readonly id: string;
  readonly displayName: string;
}

export interface AuthLoginRequest {
  readonly email: string;
  readonly password: string;
}

export interface AuthLoginPayload {
  readonly token: string;
  readonly user: AuthUserSummary;
  readonly profiles: readonly AuthProfileSummary[];
}

export type AuthLoginResponse = ApiResponse<AuthLoginPayload>;

export interface AuthMePayload {
  readonly user: AuthUserSummary;
  readonly profiles: readonly AuthProfileSummary[];
}

export type AuthMeResponse = ApiResponse<AuthMePayload>;

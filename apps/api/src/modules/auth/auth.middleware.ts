import type { FastifyReply, FastifyRequest } from "fastify";
import type { ApiRuntimeConfig } from "../../env.js";
import { ApiError } from "../../errors/api-error.js";
import {
  assertAdmin,
  type CatalogAuthContext
} from "../catalog/catalog-authz.js";
import { verifyHomeflixAccessToken } from "./auth.jwt.js";

export function createAuthenticateConsumer(config: ApiRuntimeConfig) {
  return async function authenticateConsumer(
    request: FastifyRequest,
    _reply: FastifyReply
  ): Promise<void> {
    const header = request.headers.authorization;

    if (header === undefined || !header.startsWith("Bearer ")) {
      throw new ApiError(
        401,
        "unauthorized",
        "Missing Authorization: Bearer access token."
      );
    }

    const token = header.slice("Bearer ".length).trim();

    if (token.length === 0) {
      throw new ApiError(
        401,
        "unauthorized",
        "Missing Authorization: Bearer access token."
      );
    }

    try {
      const payload = await verifyHomeflixAccessToken(config.jwtSecret, token);
      const auth: CatalogAuthContext = {
        role: payload.role,
        userId: payload.sub
      };
      request.auth = auth;
    } catch {
      throw new ApiError(
        401,
        "unauthorized",
        "Invalid or expired access token."
      );
    }
  };
}

export function createRequireAdmin() {
  return async function requireAdmin(
    request: FastifyRequest,
    _reply: FastifyReply
  ): Promise<void> {
    if (request.auth === undefined) {
      throw new ApiError(
        401,
        "unauthorized",
        "Missing Authorization: Bearer access token."
      );
    }

    assertAdmin(request.auth);
  };
}

import type { FastifyInstance } from "fastify";
import type {
  AuthLoginResponse,
  AuthMeResponse
} from "@homeflix/contracts";
import type { ApiRuntimeConfig } from "../../env.js";
import { ApiError } from "../../errors/api-error.js";
import { createPrismaClient } from "../../infrastructure/database/prisma-client.js";
import { getAuthFoundationResponse } from "./auth-foundation.controller.js";
import { createAuthenticateConsumer } from "./auth.middleware.js";
import { AuthRepository } from "./auth.repository.js";
import { AuthService } from "./auth.service.js";
import { parseAuthLoginBody } from "./auth.validation.js";

export async function registerAuthRoutes(
  app: FastifyInstance,
  config: ApiRuntimeConfig
): Promise<void> {
  app.get("/auth/foundation", async () => getAuthFoundationResponse());

  const prisma =
    config.databaseUrl === undefined
      ? undefined
      : createPrismaClient(config.databaseUrl);

  if (prisma === undefined) {
    app.post("/auth/login", async () => {
      throw new ApiError(
        503,
        "internal_error",
        "La base de datos no está configurada: no se puede iniciar sesión en esta instancia de la API."
      );
    });

    return;
  }

  const repository = new AuthRepository(prisma);
  const service = new AuthService(repository, config);

  app.addHook("onClose", async () => {
    await prisma.$disconnect();
  });

  app.post("/auth/login", async (request): Promise<AuthLoginResponse> => {
    const { email, password } = parseAuthLoginBody(request.body);

    return {
      ok: true,
      data: await service.login(email, password)
    };
  });

  app.get(
    "/auth/me",
    {
      preHandler: createAuthenticateConsumer(config)
    },
    async (request): Promise<AuthMeResponse> => ({
      ok: true,
      data: await service.me(request.auth!.userId)
    })
  );
}

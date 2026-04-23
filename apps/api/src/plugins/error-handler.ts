import type { FastifyError, FastifyInstance } from "fastify";
import type { ApiResponse } from "@homeflix/contracts";
import { isApiError } from "../errors/api-error.js";

export function registerErrorHandling(app: FastifyInstance): void {
  app.setNotFoundHandler((request, reply) => {
    const response: ApiResponse<never> = {
      ok: false,
      error: {
        code: "not_found",
        message: "Route not found",
        requestId: request.id
      }
    };

    void reply.code(404).send(response);
  });

  app.setErrorHandler((error: FastifyError, request, reply) => {
    if (isApiError(error)) {
      request.log.error(
        {
          code: error.code,
          err: {
            message: error.message,
            type: "ApiError"
          },
          statusCode: error.statusCode
        },
        "request_error"
      );
    } else {
      request.log.error(
        {
          err: {
            message: error.message,
            name: error.name,
            ...(process.env.HOMEFLIX_ENV === "development" &&
            error.stack !== undefined
              ? { stack: error.stack }
              : {})
          },
          statusCode: error.statusCode ?? 500
        },
        "request_error"
      );
    }

    const statusCode = isApiError(error) ? error.statusCode : error.statusCode ?? 500;
    const response: ApiResponse<never> = {
      ok: false,
      error: {
        code: isApiError(error)
          ? error.code
          : statusCode >= 500
            ? "internal_error"
            : "request_error",
        message:
          statusCode >= 500 && !isApiError(error)
            ? "Unexpected API error"
            : error.message || "Invalid request",
        ...(isApiError(error) && error.details !== undefined
          ? { details: error.details }
          : {}),
        requestId: request.id
      }
    };

    void reply.code(statusCode).send(response);
  });
}

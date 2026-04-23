import { ApiError } from "../../errors/api-error.js";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseAuthLoginBody(body: unknown): {
  readonly email: string;
  readonly password: string;
} {
  if (!isRecord(body)) {
    throw new ApiError(
      400,
      "validation_error",
      "Login body must be a JSON object."
    );
  }

  const email = body.email;
  const password = body.password;

  if (typeof email !== "string" || email.trim().length === 0) {
    throw new ApiError(400, "validation_error", "email must be a non-empty string.");
  }

  if (typeof password !== "string" || password.length === 0) {
    throw new ApiError(400, "validation_error", "password must be a non-empty string.");
  }

  return {
    email: email.trim(),
    password
  };
}

import type { CreateUploadRequest } from "@homeflix/contracts";
import { ApiError } from "../../errors/api-error.js";

export function parseCreateUploadRequest(body: unknown): CreateUploadRequest {
  if (!isRecord(body)) {
    throw new ApiError(
      400,
      "validation_error",
      "Create upload request body must be a JSON object."
    );
  }

  const contentItemId = readRequiredString(body.contentItemId, "contentItemId");
  const mimeType = readOptionalString(body.mimeType, "mimeType");
  const sourceFilename = readOptionalString(body.sourceFilename, "sourceFilename");

  return {
    contentItemId,
    ...(mimeType === undefined ? {} : { mimeType }),
    ...(sourceFilename === undefined ? {} : { sourceFilename })
  };
}

export function parseMediaAssetIdParam(params: unknown): string {
  if (!isRecord(params)) {
    throw new ApiError(400, "validation_error", "Route params are invalid.");
  }

  return readRequiredString(params.id, "id");
}

function readRequiredString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ApiError(
      400,
      "validation_error",
      `${field} must be a non-empty string.`
    );
  }

  return value.trim();
}

function readOptionalString(
  value: unknown,
  field: string
): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new ApiError(
      400,
      "validation_error",
      `${field} must be a string when provided.`
    );
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

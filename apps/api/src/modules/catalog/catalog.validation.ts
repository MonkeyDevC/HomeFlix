import type {
  ContentItemMediaAssetRole,
  ContentItemType,
  PublicationVisibility
} from "@homeflix/domain";
import type {
  LinkMediaAssetRequest,
  UpsertWatchHistoryRequest
} from "@homeflix/contracts";
import { ApiError } from "../../errors/api-error.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

export function parseRouteId(params: unknown, field = "id"): string {
  if (!isRecord(params)) {
    throw new ApiError(400, "validation_error", "Route params are invalid.");
  }

  return readRequiredString(params[field], field);
}

export function parseRouteParam(
  params: unknown,
  field: string
): string {
  if (!isRecord(params)) {
    throw new ApiError(400, "validation_error", "Route params are invalid.");
  }

  return readRequiredString(params[field], field);
}

export function parseLinkMediaAssetRequest(
  body: unknown
): LinkMediaAssetRequest {
  if (body === undefined || body === null) {
    return {};
  }

  if (!isRecord(body)) {
    throw new ApiError(400, "validation_error", "Link body must be an object.");
  }

  const role = readOptionalString(body.role, "role");

  if (role === undefined) {
    return {};
  }

  if (!isContentItemMediaAssetRole(role)) {
    throw new ApiError(
      400,
      "invalid_media_link_role",
      "role must be primary, trailer or teaser."
    );
  }

  return { role };
}

export function parseUpsertWatchHistoryRequest(
  body: unknown
): UpsertWatchHistoryRequest {
  if (!isRecord(body)) {
    throw new ApiError(
      400,
      "validation_error",
      "Watch history request body must be an object."
    );
  }

  const contentItemId = readRequiredString(body.contentItemId, "contentItemId");
  const mediaAssetId = readOptionalString(body.mediaAssetId, "mediaAssetId");
  const progressSeconds = body.progressSeconds;

  if (
    typeof progressSeconds !== "number" ||
    !Number.isFinite(progressSeconds) ||
    progressSeconds < 0
  ) {
    throw new ApiError(
      400,
      "validation_error",
      "progressSeconds must be a non-negative number."
    );
  }

  const completedAt =
    body.completedAt === null
      ? null
      : readOptionalString(body.completedAt, "completedAt");

  if (completedAt !== undefined && completedAt !== null) {
    const parsed = Date.parse(completedAt);

    if (Number.isNaN(parsed)) {
      throw new ApiError(
        400,
        "validation_error",
        "completedAt must be an ISO date string when provided."
      );
    }
  }

  return {
    contentItemId,
    progressSeconds,
    ...(mediaAssetId === undefined ? {} : { mediaAssetId }),
    ...(completedAt === undefined ? {} : { completedAt })
  };
}

export function isContentItemType(value: string): value is ContentItemType {
  return value === "movie" || value === "clip" || value === "episode";
}

export function isPublicationVisibility(
  value: string
): value is PublicationVisibility {
  return value === "private" || value === "household" || value === "public-internal";
}

function isContentItemMediaAssetRole(
  value: string
): value is ContentItemMediaAssetRole {
  return value === "primary" || value === "trailer" || value === "teaser";
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

/**
 * Reads optional `q` from the catalog search query string.
 */
export function parseCatalogSearchQuery(query: unknown): string {
  if (!isRecord(query)) {
    return "";
  }

  const raw = query.q;

  if (typeof raw !== "string") {
    return "";
  }

  return raw.trim();
}

/**
 * Optional `profileId` query string for playback resume (must be UUID).
 */
export function parseOptionalProfileIdFromQuery(
  query: unknown
): string | undefined {
  if (!isRecord(query)) {
    return undefined;
  }

  const raw = query.profileId;

  if (typeof raw !== "string") {
    return undefined;
  }

  const trimmed = raw.trim();

  if (trimmed.length === 0) {
    return undefined;
  }

  if (!isUuid(trimmed)) {
    return undefined;
  }

  return trimmed;
}

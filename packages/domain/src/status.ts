export type ContentItemStatus = "draft" | "published" | "archived";

/**
 * Normalizes persisted editorial status strings to the canonical union.
 * Unknown legacy values fall back to `draft` so API contracts stay closed.
 */
export function normalizeContentItemStatus(raw: string): ContentItemStatus {
  if (raw === "draft" || raw === "published" || raw === "archived") {
    return raw;
  }

  return "draft";
}

export type MediaAssetStatus =
  | "draft"
  | "uploading"
  | "processing"
  | "ready"
  | "failed";

export type PlaybackPolicy = "public" | "signed";

export type PublicationVisibility = "private" | "household" | "public-internal";

/**
 * Normalizes persisted visibility strings to the canonical union.
 * Unknown values fall back to `private`.
 */
export function normalizePublicationVisibility(
  raw: string
): PublicationVisibility {
  if (raw === "private" || raw === "household" || raw === "public-internal") {
    return raw;
  }

  return "private";
}

export type Role = "admin" | "viewer";

/**
 * Contratos Family V1 alineados a Prisma (`family_v1`) y `docs/family-v1/03-DOMAIN_CONTRACTS.md`.
 * Valores permitidos como literales — validación de negocio en servidor (Zod/servicios) en fases posteriores.
 */

/** Catálogo storefront: solo ítems con este estado pasan el filtro de publicación. */
export const EDITORIAL_STATUS_PUBLISHED = "published" as const;

export type EditorialStatusFamily = "draft" | "published" | "archived";

export type ContentVisibilityFamily = "private" | "household" | "public_internal";

export type ContentTypeFamily = "movie" | "clip" | "episode";

/** Alcance de lanzamiento en storefront (independiente del estado editorial). */
export type ContentReleaseScopeFamily = "admin_only" | "public_catalog";

export type UserRoleFamily = "admin" | "family_viewer";

export type MediaAssetStatusFamily = "pending" | "ready" | "archived";

/** Invariante de producto en catálogo familiar: publicado + public_catalog + fila de acceso (ver `content-storefront-visibility.ts`). */
export type ContentItemCatalogRowFamily = Readonly<{
  id: string;
  slug: string;
  title: string;
  editorialStatus: EditorialStatusFamily;
  visibility: ContentVisibilityFamily;
  type: ContentTypeFamily;
  thumbnailPath: string | null;
  posterPath: string | null;
  categoryId: string | null;
  updatedAt: string;
}>;

export type ProfileContentAccessKey = Readonly<{
  profileId: string;
  contentItemId: string;
}>;

export type ProfileContentAccessRowFamily = Readonly<
  ProfileContentAccessKey & {
    id: string;
    createdAt: string;
  }
>;

export type UserReadFamily = Readonly<{
  id: string;
  email: string;
  role: UserRoleFamily;
  createdAt: string;
  updatedAt: string;
}>;

export type ProfileReadFamily = Readonly<{
  id: string;
  userId: string;
  displayName: string;
  avatarKey: string | null;
  createdAt: string;
  updatedAt: string;
}>;

export type MediaAssetReadFamily = Readonly<{
  id: string;
  contentItemId: string | null;
  filePath: string;
  mimeType: string | null;
  durationSeconds: number | null;
  sizeBytes: string | null;
  status: MediaAssetStatusFamily;
  createdAt: string;
  updatedAt: string;
}>;

export type ContentDetailFamilyDto = Readonly<{
  id: string;
  slug: string;
  title: string;
  synopsis: string | null;
  editorialStatus: EditorialStatusFamily;
  releaseScope: ContentReleaseScopeFamily;
  type: ContentTypeFamily;
  visibility: ContentVisibilityFamily;
  posterPath: string | null;
  thumbnailPath: string | null;
  category: Readonly<{ id: string; slug: string; name: string }> | null;
  collections: readonly Readonly<{
    id: string;
    slug: string;
    name: string;
    position: number;
  }>[];
}>;

export type LocalPlaybackDto = Readonly<{
  mediaAssetId: string;
  filePath: string;
  mimeType: string | null;
  sizeBytes: string | null;
  durationSeconds: number | null;
  /** Ancho/alto en píxeles detectados por ffprobe al subir. */
  width: number | null;
  height: number | null;
  /** Frame rate en fps (decimal). */
  frameRate: number | null;
  /** Códec de video detectado por ffprobe (ej. "h264", "hevc", "av1"). */
  codec: string | null;
  status: MediaAssetStatusFamily;
}>;

export type LocalPlaybackStateFamily =
  | Readonly<{ state: "ready"; playback: LocalPlaybackDto }>
  | Readonly<{ state: "missing_media"; reason: string }>
  | Readonly<{ state: "asset_unusable"; reason: string }>
  | Readonly<{ state: "file_missing"; reason: string; playback: LocalPlaybackDto }>;

export type ContentDetailForProfileFamily = Readonly<{
  item: ContentDetailFamilyDto;
  playback: LocalPlaybackStateFamily;
}>;

/** Contratos HTTP admin Family V1 (JSON). */

export type AdminCategoryDto = Readonly<{
  id: string;
  slug: string;
  name: string;
  /** admin_only | public_catalog */
  releaseScope: string;
  createdAt: string;
  updatedAt: string;
}>;

export type AdminCollectionDto = Readonly<{
  id: string;
  slug: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}>;

export type AdminContentItemListDto = Readonly<{
  id: string;
  slug: string;
  title: string;
  editorialStatus: string;
  /** admin_only | public_catalog */
  releaseScope: string;
  visibility: string;
  type: string;
  categoryId: string | null;
  updatedAt: string;
  accessCount: number;
}>;

export type AdminContentItemDetailDto = Readonly<{
  id: string;
  slug: string;
  title: string;
  synopsis: string | null;
  editorialStatus: string;
  /** admin_only | public_catalog */
  releaseScope: string;
  visibility: string;
  type: string;
  thumbnailPath: string | null;
  posterPath: string | null;
  categoryId: string | null;
  releaseYear: number | null;
  maturityRating: string | null;
  seasonNumber: number | null;
  episodeNumber: number | null;
  createdAt: string;
  updatedAt: string;
}>;

export type AdminCollectionLinkDto = Readonly<{
  id: string;
  collectionId: string;
  collectionName: string;
  collectionSlug: string;
  position: number;
}>;

export type AdminProfileAccessDto = Readonly<{
  profileId: string;
  displayName: string;
  userId: string;
  userEmail: string;
}>;

export type AdminProfileOptionDto = Readonly<{
  id: string;
  displayName: string;
  userId: string;
  userEmail: string;
}>;

export type AdminMediaAssetDto = Readonly<{
  id: string;
  contentItemId: string | null;
  filePath: string;
  mimeType: string | null;
  sizeBytes: string | null;
  width: number | null;
  height: number | null;
  frameRate: number | null;
  durationSeconds: number | null;
  codec: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}>;

export type AdminContentMediaSummaryDto = Readonly<{
  contentItemId: string;
  posterPath: string | null;
  thumbnailPath: string | null;
  videoAsset: AdminMediaAssetDto | null;
}>;

/** Usuario con credenciales (sin hash). */
export type AdminUserSummaryDto = Readonly<{
  id: string;
  email: string;
  role: string;
  profileCount: number;
  createdAt: string;
  updatedAt: string;
}>;

export type AdminUserDetailDto = Readonly<{
  id: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}>;

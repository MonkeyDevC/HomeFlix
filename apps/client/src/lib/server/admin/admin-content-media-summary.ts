import type { AdminContentMediaSummaryDto, AdminPhotoAssetDto } from "../../family/admin-contracts";
import { getFamilyPrisma } from "../db";
import { mapMediaAssetToDto } from "./media-asset-mapper";

function mapPhotoToDto(p: {
  id: string;
  filePath: string;
  mimeType: string;
  sizeBytes: number | null;
  width: number | null;
  height: number | null;
  sortOrder: number;
  altText: string | null;
  createdAt: Date;
  updatedAt: Date;
}): AdminPhotoAssetDto {
  return {
    id: p.id,
    filePath: p.filePath,
    mimeType: p.mimeType,
    sizeBytes: p.sizeBytes,
    width: p.width,
    height: p.height,
    sortOrder: p.sortOrder,
    altText: p.altText,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString()
  };
}

/** Resumen unificado para admin (video, poster, thumbnails, galería). */
export async function buildAdminContentMediaSummaryDto(
  contentItemId: string
): Promise<AdminContentMediaSummaryDto | null> {
  const prisma = getFamilyPrisma();
  const item = await prisma.contentItem.findUnique({
    where: { id: contentItemId },
    select: {
      id: true,
      posterPath: true,
      thumbnailPath: true,
      coverPhotoId: true
    }
  });
  if (item === null) {
    return null;
  }

  const [video, photos] = await Promise.all([
    prisma.mediaAsset.findFirst({
      where: { contentItemId },
      orderBy: { updatedAt: "desc" }
    }),
    prisma.photoAsset.findMany({
      where: { contentItemId },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
    })
  ]);

  return {
    contentItemId: item.id,
    posterPath: item.posterPath,
    thumbnailPath: item.thumbnailPath,
    videoAsset: video === null ? null : mapMediaAssetToDto(video),
    photos: photos.map(mapPhotoToDto),
    coverPhotoId: item.coverPhotoId
  };
}

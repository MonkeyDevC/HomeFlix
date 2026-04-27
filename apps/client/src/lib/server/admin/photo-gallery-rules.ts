import { getFamilyPrisma } from "../db";

export async function countPhotosForContentItem(contentItemId: string): Promise<number> {
  const prisma = getFamilyPrisma();
  return prisma.photoAsset.count({ where: { contentItemId } });
}

/** Publicar una galería requiere al menos una foto. */
export async function assertPhotoGalleryHasPhotosIfPublished(p: {
  contentItemId: string;
  nextType: string;
  nextEditorialStatus: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  if (p.nextType !== "photo_gallery" || p.nextEditorialStatus !== "published") {
    return { ok: true };
  }
  const n = await countPhotosForContentItem(p.contentItemId);
  if (n < 1) {
    return {
      ok: false,
      message: "Una galería publicada debe tener al menos una foto."
    };
  }
  return { ok: true };
}

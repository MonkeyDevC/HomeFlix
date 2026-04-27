/** Límites y formatos — galerías de fotos Family V1 (alineado a `admin-media-storage` imágenes). */

export const FAMILY_GALLERY_PHOTO_MAX_BYTES = 10 * 1024 * 1024; // 10 MiB
export const FAMILY_GALLERY_MAX_PHOTOS = 200;

export const FAMILY_GALLERY_MIME_TO_EXT: Readonly<Record<string, readonly string[]>> = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"]
};

export function familyGalleryPublicPhotoUrl(photoId: string): string {
  return `/api/family/photos/${photoId}`;
}

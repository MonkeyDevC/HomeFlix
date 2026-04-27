import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { FAMILY_GALLERY_MAX_PHOTOS as MAX_GALLERY_PHOTOS } from "../../family/photo-constants";
import { validateUploadFile } from "./admin-media-storage";
import type { FamilyStorageBucket } from "../storage/family-storage";
import { resolveBucketDir, toPublicStoragePath } from "../storage/family-storage";

const PHOTO_BUCKET: FamilyStorageBucket = "photos";

function normalizeExt(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  return ext === ".jpeg" ? ".jpg" : ext;
}

/** Misma validación que poster/thumbnail (JPG/PNG/WebP, sin SVG). */
export function validateGalleryPhotoFile(
  file: File
): { ok: true } | { ok: false; code: string; message: string } {
  return validateUploadFile(file, "thumbnail");
}

export type GalleryPhotoUploadSuccess = Readonly<{
  publicPath: string;
  mimeType: string;
  sizeBytes: number;
}>;

export async function saveGalleryPhotoFile(file: File): Promise<GalleryPhotoUploadSuccess> {
  const v = validateGalleryPhotoFile(file);
  if (!v.ok) {
    throw new Error(v.message);
  }
  const ext = normalizeExt(file.name);
  const baseName = `${Date.now()}-${randomUUID()}${ext}`;
  const bucketDir = resolveBucketDir(PHOTO_BUCKET);
  await mkdir(bucketDir, { recursive: true });
  const bytes = Buffer.from(await file.arrayBuffer());
  const diskPath = path.join(bucketDir, baseName);
  await writeFile(diskPath, bytes);
  const mimeType = file.type.toLowerCase().trim();
  return {
    publicPath: toPublicStoragePath(PHOTO_BUCKET, baseName),
    mimeType,
    sizeBytes: file.size
  };
}

export const FAMILY_GALLERY_MAX_PHOTOS = MAX_GALLERY_PHOTOS;

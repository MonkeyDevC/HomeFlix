import { randomUUID } from "node:crypto";
import { mkdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  resolveBucketDir,
  resolveStorageDiskPath,
  toPublicStoragePath,
  type FamilyStorageBucket
} from "../storage/family-storage";

type MediaKind = "video" | "poster" | "thumbnail";

type MediaRule = Readonly<{
  bucket: FamilyStorageBucket;
  maxBytes: number;
  allowedMimeToExt: Readonly<Record<string, readonly string[]>>;
}>;

const VIDEO_MAX_BYTES = 300 * 1024 * 1024; // 300 MiB
const IMAGE_MAX_BYTES = 10 * 1024 * 1024; // 10 MiB

const RULES: Readonly<Record<MediaKind, MediaRule>> = {
  video: {
    bucket: "videos",
    maxBytes: VIDEO_MAX_BYTES,
    allowedMimeToExt: {
      "video/mp4": [".mp4"]
    }
  },
  poster: {
    bucket: "posters",
    maxBytes: IMAGE_MAX_BYTES,
    allowedMimeToExt: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"]
    }
  },
  thumbnail: {
    bucket: "thumbnails",
    maxBytes: IMAGE_MAX_BYTES,
    allowedMimeToExt: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"]
    }
  }
};

export type MediaUploadSuccess = Readonly<{
  bucket: FamilyStorageBucket;
  diskPath: string;
  mimeType: string;
  publicPath: string;
  sizeBytes: number;
}>;

function normalizeExt(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  return ext === ".jpeg" ? ".jpg" : ext;
}

export function validateUploadFile(
  file: File,
  kind: MediaKind
): { ok: true } | { ok: false; code: string; message: string } {
  const rule = RULES[kind];
  const mime = file.type.toLowerCase().trim();
  const ext = normalizeExt(file.name);

  if (file.size <= 0) {
    return {
      ok: false,
      code: "empty_file",
      message: "El archivo está vacío."
    };
  }

  if (file.size > rule.maxBytes) {
    return {
      ok: false,
      code: "max_size_exceeded",
      message: `Archivo demasiado grande para ${kind} (máx. ${Math.round(rule.maxBytes / (1024 * 1024))} MiB).`
    };
  }

  const allowedExt = rule.allowedMimeToExt[mime];
  if (allowedExt === undefined) {
    return {
      ok: false,
      code: "invalid_mime",
      message: `MIME no permitido para ${kind}: ${mime || "(vacío)"}.`
    };
  }

  if (!allowedExt.includes(ext)) {
    return {
      ok: false,
      code: "invalid_extension",
      message: `Extensión no permitida para ${kind}: ${ext || "(sin extensión)"}.`
    };
  }

  return { ok: true };
}

export async function saveUploadFile(file: File, kind: MediaKind): Promise<MediaUploadSuccess> {
  const rule = RULES[kind];
  const ext = normalizeExt(file.name);
  const baseName = `${Date.now()}-${randomUUID()}${ext}`;

  const bucketDir = resolveBucketDir(rule.bucket);

  await mkdir(bucketDir, { recursive: true });

  const bytes = Buffer.from(await file.arrayBuffer());
  const diskPath = path.join(bucketDir, baseName);
  await writeFile(diskPath, bytes);

  return {
    bucket: rule.bucket,
    diskPath,
    mimeType: file.type,
    publicPath: toPublicStoragePath(rule.bucket, baseName),
    sizeBytes: file.size
  };
}

export async function removeStoredFileMaybe(filePath: string | null | undefined): Promise<void> {
  const abs = resolveStorageDiskPath(filePath);
  if (abs === null) {
    return;
  }
  try {
    await stat(abs);
    await rm(abs, { force: true });
  } catch {
    // Reemplazo best-effort: no fallar el flujo si el archivo previo no existe.
  }
}

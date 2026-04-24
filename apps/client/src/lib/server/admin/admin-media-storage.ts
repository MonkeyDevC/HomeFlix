import { randomUUID } from "node:crypto";
import { mkdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  familyVideoMimeToExtMap,
  inferFamilyVideoMimeType
} from "../../family/allowed-video-upload";
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

/** Límite de archivo de video en admin (validación). Alinear proxy/nginx con margen sobre este valor. */
export const FAMILY_VIDEO_UPLOAD_MAX_BYTES = 5 * 1024 * 1024 * 1024; // 5 GiB
const VIDEO_MAX_BYTES = FAMILY_VIDEO_UPLOAD_MAX_BYTES;
const IMAGE_MAX_BYTES = 10 * 1024 * 1024; // 10 MiB

const RULES: Readonly<Record<MediaKind, MediaRule>> = {
  video: {
    bucket: "videos",
    maxBytes: VIDEO_MAX_BYTES,
    allowedMimeToExt: familyVideoMimeToExtMap()
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

function formatMaxBytesLabel(maxBytes: number): string {
  if (maxBytes >= 1024 * 1024 * 1024 && maxBytes % (1024 * 1024 * 1024) === 0) {
    return `${maxBytes / (1024 * 1024 * 1024)} GiB`;
  }
  if (maxBytes >= 1024 * 1024 && maxBytes % (1024 * 1024) === 0) {
    return `${maxBytes / (1024 * 1024)} MiB`;
  }
  return `${Math.round(maxBytes / (1024 * 1024))} MiB`;
}

export function validateUploadFile(
  file: File,
  kind: MediaKind
): { ok: true } | { ok: false; code: string; message: string } {
  const rule = RULES[kind];
  const ext = normalizeExt(file.name);
  const mime =
    kind === "video" ? inferFamilyVideoMimeType(file.type, ext) : file.type.toLowerCase().trim();

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
      message: `Archivo demasiado grande para ${kind} (máx. ${formatMaxBytesLabel(rule.maxBytes)}).`
    };
  }

  const allowedExt = rule.allowedMimeToExt[mime];
  if (allowedExt === undefined) {
    if (kind === "video") {
      console.warn("[homeflix:media-upload]", "invalid_mime", {
        mime: mime || "(vacío)",
        ext,
        declaredType: file.type
      });
    }
    return {
      ok: false,
      code: "invalid_mime",
      message:
        kind === "video"
          ? `Formato no permitido. Usa MP4 o MOV. (recibido: ${mime || "sin MIME"})`
          : `MIME no permitido para ${kind}: ${mime || "(vacío)"}.`
    };
  }

  if (!allowedExt.includes(ext)) {
    if (kind === "video") {
      console.warn("[homeflix:media-upload]", "invalid_extension", {
        ext: ext || "(sin extensión)",
        mime,
        declaredType: file.type
      });
    }
    return {
      ok: false,
      code: "invalid_extension",
      message:
        kind === "video"
          ? `Formato no permitido. Usa MP4 o MOV. (extensión: ${ext || "sin extensión"})`
          : `Extensión no permitida para ${kind}: ${ext || "(sin extensión)"}.`
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

  const mimeType =
    kind === "video" ? inferFamilyVideoMimeType(file.type, ext) : file.type.toLowerCase().trim();

  return {
    bucket: rule.bucket,
    diskPath,
    mimeType,
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

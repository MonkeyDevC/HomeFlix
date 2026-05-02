import { randomUUID } from "node:crypto";
import { createWriteStream } from "node:fs";
import { mkdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Readable } from "node:stream";
import { Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import {
  FAMILY_VIDEO_UPLOAD_MAX_BYTES,
  familyVideoMimeToExtMap,
  inferFamilyVideoMimeType
} from "../../family/allowed-video-upload";
import {
  isManagedStoragePath,
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

const VIDEO_MAX_BYTES = FAMILY_VIDEO_UPLOAD_MAX_BYTES;
const IMAGE_MAX_BYTES = 10 * 1024 * 1024; // 10 MiB

/** Límite de poster/thumbnail (multipart en buffer); alineado con `lib/admin/image-validation`. */
export const FAMILY_IMAGE_UPLOAD_MAX_BYTES = IMAGE_MAX_BYTES;

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

/** Metadatos mínimos equivalentes a `File` para validación sin bufferizar el cuerpo. */
export type UploadLike = Readonly<{
  name: string;
  type: string;
  size: number;
}>;

/** Valida nombre + MIME/extensión sin mirar el tamaño (útil antes de streaming). */
export function validateUploadShape(
  fileName: string,
  clientMime: string,
  kind: MediaKind
): { ok: true; ext: string; mime: string } | { ok: false; code: string; message: string } {
  const rule = RULES[kind];
  const ext = normalizeExt(fileName);
  const mime =
    kind === "video" ? inferFamilyVideoMimeType(clientMime, ext) : clientMime.toLowerCase().trim();

  const allowedExt = rule.allowedMimeToExt[mime];
  if (allowedExt === undefined) {
    if (kind === "video") {
      console.warn("[homeflix:media-upload]", "invalid_mime", {
        mime: mime || "(vacío)",
        ext,
        declaredType: clientMime
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
        declaredType: clientMime
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

  return { ok: true, ext, mime };
}

export function validateUploadLike(
  file: UploadLike,
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

export function validateUploadFile(
  file: File,
  kind: MediaKind
): { ok: true } | { ok: false; code: string; message: string } {
  return validateUploadLike({ name: file.name, type: file.type, size: file.size }, kind);
}

/** Poster/thumbnail desde buffer (sin `File` ni `request.formData()`). */
export async function saveImageUploadFromBuffer(
  buffer: Buffer,
  meta: Readonly<{ filename: string; mimeType: string }>,
  kind: "poster" | "thumbnail"
): Promise<MediaUploadSuccess> {
  const validation = validateUploadLike(
    { name: meta.filename, type: meta.mimeType, size: buffer.length },
    kind
  );
  if (!validation.ok) {
    const err = new Error(validation.message) as NodeJS.ErrnoException;
    err.code = validation.code;
    throw err;
  }

  const rule = RULES[kind];
  const ext = normalizeExt(meta.filename);
  const baseName = `${Date.now()}-${randomUUID()}${ext}`;
  const bucketDir = resolveBucketDir(rule.bucket);
  await mkdir(bucketDir, { recursive: true });
  const diskPath = path.join(bucketDir, baseName);
  await writeFile(diskPath, buffer);

  const mimeType = meta.mimeType.toLowerCase().trim();

  return {
    bucket: rule.bucket,
    diskPath,
    mimeType,
    publicPath: toPublicStoragePath(rule.bucket, baseName),
    sizeBytes: buffer.length
  };
}

export async function saveUploadFile(file: File, kind: MediaKind): Promise<MediaUploadSuccess> {
  const rule = RULES[kind];
  const ext = normalizeExt(file.name);
  const baseName = `${Date.now()}-${randomUUID()}${ext}`;

  const bucketDir = resolveBucketDir(rule.bucket);

  await mkdir(bucketDir, { recursive: true });

  const diskPath = path.join(bucketDir, baseName);
  await writeBrowserFileToDisk(file, diskPath);

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

/**
 * Graba un video multipart como stream a disco (sin `request.formData()` ni `File` en memoria).
 * Valida forma (nombre/MIME) antes de escribir; tamaño y reglas finales tras `stat`.
 */
export async function saveVideoUploadFromStream(
  source: Readable,
  meta: Readonly<{ filename: string; mimeType: string }>
): Promise<MediaUploadSuccess> {
  const shape = validateUploadShape(meta.filename, meta.mimeType, "video");
  if (!shape.ok) {
    source.resume();
    const err = new Error(shape.message) as NodeJS.ErrnoException;
    err.code = shape.code;
    throw err;
  }

  const ext = shape.ext;
  const rule = RULES.video;
  const baseName = `${Date.now()}-${randomUUID()}${ext}`;
  const bucketDir = resolveBucketDir(rule.bucket);
  await mkdir(bucketDir, { recursive: true });
  const diskPath = path.join(bucketDir, baseName);

  let written = 0;
  const guard = new Transform({
    transform(chunk, _enc, cb) {
      const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as Uint8Array);
      written += buf.length;
      if (written > VIDEO_MAX_BYTES) {
        const err = new Error("Archivo demasiado grande.") as NodeJS.ErrnoException;
        err.code = "max_size_exceeded";
        cb(err);
        return;
      }
      cb(null, buf);
    }
  });

  const out = createWriteStream(diskPath);

  try {
    await pipeline(source, guard, out);
  } catch (err) {
    await rm(diskPath, { force: true }).catch(() => {
      /* ignore */
    });
    throw err;
  }

  const st = await stat(diskPath);
  const sizeBytes = st.size;

  const post = validateUploadLike(
    { name: meta.filename, type: meta.mimeType, size: sizeBytes },
    "video"
  );
  if (!post.ok) {
    await rm(diskPath, { force: true }).catch(() => {
      /* ignore */
    });
    const err = new Error(post.message) as NodeJS.ErrnoException;
    err.code = post.code;
    throw err;
  }

  const mimeType = inferFamilyVideoMimeType(meta.mimeType, ext);

  return {
    bucket: rule.bucket,
    diskPath,
    mimeType,
    publicPath: toPublicStoragePath(rule.bucket, baseName),
    sizeBytes
  };
}

async function writeBrowserFileToDisk(file: File, diskPath: string): Promise<void> {
  const reader = file.stream().getReader();
  const out = createWriteStream(diskPath);

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value === undefined || value.byteLength === 0) continue;

      await new Promise<void>((resolve, reject) => {
        out.write(Buffer.from(value), (err) => {
          if (err !== undefined) {
            reject(err);
            return;
          }
          resolve();
        });
      });
    }

    await new Promise<void>((resolve, reject) => {
      out.end((err?: Error | null) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  } catch (error) {
    out.destroy();
    throw error;
  } finally {
    reader.releaseLock();
  }
}

/**
 * Elimina un archivo bajo `FAMILY_STORAGE_ROOT` si la ruta pública es gestionada
 * (`/storage/...`). No hace nada si la ruta escapa del root o no existe.
 *
 * @param logContext Si se informa, emite `console.warn` ante rutas no gestionadas,
 *        archivos ausentes o fallos de borrado (operaciones de limpieza).
 */
export async function removeStoredFileMaybe(
  filePath: string | null | undefined,
  logContext?: string
): Promise<void> {
  const abs = resolveStorageDiskPath(filePath);
  if (abs === null) {
    if (
      logContext !== undefined &&
      filePath !== null &&
      filePath !== undefined &&
      String(filePath).trim() !== ""
    ) {
      console.warn("[homeflix:storage]", "skip_unmanaged_path", { context: logContext, filePath });
    }
    return;
  }
  try {
    await stat(abs);
  } catch {
    if (logContext !== undefined) {
      console.warn("[homeflix:storage]", "file_missing_skip", { context: logContext, filePath, abs });
    }
    return;
  }
  try {
    await rm(abs, { force: true });
  } catch (err) {
    if (logContext !== undefined) {
      console.warn("[homeflix:storage]", "remove_failed", {
        context: logContext,
        filePath,
        abs,
        message: err instanceof Error ? err.message : String(err)
      });
    }
  }
}

/** Rutas públicas `/storage/...` únicas y seguras para borrado en lote. */
export function uniqueManagedPublicPaths(
  paths: ReadonlyArray<string | null | undefined>
): string[] {
  const out = new Set<string>();
  for (const p of paths) {
    if (p === null || p === undefined) continue;
    const t = p.trim();
    if (t === "") continue;
    if (!isManagedStoragePath(t)) continue;
    out.add(t);
  }
  return [...out];
}

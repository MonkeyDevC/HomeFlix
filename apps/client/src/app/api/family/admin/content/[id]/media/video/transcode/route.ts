/**
 * Re-transcodifica o resincroniza el `MediaAsset` actual de un `ContentItem`.
 *
 * Casos:
 *   1. El archivo en disco todavía está en un códec no compatible (AV1,
 *      HEVC, …) → corremos ffmpeg para convertirlo a H.264/AAC.
 *   2. El archivo en disco ya está en H.264 pero la BD todavía dice otro
 *      códec (porque alguien transcodificó a mano o corrió una repair) →
 *      simplemente leemos metadatos y actualizamos la fila sin re-encodear.
 *
 * No sube nada nuevo: opera sobre el archivo ya presente.
 */
import { randomUUID } from "node:crypto";
import { mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import type { AdminContentMediaSummaryDto } from "../../../../../../../../../lib/family/admin-contracts";
import { mapMediaAssetToDto } from "../../../../../../../../../lib/server/admin/media-asset-mapper";
import {
  isBrowserFriendlyCodec,
  probeVideo
} from "../../../../../../../../../lib/server/admin/video-probe";
import {
  convertMovToMp4OnDisk,
  extractPosterFrame,
  transcodeToH264InPlace
} from "../../../../../../../../../lib/server/admin/video-transcode";
import { requireAdminApi } from "../../../../../../../../../lib/server/auth/require-admin-api";
import { getFamilyPrisma } from "../../../../../../../../../lib/server/db";
import {
  resolveBucketDir,
  resolveStorageDiskPath,
  toPublicStoragePath
} from "../../../../../../../../../lib/server/storage/family-storage";

async function ensureAutoThumbnail(
  videoDiskPath: string,
  durationSeconds: number | null
): Promise<string | null> {
  const thumbDir = resolveBucketDir("thumbnails");
  await mkdir(thumbDir, { recursive: true });

  const fileName = `auto-${Date.now()}-${randomUUID()}.jpg`;
  const diskPath = path.join(thumbDir, fileName);
  try {
    await extractPosterFrame(videoDiskPath, diskPath, { durationSeconds });
  } catch {
    return null;
  }
  try {
    const st = await stat(diskPath);
    if (st.size <= 0) return null;
  } catch {
    return null;
  }
  return toPublicStoragePath("thumbnails", fileName);
}

export const runtime = "nodejs";
export const maxDuration = 900;

export async function POST(
  _request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const gate = await requireAdminApi();
  if (gate instanceof NextResponse) {
    return gate;
  }

  const { id: contentItemId } = await ctx.params;
  const prisma = getFamilyPrisma();

  const content = await prisma.contentItem.findUnique({
    where: { id: contentItemId },
    select: { id: true, posterPath: true, thumbnailPath: true }
  });
  if (content === null) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const asset = await prisma.mediaAsset.findFirst({
    where: { contentItemId },
    orderBy: { updatedAt: "desc" }
  });
  if (asset === null) {
    return NextResponse.json(
      { error: "no_asset", message: "Este contenido no tiene un video cargado." },
      { status: 404 }
    );
  }

  let diskPath = resolveStorageDiskPath(asset.filePath);
  if (diskPath === null) {
    return NextResponse.json(
      { error: "invalid_path", message: "La ruta del archivo no es válida para transcode." },
      { status: 422 }
    );
  }

  let effectivePublicPath = asset.filePath;
  let transcoded = false;

  if (path.extname(diskPath).toLowerCase() === ".mov") {
    console.info("[homeflix:video-transcode]", "mov_normalize_start", { filePath: asset.filePath });
    try {
      const { diskPath: mp4Disk } = await convertMovToMp4OnDisk(diskPath);
      diskPath = mp4Disk;
      effectivePublicPath = toPublicStoragePath("videos", path.basename(mp4Disk));
      transcoded = true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "mov_to_mp4_failed";
      console.error("[homeflix:video-transcode]", "mov_normalize_failed", {
        filePath: asset.filePath,
        message
      });
      return NextResponse.json(
        { error: "mov_to_mp4_failed", message: `No se pudo convertir MOV a MP4: ${message}` },
        { status: 500 }
      );
    }
  }

  // Primer probe: leer el estado actual del archivo en disco (la BD puede
  // estar desactualizada si alguien re-encodeó a mano).
  const initialProbe = await probeVideo(diskPath);
  if (!initialProbe.ok) {
    return NextResponse.json(
      { error: initialProbe.code, message: initialProbe.message },
      { status: 422 }
    );
  }

  if (!isBrowserFriendlyCodec(initialProbe.metadata.codec)) {
    try {
      console.info("[homeflix:video-transcode]", "h264_transcode_start", {
        filePath: effectivePublicPath,
        codec: initialProbe.metadata.codec
      });
      await transcodeToH264InPlace(diskPath);
      transcoded = true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "transcode_failed";
      console.error("[homeflix:video-transcode]", "h264_transcode_failed", {
        filePath: effectivePublicPath,
        message
      });
      return NextResponse.json({ error: "transcode_failed", message }, { status: 500 });
    }
  }

  // Siempre reprobamos para dejar la BD en sync con el archivo final.
  const finalProbe = await probeVideo(diskPath);
  const metadata = finalProbe.ok ? finalProbe.metadata : null;

  let sizeBytes: bigint = asset.sizeBytes ?? BigInt(0);
  try {
    const st = await stat(diskPath);
    sizeBytes = BigInt(st.size);
  } catch {
    /* keep previous sizeBytes */
  }

  const finalMimeType =
    path.extname(effectivePublicPath).toLowerCase() === ".mp4" ? "video/mp4" : asset.mimeType;

  const updated = await prisma.mediaAsset.update({
    where: { id: asset.id },
    data: {
      filePath: effectivePublicPath,
      mimeType: finalMimeType,
      sizeBytes,
      width: metadata?.width ?? asset.width,
      height: metadata?.height ?? asset.height,
      frameRate: metadata?.frameRate ?? asset.frameRate,
      durationSeconds: metadata?.durationSeconds ?? asset.durationSeconds,
      codec: metadata?.codec ?? "h264",
      status: "ready"
    }
  });

  // Aprovechamos el reparador para generar thumbnail/poster automático si
  // faltan (videos subidos antes del auto-thumb no tenían portada y se veían
  // en negro en carruseles y episodios).
  let finalThumbnail = content.thumbnailPath;
  let finalPoster = content.posterPath;
  if (finalThumbnail === null || finalPoster === null) {
    const generatedPath = await ensureAutoThumbnail(
      diskPath,
      metadata?.durationSeconds ?? updated.durationSeconds ?? null
    );
    if (generatedPath !== null) {
      const updates: { thumbnailPath?: string; posterPath?: string } = {};
      if (finalThumbnail === null) {
        updates.thumbnailPath = generatedPath;
        finalThumbnail = generatedPath;
      }
      if (finalPoster === null) {
        updates.posterPath = generatedPath;
        finalPoster = generatedPath;
      }
      if (Object.keys(updates).length > 0) {
        await prisma.contentItem.update({
          where: { id: contentItemId },
          data: updates
        });
      }
    }
  }

  const summary: AdminContentMediaSummaryDto = {
    contentItemId,
    posterPath: finalPoster,
    thumbnailPath: finalThumbnail,
    videoAsset: mapMediaAssetToDto(updated)
  };

  return NextResponse.json(
    { item: summary, transcoded, codec: metadata?.codec ?? "unknown" },
    { status: 200 }
  );
}

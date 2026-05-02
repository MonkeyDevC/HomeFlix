import { randomUUID } from "node:crypto";
import { mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { FAMILY_VIDEO_MAX_SIZE_LABEL } from "../../../../../../../../lib/family/allowed-video-upload";
import {
  removeStoredFileMaybe,
  type MediaUploadSuccess
} from "../../../../../../../../lib/server/admin/admin-media-storage";
import { buildAdminContentMediaSummaryDto } from "../../../../../../../../lib/server/admin/admin-content-media-summary";
import { parseVideoMultipartToDisk } from "../../../../../../../../lib/server/admin/parse-video-upload-multipart";
import {
  isBrowserFriendlyCodec,
  probeVideo
} from "../../../../../../../../lib/server/admin/video-probe";
import {
  convertMovToMp4OnDisk,
  extractPosterFrame,
  transcodeToH264InPlace
} from "../../../../../../../../lib/server/admin/video-transcode";
import { requireAdminApi } from "../../../../../../../../lib/server/auth/require-admin-api";
import { getFamilyPrisma } from "../../../../../../../../lib/server/db";
import {
  resolveBucketDir,
  toPublicStoragePath
} from "../../../../../../../../lib/server/storage/family-storage";

/**
 * Si el ContentItem no tiene thumbnail/poster, extrae un frame del video y
 * lo usa como imagen por defecto. Devuelve la ruta pública del nuevo thumb
 * (o `null` si ya había imagen o la extracción falló).
 */
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
/**
 * El transcode a H.264 puede tomar varios minutos para un video largo. El
 * default de Next (10 s para rutas API en producción) no alcanza. En Node
 * runtime podemos elevar el límite.
 */
export const maxDuration = 900;

export async function POST(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const gate = await requireAdminApi();
  if (gate instanceof NextResponse) {
    return gate;
  }

  const { id: contentItemId } = await ctx.params;

  console.info("[homeflix:video-upload]", "request_start", {
    contentItemId,
    contentType: request.headers.get("content-type"),
    contentLength: request.headers.get("content-length")
  });

  const parsed = await parseVideoMultipartToDisk(request);

  if (!parsed.ok) {
    console.warn("[homeflix:video-upload]", "multipart_parse_client_error", {
      contentItemId,
      status: parsed.status,
      error: parsed.error,
      message: parsed.message
    });
    return NextResponse.json(
      { error: parsed.error, message: parsed.message },
      { status: parsed.status }
    );
  }

  let saved: MediaUploadSuccess = parsed.saved;

  console.info("[homeflix:video-upload]", "stream_saved", {
    contentItemId,
    sizeBytes: saved.sizeBytes,
    publicPath: saved.publicPath,
    mimeType: saved.mimeType
  });

  try {
    if (path.extname(saved.diskPath).toLowerCase() === ".mov") {
      console.info("[homeflix:video-upload]", "mov_normalize_start", {
        contentItemId,
        publicPath: saved.publicPath
      });
      try {
        const { diskPath: mp4Disk } = await convertMovToMp4OnDisk(saved.diskPath);
        const st = await stat(mp4Disk);
        const baseName = path.basename(mp4Disk);
        saved = {
          ...saved,
          diskPath: mp4Disk,
          publicPath: toPublicStoragePath("videos", baseName),
          mimeType: "video/mp4",
          sizeBytes: Number(st.size)
        };
        console.info("[homeflix:video-upload]", "mov_normalize_done", {
          contentItemId,
          publicPath: saved.publicPath,
          sizeBytes: saved.sizeBytes
        });
      } catch (movErr) {
        await removeStoredFileMaybe(saved.publicPath);
        const message = movErr instanceof Error ? movErr.message : "mov_to_mp4_failed";
        console.error("[homeflix:video-upload]", "mov_normalize_failed", {
          contentItemId,
          publicPath: saved.publicPath,
          message,
          stack: movErr instanceof Error ? movErr.stack : null,
          movErr
        });
        return NextResponse.json(
          {
            error: "mov_to_mp4_failed",
            message: `No se pudo convertir MOV a MP4: ${message}`
          },
          { status: 500 }
        );
      }
    }

    console.info("[homeflix:video-upload]", "probe_start", {
      contentItemId,
      diskPath: saved.diskPath
    });
    const probe = await probeVideo(saved.diskPath);
    console.info("[homeflix:video-upload]", "probe_done", {
      contentItemId,
      ok: probe.ok,
      codec: probe.ok ? probe.metadata.codec : probe.code
    });

    if (!probe.ok) {
      await removeStoredFileMaybe(saved.publicPath);
      return NextResponse.json(
        { error: probe.code, message: probe.message },
        { status: 422 }
      );
    }

    let metadata = probe.metadata;
    let finalSizeBytes = saved.sizeBytes;

    if (!isBrowserFriendlyCodec(metadata.codec)) {
      try {
        console.info("[homeflix:video-upload]", "h264_transcode_start", {
          contentItemId,
          publicPath: saved.publicPath,
          codec: metadata.codec
        });
        await transcodeToH264InPlace(saved.diskPath);
        console.info("[homeflix:video-upload]", "h264_transcode_done", {
          contentItemId,
          publicPath: saved.publicPath
        });
      } catch (transcodeErr) {
        await removeStoredFileMaybe(saved.publicPath);
        const message = transcodeErr instanceof Error ? transcodeErr.message : "transcode_failed";
        console.error("[homeflix:video-upload]", "h264_transcode_failed", {
          contentItemId,
          publicPath: saved.publicPath,
          message,
          stack: transcodeErr instanceof Error ? transcodeErr.stack : null,
          transcodeErr
        });
        return NextResponse.json(
          {
            error: "transcode_failed",
            message: `El video se subió pero la conversión a H.264 falló: ${message}`
          },
          { status: 500 }
        );
      }

      const reprobed = await probeVideo(saved.diskPath);
      if (reprobed.ok) {
        metadata = reprobed.metadata;
      }

      try {
        const st = await stat(saved.diskPath);
        finalSizeBytes = st.size;
      } catch {
        /* dejamos el tamaño anterior */
      }
    }

    console.info("[homeflix:video-upload]", "prisma_start", { contentItemId });

    const prisma = getFamilyPrisma();

    const content = await prisma.contentItem.findUnique({
      where: { id: contentItemId },
      select: { id: true, posterPath: true, thumbnailPath: true }
    });
    if (content === null) {
      await removeStoredFileMaybe(saved.publicPath);
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const previous = await prisma.mediaAsset.findFirst({
      where: { contentItemId },
      orderBy: { updatedAt: "desc" }
    });

    const qualityData = {
      width: metadata.width,
      height: metadata.height,
      frameRate: metadata.frameRate,
      durationSeconds: metadata.durationSeconds,
      codec: metadata.codec
    };

    const video = previous === null
      ? await prisma.mediaAsset.create({
          data: {
            contentItemId,
            filePath: saved.publicPath,
            mimeType: saved.mimeType,
            sizeBytes: BigInt(finalSizeBytes),
            status: "ready",
            ...qualityData
          }
        })
      : await prisma.mediaAsset.update({
          where: { id: previous.id },
          data: {
            filePath: saved.publicPath,
            mimeType: saved.mimeType,
            sizeBytes: BigInt(finalSizeBytes),
            status: "ready",
            ...qualityData
          }
        });

    if (previous !== null && previous.filePath !== saved.publicPath) {
      await removeStoredFileMaybe(previous.filePath);
    }

    let finalThumbnail = content.thumbnailPath;
    let finalPoster = content.posterPath;
    if (finalThumbnail === null || finalPoster === null) {
      console.info("[homeflix:video-upload]", "auto_thumbnail_start", { contentItemId });
      const generatedPath = await ensureAutoThumbnail(
        saved.diskPath,
        metadata.durationSeconds
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
      console.info("[homeflix:video-upload]", "auto_thumbnail_done", {
        contentItemId,
        generatedPath
      });
    }

    const summary = await buildAdminContentMediaSummaryDto(contentItemId);
    if (summary === null) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    console.info("[homeflix:video-upload]", "upload_ok", {
      contentItemId,
      mediaAssetId: video.id,
      publicPath: saved.publicPath
    });

    return NextResponse.json({ item: summary }, { status: 201 });
  } catch (error) {
    await removeStoredFileMaybe(saved.publicPath);
    const message = error instanceof Error ? error.message : "upload_failed";
    console.error("[homeflix:video-upload]", "upload_failed", {
      contentItemId,
      message,
      stack: error instanceof Error ? error.stack : null,
      error
    });
    return NextResponse.json(
      {
        error: "upload_failed",
        message: `Error al procesar el video: ${message}. Si el fallo fue al leer el formulario, verificá que el archivo no supere ${FAMILY_VIDEO_MAX_SIZE_LABEL}.`
      },
      { status: 503 }
    );
  }
}

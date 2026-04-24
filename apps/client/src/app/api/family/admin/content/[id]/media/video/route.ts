import { randomUUID } from "node:crypto";
import { mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import type { AdminContentMediaSummaryDto } from "../../../../../../../../lib/family/admin-contracts";
import {
  removeStoredFileMaybe,
  saveUploadFile,
  validateUploadFile
} from "../../../../../../../../lib/server/admin/admin-media-storage";
import { mapMediaAssetToDto } from "../../../../../../../../lib/server/admin/media-asset-mapper";
import {
  isBrowserFriendlyCodec,
  probeVideo
} from "../../../../../../../../lib/server/admin/video-probe";
import {
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

function noFileResponse() {
  return NextResponse.json({ error: "file_required", message: "Debes adjuntar el campo file." }, { status: 400 });
}

export async function POST(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const gate = await requireAdminApi();
  if (gate instanceof NextResponse) {
    return gate;
  }

  const { id: contentItemId } = await ctx.params;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      {
        error: "invalid_form_data",
        message: "No se pudo leer el formulario. Verifica que el archivo no supere 5 GiB y vuelve a intentarlo."
      },
      { status: 400 }
    );
  }

  const candidate = form.get("file");
  if (!(candidate instanceof File)) {
    return noFileResponse();
  }
  const validation = validateUploadFile(candidate, "video");
  if (!validation.ok) {
    return NextResponse.json(
      { error: validation.code, message: validation.message },
      { status: 400 }
    );
  }

  let saved: Awaited<ReturnType<typeof saveUploadFile>> | null = null;
  try {
    saved = await saveUploadFile(candidate, "video");

    // Inspección de metadatos: solo rechazamos si el archivo no es un video
    // legible. Si lo es, capturamos codec/res/fps/duración para decidir si
    // hay que transcodificar.
    const probe = await probeVideo(saved.diskPath);
    if (!probe.ok) {
      await removeStoredFileMaybe(saved.publicPath);
      return NextResponse.json(
        { error: probe.code, message: probe.message },
        { status: 422 }
      );
    }

    let metadata = probe.metadata;
    let finalSizeBytes = saved.sizeBytes;

    // Si el códec original no se decodifica bien en navegadores mainstream
    // (AV1, HEVC, etc.), re-encodeamos a H.264/AAC en el servidor. Esto
    // mantiene la calidad visual (crf 18) y garantiza que el video se
    // reproduzca en cualquier dispositivo familiar.
    if (!isBrowserFriendlyCodec(metadata.codec)) {
      try {
        await transcodeToH264InPlace(saved.diskPath);
      } catch (transcodeErr) {
        await removeStoredFileMaybe(saved.publicPath);
        const message = transcodeErr instanceof Error ? transcodeErr.message : "transcode_failed";
        return NextResponse.json(
          {
            error: "transcode_failed",
            message: `El video se subió pero la conversión a H.264 falló: ${message}`
          },
          { status: 500 }
        );
      }

      // Tras el transcode, volvemos a leer metadatos (codec nuevo = h264,
      // y potencialmente duración/fps ajustados por ffmpeg).
      const reprobed = await probeVideo(saved.diskPath);
      if (reprobed.ok) {
        metadata = reprobed.metadata;
      }

      try {
        const st = await stat(saved.diskPath);
        finalSizeBytes = st.size;
      } catch {
        /* dejamos el tamaño original; no es bloqueante */
      }
    }

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

    // Si el contenido no tiene thumb/poster, generamos una portada automática
    // a partir de un frame del video. Así los episodios subidos sin imagen
    // manual dejan de mostrarse con recuadro negro en /c/[slug] y carruseles.
    let finalThumbnail = content.thumbnailPath;
    let finalPoster = content.posterPath;
    if (finalThumbnail === null || finalPoster === null) {
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
    }

    const summary: AdminContentMediaSummaryDto = {
      contentItemId,
      posterPath: finalPoster,
      thumbnailPath: finalThumbnail,
      videoAsset: mapMediaAssetToDto(video)
    };

    return NextResponse.json({ item: summary }, { status: 201 });
  } catch (error) {
    if (saved !== null) {
      await removeStoredFileMaybe(saved.publicPath);
    }
    const message = error instanceof Error ? error.message : "upload_failed";
    return NextResponse.json({ error: "upload_failed", message }, { status: 503 });
  }
}

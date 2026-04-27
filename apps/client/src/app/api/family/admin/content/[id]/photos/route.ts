import { NextResponse } from "next/server";
import { buildAdminContentMediaSummaryDto } from "../../../../../../../lib/server/admin/admin-content-media-summary";
import { FAMILY_GALLERY_MAX_PHOTOS } from "../../../../../../../lib/server/admin/photo-upload-storage";
import {
  saveGalleryPhotoFile,
  validateGalleryPhotoFile
} from "../../../../../../../lib/server/admin/photo-upload-storage";
import { removeStoredFileMaybe } from "../../../../../../../lib/server/admin/admin-media-storage";
import { requireAdminApi } from "../../../../../../../lib/server/auth/require-admin-api";
import { getFamilyPrisma } from "../../../../../../../lib/server/db";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const gate = await requireAdminApi();
  if (gate instanceof NextResponse) {
    return gate;
  }

  const { id } = await ctx.params;
  const summary = await buildAdminContentMediaSummaryDto(id);
  if (summary === null) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ item: summary });
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
    return NextResponse.json({ error: "invalid_form_data" }, { status: 400 });
  }

  const candidates = form.getAll("file").filter((x): x is File => x instanceof File);
  if (candidates.length === 0) {
    return NextResponse.json(
      { error: "file_required", message: "Adjuntá al menos un archivo en el campo file." },
      { status: 400 }
    );
  }

  const prisma = getFamilyPrisma();
  const item = await prisma.contentItem.findUnique({
    where: { id: contentItemId },
    select: { id: true, type: true }
  });
  if (item === null) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (item.type !== "photo_gallery") {
    return NextResponse.json(
      { error: "invalid_type", message: "Solo se pueden subir fotos a contenido tipo galería." },
      { status: 400 }
    );
  }

  const existingCount = await prisma.photoAsset.count({ where: { contentItemId } });
  if (existingCount + candidates.length > FAMILY_GALLERY_MAX_PHOTOS) {
    return NextResponse.json(
      {
        error: "max_photos",
        message: `Máximo ${FAMILY_GALLERY_MAX_PHOTOS} fotos por galería.`
      },
      { status: 400 }
    );
  }

  const results: Array<{ ok: true } | { ok: false; message: string; index: number }> = [];
  const savedPaths: string[] = [];
  let maxSort = 0;
  const last = await prisma.photoAsset.findFirst({
    where: { contentItemId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true }
  });
  if (last !== null) {
    maxSort = last.sortOrder;
  }

  for (let i = 0; i < candidates.length; i++) {
    const file = candidates[i]!;
    const v = validateGalleryPhotoFile(file);
    if (!v.ok) {
      results.push({ ok: false, message: v.message, index: i });
      continue;
    }
    try {
      const saved = await saveGalleryPhotoFile(file);
      savedPaths.push(saved.publicPath);
      maxSort += 1;
      await prisma.photoAsset.create({
        data: {
          contentItemId,
          filePath: saved.publicPath,
          mimeType: saved.mimeType,
          sizeBytes: saved.sizeBytes,
          sortOrder: maxSort
        }
      });
      results.push({ ok: true });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Error al guardar.";
      results.push({ ok: false, message, index: i });
    }
  }

  const summary = await buildAdminContentMediaSummaryDto(contentItemId);
  if (summary === null) {
    for (const p of savedPaths) {
      await removeStoredFileMaybe(p);
    }
    return NextResponse.json({ error: "server_error" }, { status: 503 });
  }

  const allOk = results.every((r) => r.ok);
  return NextResponse.json(
    { item: summary, uploadResults: results },
    { status: allOk ? 201 : 207 }
  );
}

import { Prisma } from "../../../../../../../../generated/prisma-family/client";
import { NextResponse } from "next/server";
import {
  removeStoredFileMaybe,
  saveUploadFile,
  validateUploadFile
} from "../../../../../../../../lib/server/admin/admin-media-storage";
import { buildAdminContentMediaSummaryDto } from "../../../../../../../../lib/server/admin/admin-content-media-summary";
import { requireAdminApi } from "../../../../../../../../lib/server/auth/require-admin-api";
import { getFamilyPrisma } from "../../../../../../../../lib/server/db";

export const runtime = "nodejs";

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

  const candidate = form.get("file");
  if (!(candidate instanceof File)) {
    return NextResponse.json({ error: "file_required", message: "Debes adjuntar el campo file." }, { status: 400 });
  }

  const validation = validateUploadFile(candidate, "poster");
  if (!validation.ok) {
    return NextResponse.json(
      { error: validation.code, message: validation.message },
      { status: 400 }
    );
  }

  let saved: Awaited<ReturnType<typeof saveUploadFile>> | null = null;
  try {
    saved = await saveUploadFile(candidate, "poster");
    const prisma = getFamilyPrisma();
    const existing = await prisma.contentItem.findUnique({
      where: { id: contentItemId },
      select: { posterPath: true }
    });
    if (existing === null) {
      await removeStoredFileMaybe(saved.publicPath);
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    const oldPosterPath = existing.posterPath;

    await prisma.contentItem.update({
      where: { id: contentItemId },
      data: { posterPath: saved.publicPath }
    });

    const summary = await buildAdminContentMediaSummaryDto(contentItemId);
    if (summary === null) {
      await removeStoredFileMaybe(saved.publicPath);
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    if (oldPosterPath !== null && oldPosterPath !== saved.publicPath) {
      await removeStoredFileMaybe(oldPosterPath);
    }

    return NextResponse.json({ item: summary }, { status: 201 });
  } catch (error) {
    if (saved !== null) {
      await removeStoredFileMaybe(saved.publicPath);
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    const message = error instanceof Error ? error.message : "upload_failed";
    return NextResponse.json({ error: "upload_failed", message }, { status: 503 });
  }
}


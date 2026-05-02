import { Prisma } from "../../../../../../../../generated/prisma-family/client";
import { NextResponse } from "next/server";
import {
  FAMILY_IMAGE_UPLOAD_MAX_BYTES,
  removeStoredFileMaybe,
  saveImageUploadFromBuffer
} from "../../../../../../../../lib/server/admin/admin-media-storage";
import { buildAdminContentMediaSummaryDto } from "../../../../../../../../lib/server/admin/admin-content-media-summary";
import { parseSingleFileMultipart } from "../../../../../../../../lib/server/admin/parse-single-file-multipart";
import { requireAdminApi } from "../../../../../../../../lib/server/auth/require-admin-api";
import { getFamilyPrisma } from "../../../../../../../../lib/server/db";

export const runtime = "nodejs";

function statusForUploadCode(code: string | undefined): number {
  if (code === "max_size_exceeded") return 413;
  if (
    code === "invalid_mime" ||
    code === "invalid_extension" ||
    code === "empty_file" ||
    code === "file_required" ||
    code === "invalid_content_type" ||
    code === "multipart_parse_error" ||
    code === "body_read_error" ||
    code === "parts_limit" ||
    code === "files_limit" ||
    code === "no_body"
  ) {
    return 400;
  }
  return 400;
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

  const parsed = await parseSingleFileMultipart(request, {
    fieldName: "file",
    maxFileBytes: FAMILY_IMAGE_UPLOAD_MAX_BYTES
  });
  if (!parsed.ok) {
    return NextResponse.json(
      { error: parsed.error, message: parsed.message },
      { status: parsed.status }
    );
  }

  let saved: Awaited<ReturnType<typeof saveImageUploadFromBuffer>> | null = null;
  try {
    saved = await saveImageUploadFromBuffer(
      parsed.buffer,
      { filename: parsed.filename, mimeType: parsed.mimeType },
      "thumbnail"
    );
    const prisma = getFamilyPrisma();
    const existing = await prisma.contentItem.findUnique({
      where: { id: contentItemId },
      select: { thumbnailPath: true }
    });
    if (existing === null) {
      await removeStoredFileMaybe(saved.publicPath);
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    const oldThumbnailPath = existing.thumbnailPath;

    await prisma.contentItem.update({
      where: { id: contentItemId },
      data: { thumbnailPath: saved.publicPath }
    });

    const summary = await buildAdminContentMediaSummaryDto(contentItemId);
    if (summary === null) {
      await removeStoredFileMaybe(saved.publicPath);
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    if (oldThumbnailPath !== null && oldThumbnailPath !== saved.publicPath) {
      await removeStoredFileMaybe(oldThumbnailPath);
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
    const stack = error instanceof Error ? error.stack : undefined;
    const code =
      error instanceof Error && "code" in error && typeof (error as NodeJS.ErrnoException).code === "string"
        ? (error as NodeJS.ErrnoException).code!
        : undefined;

    console.error("[homeflix:image-upload]", "upload_failed", {
      contentItemId,
      type: "thumbnail" as const,
      message,
      stack,
      error
    });

    const status = statusForUploadCode(code);
    return NextResponse.json(
      { error: code ?? "upload_failed", message },
      { status }
    );
  }
}

import { NextResponse } from "next/server";
import { Prisma } from "../../../../../../../../generated/prisma-family/client";
import { buildAdminContentMediaSummaryDto } from "../../../../../../../../lib/server/admin/admin-content-media-summary";
import { removeStoredFileMaybe } from "../../../../../../../../lib/server/admin/admin-media-storage";
import { requireAdminApi } from "../../../../../../../../lib/server/auth/require-admin-api";
import { getFamilyPrisma } from "../../../../../../../../lib/server/db";

export const runtime = "nodejs";

export async function DELETE(
  _request: Request,
  ctx: { params: Promise<{ id: string; photoId: string }> }
) {
  const gate = await requireAdminApi();
  if (gate instanceof NextResponse) {
    return gate;
  }

  const { id: contentItemId, photoId } = await ctx.params;

  try {
    const prisma = getFamilyPrisma();
    const item = await prisma.contentItem.findUnique({
      where: { id: contentItemId },
      select: { id: true, type: true, coverPhotoId: true }
    });
    if (item === null) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    if (item.type !== "photo_gallery") {
      return NextResponse.json({ error: "invalid_type" }, { status: 400 });
    }

    const photo = await prisma.photoAsset.findFirst({
      where: { id: photoId, contentItemId }
    });
    if (photo === null) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const filePath = photo.filePath;

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      if (item.coverPhotoId === photoId) {
        await tx.contentItem.update({
          where: { id: contentItemId },
          data: { coverPhotoId: null }
        });
      }
      await tx.photoAsset.delete({ where: { id: photoId } });
    });

    await removeStoredFileMaybe(filePath, `photo-delete:${photoId}`);

    const summary = await buildAdminContentMediaSummaryDto(contentItemId);
    if (summary === null) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json({ item: summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : "db_error";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}

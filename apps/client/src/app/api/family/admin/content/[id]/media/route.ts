import { NextResponse } from "next/server";
import type { AdminContentMediaSummaryDto } from "../../../../../../../lib/family/admin-contracts";
import { mapMediaAssetToDto } from "../../../../../../../lib/server/admin/media-asset-mapper";
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

  try {
    const prisma = getFamilyPrisma();
    const item = await prisma.contentItem.findUnique({
      where: { id },
      select: { id: true, posterPath: true, thumbnailPath: true }
    });
    if (item === null) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const video = await prisma.mediaAsset.findFirst({
      where: { contentItemId: id },
      orderBy: { updatedAt: "desc" }
    });

    const summary: AdminContentMediaSummaryDto = {
      contentItemId: item.id,
      posterPath: item.posterPath,
      thumbnailPath: item.thumbnailPath,
      videoAsset: video === null ? null : mapMediaAssetToDto(video)
    };

    return NextResponse.json({ item: summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : "db_error";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}


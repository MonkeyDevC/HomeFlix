import { NextResponse } from "next/server";
import { buildAdminContentMediaSummaryDto } from "../../../../../../../../lib/server/admin/admin-content-media-summary";
import { requireAdminApi } from "../../../../../../../../lib/server/auth/require-admin-api";
import { getFamilyPrisma } from "../../../../../../../../lib/server/db";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const gate = await requireAdminApi();
  if (gate instanceof NextResponse) {
    return gate;
  }

  const { id: contentItemId } = await ctx.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const orderedIds = (body as { orderedIds?: unknown }).orderedIds;
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return NextResponse.json({ error: "validation", message: "orderedIds debe ser un array no vacío." }, { status: 400 });
  }
  const ids = orderedIds.filter((x): x is string => typeof x === "string" && x.trim() !== "");
  if (ids.length !== orderedIds.length) {
    return NextResponse.json({ error: "validation", message: "Cada id debe ser string." }, { status: 400 });
  }

  try {
    const prisma = getFamilyPrisma();
    const item = await prisma.contentItem.findUnique({
      where: { id: contentItemId },
      select: { id: true, type: true }
    });
    if (item === null) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    if (item.type !== "photo_gallery") {
      return NextResponse.json({ error: "invalid_type" }, { status: 400 });
    }

    const existing = await prisma.photoAsset.findMany({
      where: { contentItemId },
      select: { id: true }
    });
    const set = new Set(existing.map((e) => e.id));
    if (ids.length !== set.size) {
      return NextResponse.json(
        { error: "validation", message: "La lista debe incluir exactamente todas las fotos de la galería." },
        { status: 400 }
      );
    }
    for (const id of ids) {
      if (!set.has(id)) {
        return NextResponse.json(
          { error: "validation", message: "Hay ids que no pertenecen a esta galería." },
          { status: 400 }
        );
      }
    }

    await prisma.$transaction(
      ids.map((photoId, index) =>
        prisma.photoAsset.update({
          where: { id: photoId },
          data: { sortOrder: index }
        })
      )
    );

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

import { Prisma } from "../../../../../../../generated/prisma-family/client";
import { NextResponse } from "next/server";
import type { AdminCollectionLinkDto } from "../../../../../../../lib/family/admin-contracts";
import { requireAdminApi } from "../../../../../../../lib/server/auth/require-admin-api";
import { getFamilyPrisma } from "../../../../../../../lib/server/db";

export const runtime = "nodejs";

function mapLink(r: {
  id: string;
  collectionId: string;
  position: number;
  collection: { name: string; slug: string };
}): AdminCollectionLinkDto {
  return {
    id: r.id,
    collectionId: r.collectionId,
    collectionName: r.collection.name,
    collectionSlug: r.collection.slug,
    position: r.position
  };
}

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const gate = await requireAdminApi();
  if (gate instanceof NextResponse) {
    return gate;
  }

  const { id: contentItemId } = await ctx.params;

  try {
    const prisma = getFamilyPrisma();
    const item = await prisma.contentItem.findUnique({ where: { id: contentItemId } });
    if (item === null) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const links = await prisma.contentItemCollectionLink.findMany({
      where: { contentItemId },
      orderBy: { position: "asc" },
      include: { collection: { select: { name: true, slug: true } } }
    });

    return NextResponse.json({
      links: links.map((l) =>
        mapLink({
          id: l.id,
          collectionId: l.collectionId,
          position: l.position,
          collection: l.collection
        })
      )
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "db_error";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}

export async function PUT(
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

  const linksRaw = (body as { links?: unknown }).links;
  if (!Array.isArray(linksRaw)) {
    return NextResponse.json({ error: "links_array_required" }, { status: 400 });
  }

  const parsed: { collectionId: string; position: number }[] = [];

  for (const row of linksRaw) {
    if (typeof row !== "object" || row === null) {
      return NextResponse.json({ error: "invalid_link_row" }, { status: 400 });
    }
    const collectionId = (row as { collectionId?: unknown }).collectionId;
    const position = (row as { position?: unknown }).position;
    if (typeof collectionId !== "string" || collectionId.trim() === "") {
      return NextResponse.json({ error: "invalid_collection_id" }, { status: 400 });
    }
    if (typeof position !== "number" || !Number.isInteger(position) || position < 0) {
      return NextResponse.json({ error: "invalid_position" }, { status: 400 });
    }
    parsed.push({ collectionId: collectionId.trim(), position });
  }

  const seen = new Set<string>();
  for (const p of parsed) {
    if (seen.has(p.collectionId)) {
      return NextResponse.json({ error: "duplicate_collection" }, { status: 400 });
    }
    seen.add(p.collectionId);
  }

  try {
    const prisma = getFamilyPrisma();
    const item = await prisma.contentItem.findUnique({ where: { id: contentItemId } });
    if (item === null) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const colIds = [...seen];
    const cols = await prisma.collection.findMany({
      where: { id: { in: colIds } },
      select: { id: true }
    });
    if (cols.length !== colIds.length) {
      return NextResponse.json({ error: "collection_not_found" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.contentItemCollectionLink.deleteMany({ where: { contentItemId } });
      if (parsed.length > 0) {
        await tx.contentItemCollectionLink.createMany({
          data: parsed.map((p) => ({
            contentItemId,
            collectionId: p.collectionId,
            position: p.position
          }))
        });
      }
    });

    const links = await prisma.contentItemCollectionLink.findMany({
      where: { contentItemId },
      orderBy: { position: "asc" },
      include: { collection: { select: { name: true, slug: true } } }
    });

    return NextResponse.json({
      links: links.map((l) =>
        mapLink({
          id: l.id,
          collectionId: l.collectionId,
          position: l.position,
          collection: l.collection
        })
      )
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "unique_violation" }, { status: 409 });
    }
    const message = error instanceof Error ? error.message : "db_error";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}

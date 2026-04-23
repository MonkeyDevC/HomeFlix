import { Prisma } from "../../../../../../generated/prisma-family/client";
import { NextResponse } from "next/server";
import type { AdminContentItemDetailDto } from "../../../../../../lib/family/admin-contracts";
import {
  assertContentType,
  assertEditorialStatus,
  assertReleaseScope,
  assertValidSlug,
  assertVisibility,
  optionalMaturityRating,
  optionalPositiveInt,
  optionalTrimmedString
} from "../../../../../../lib/server/admin/admin-validation";
import { requireAdminApi } from "../../../../../../lib/server/auth/require-admin-api";
import { getFamilyPrisma } from "../../../../../../lib/server/db";

export const runtime = "nodejs";

function mapDetail(c: {
  id: string;
  slug: string;
  title: string;
  synopsis: string | null;
  editorialStatus: string;
  releaseScope: string;
  visibility: string;
  type: string;
  thumbnailPath: string | null;
  posterPath: string | null;
  categoryId: string | null;
  releaseYear: number | null;
  maturityRating: string | null;
  seasonNumber: number | null;
  episodeNumber: number | null;
  createdAt: Date;
  updatedAt: Date;
}): AdminContentItemDetailDto {
  return {
    id: c.id,
    slug: c.slug,
    title: c.title,
    synopsis: c.synopsis,
    editorialStatus: c.editorialStatus,
    releaseScope: c.releaseScope,
    visibility: c.visibility,
    type: c.type,
    thumbnailPath: c.thumbnailPath,
    posterPath: c.posterPath,
    categoryId: c.categoryId,
    releaseYear: c.releaseYear,
    maturityRating: c.maturityRating,
    seasonNumber: c.seasonNumber,
    episodeNumber: c.episodeNumber,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString()
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

  const { id } = await ctx.params;

  try {
    const prisma = getFamilyPrisma();
    const row = await prisma.contentItem.findUnique({ where: { id } });

    if (row === null) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    return NextResponse.json({ item: mapDetail(row) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "db_error";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const gate = await requireAdminApi();
  if (gate instanceof NextResponse) {
    return gate;
  }

  const { id } = await ctx.params;
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const data: Record<string, string | number | null> = {};

  if ((body as { slug?: unknown }).slug !== undefined) {
    const s = (body as { slug: unknown }).slug;
    if (typeof s !== "string") {
      return NextResponse.json({ error: "validation", message: "Slug inválido." }, { status: 400 });
    }
    const err = assertValidSlug(s);
    if (err !== null) {
      return NextResponse.json({ error: "validation", message: err }, { status: 400 });
    }
    data.slug = s.trim().toLowerCase();
  }

  if ((body as { title?: unknown }).title !== undefined) {
    const t = optionalTrimmedString((body as { title: unknown }).title, 300);
    if (!t.ok || t.value === null || t.value.length < 1) {
      return NextResponse.json({ error: "validation", message: "Título inválido." }, { status: 400 });
    }
    data.title = t.value;
  }

  if ((body as { synopsis?: unknown }).synopsis !== undefined) {
    const s = optionalTrimmedString((body as { synopsis: unknown }).synopsis, 8000);
    if (!s.ok) {
      return NextResponse.json({ error: "validation", message: s.error }, { status: 400 });
    }
    data.synopsis = s.value;
  }

  if ((body as { editorialStatus?: unknown }).editorialStatus !== undefined) {
    const e = (body as { editorialStatus: unknown }).editorialStatus;
    if (typeof e !== "string") {
      return NextResponse.json({ error: "validation", message: "editorialStatus inválido." }, { status: 400 });
    }
    const err = assertEditorialStatus(e);
    if (err !== null) {
      return NextResponse.json({ error: "validation", message: err }, { status: 400 });
    }
    data.editorialStatus = e;
  }

  if ((body as { releaseScope?: unknown }).releaseScope !== undefined) {
    const r = (body as { releaseScope: unknown }).releaseScope;
    if (typeof r !== "string") {
      return NextResponse.json({ error: "validation", message: "releaseScope inválido." }, { status: 400 });
    }
    const err = assertReleaseScope(r.trim());
    if (err !== null) {
      return NextResponse.json({ error: "validation", message: err }, { status: 400 });
    }
    data.releaseScope = r.trim();
  }

  if ((body as { visibility?: unknown }).visibility !== undefined) {
    const v = (body as { visibility: unknown }).visibility;
    if (typeof v !== "string") {
      return NextResponse.json({ error: "validation", message: "visibility inválida." }, { status: 400 });
    }
    const err = assertVisibility(v);
    if (err !== null) {
      return NextResponse.json({ error: "validation", message: err }, { status: 400 });
    }
    data.visibility = v;
  }

  if ((body as { type?: unknown }).type !== undefined) {
    const t = (body as { type: unknown }).type;
    if (typeof t !== "string") {
      return NextResponse.json({ error: "validation", message: "type inválido." }, { status: 400 });
    }
    const err = assertContentType(t);
    if (err !== null) {
      return NextResponse.json({ error: "validation", message: err }, { status: 400 });
    }
    data.type = t;
  }

  if ((body as { thumbnailPath?: unknown }).thumbnailPath !== undefined) {
    const th = optionalTrimmedString((body as { thumbnailPath: unknown }).thumbnailPath, 500);
    if (!th.ok) {
      return NextResponse.json({ error: "validation", message: th.error }, { status: 400 });
    }
    data.thumbnailPath = th.value;
  }

  if ((body as { posterPath?: unknown }).posterPath !== undefined) {
    const po = optionalTrimmedString((body as { posterPath: unknown }).posterPath, 500);
    if (!po.ok) {
      return NextResponse.json({ error: "validation", message: po.error }, { status: 400 });
    }
    data.posterPath = po.value;
  }

  if ((body as { categoryId?: unknown }).categoryId !== undefined) {
    const c = (body as { categoryId: unknown }).categoryId;
    if (c === null) {
      data.categoryId = null;
    } else if (typeof c === "string" && c.trim() === "") {
      data.categoryId = null;
    } else if (typeof c === "string") {
      data.categoryId = c.trim();
    } else {
      return NextResponse.json({ error: "validation", message: "categoryId inválido." }, { status: 400 });
    }
  }

  if ((body as { releaseYear?: unknown }).releaseYear !== undefined) {
    const r = optionalPositiveInt((body as { releaseYear: unknown }).releaseYear, {
      min: 1888,
      max: 2100,
      label: "Año"
    });
    if (!r.ok) {
      return NextResponse.json({ error: "validation", message: r.error }, { status: 400 });
    }
    data.releaseYear = r.value;
  }

  if ((body as { maturityRating?: unknown }).maturityRating !== undefined) {
    const m = optionalMaturityRating((body as { maturityRating: unknown }).maturityRating);
    if (!m.ok) {
      return NextResponse.json({ error: "validation", message: m.error }, { status: 400 });
    }
    data.maturityRating = m.value;
  }

  if ((body as { seasonNumber?: unknown }).seasonNumber !== undefined) {
    const s = optionalPositiveInt((body as { seasonNumber: unknown }).seasonNumber, {
      min: 1,
      max: 999,
      label: "Temporada"
    });
    if (!s.ok) {
      return NextResponse.json({ error: "validation", message: s.error }, { status: 400 });
    }
    data.seasonNumber = s.value;
  }

  if ((body as { episodeNumber?: unknown }).episodeNumber !== undefined) {
    const e = optionalPositiveInt((body as { episodeNumber: unknown }).episodeNumber, {
      min: 1,
      max: 9999,
      label: "Número de episodio"
    });
    if (!e.ok) {
      return NextResponse.json({ error: "validation", message: e.error }, { status: 400 });
    }
    data.episodeNumber = e.value;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "no_fields" }, { status: 400 });
  }

  try {
    const prisma = getFamilyPrisma();

    if (typeof data.categoryId === "string") {
      const cat = await prisma.category.findUnique({ where: { id: data.categoryId } });
      if (cat === null) {
        return NextResponse.json({ error: "category_not_found" }, { status: 400 });
      }
    }

    const updated = await prisma.contentItem.update({
      where: { id },
      data: data as Prisma.ContentItemUncheckedUpdateInput
    });
    return NextResponse.json({ item: mapDetail(updated) });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "slug_taken" }, { status: 409 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return NextResponse.json({ error: "conflict_dependency" }, { status: 409 });
    }
    const message = error instanceof Error ? error.message : "db_error";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}

export async function DELETE(
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
    await prisma.contentItem.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return NextResponse.json({ error: "conflict_dependency" }, { status: 409 });
    }
    const message = error instanceof Error ? error.message : "db_error";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}

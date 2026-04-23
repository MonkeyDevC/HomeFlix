import { Prisma } from "../../../../../generated/prisma-family/client";
import { NextResponse } from "next/server";
import type { AdminContentItemListDto } from "../../../../../lib/family/admin-contracts";
import { buildAdminSlugCandidate, ensureUniqueAdminSlug } from "../../../../../lib/server/admin/admin-slugs";
import {
  assertContentType,
  assertEditorialStatus,
  assertReleaseScope,
  assertValidSlug,
  assertVisibility,
  optionalMaturityRating,
  optionalPositiveInt,
  optionalTrimmedString
} from "../../../../../lib/server/admin/admin-validation";
import { requireAdminApi } from "../../../../../lib/server/auth/require-admin-api";
import { getFamilyPrisma } from "../../../../../lib/server/db";

export const runtime = "nodejs";

function mapListItem(c: {
  id: string;
  slug: string;
  title: string;
  editorialStatus: string;
  releaseScope: string;
  visibility: string;
  type: string;
  categoryId: string | null;
  updatedAt: Date;
  _count: { accessGrants: number };
}): AdminContentItemListDto {
  return {
    id: c.id,
    slug: c.slug,
    title: c.title,
    editorialStatus: c.editorialStatus,
    releaseScope: c.releaseScope,
    visibility: c.visibility,
    type: c.type,
    categoryId: c.categoryId,
    updatedAt: c.updatedAt.toISOString(),
    accessCount: c._count.accessGrants
  };
}

export async function GET() {
  const gate = await requireAdminApi();
  if (gate instanceof NextResponse) {
    return gate;
  }

  try {
    const prisma = getFamilyPrisma();
    const rows = await prisma.contentItem.findMany({
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { accessGrants: true } } }
    });
    return NextResponse.json({ items: rows.map(mapListItem) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "db_error";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const gate = await requireAdminApi();
  if (gate instanceof NextResponse) {
    return gate;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const slugRaw = (body as { slug?: unknown }).slug;
  const titleRaw = (body as { title?: unknown }).title;

  if (typeof titleRaw !== "string") {
    return NextResponse.json({ error: "title_required" }, { status: 400 });
  }

  const titleOk = optionalTrimmedString(titleRaw, 300);
  if (!titleOk.ok || titleOk.value === null || titleOk.value.length < 1) {
    return NextResponse.json({ error: "validation", message: "Título obligatorio." }, { status: 400 });
  }

  const hasExplicitSlug = typeof slugRaw === "string" && slugRaw.trim() !== "";
  if (hasExplicitSlug) {
    const slugErr = assertValidSlug(slugRaw as string);
    if (slugErr !== null) {
      return NextResponse.json({ error: "validation", message: slugErr }, { status: 400 });
    }
  }

  const synopsisOk = optionalTrimmedString((body as { synopsis?: unknown }).synopsis, 8000);
  if (!synopsisOk.ok) {
    return NextResponse.json({ error: "validation", message: synopsisOk.error }, { status: 400 });
  }

  const editorialRaw =
    typeof (body as { editorialStatus?: unknown }).editorialStatus === "string"
      ? (body as { editorialStatus: string }).editorialStatus
      : "draft";
  const edErr = assertEditorialStatus(editorialRaw);
  if (edErr !== null) {
    return NextResponse.json({ error: "validation", message: edErr }, { status: 400 });
  }

  const visibility =
    typeof (body as { visibility?: unknown }).visibility === "string"
      ? (body as { visibility: string }).visibility
      : "private";
  const visErr = assertVisibility(visibility);
  if (visErr !== null) {
    return NextResponse.json({ error: "validation", message: visErr }, { status: 400 });
  }

  const type =
    typeof (body as { type?: unknown }).type === "string" ? (body as { type: string }).type : "movie";
  const typeErr = assertContentType(type);
  if (typeErr !== null) {
    return NextResponse.json({ error: "validation", message: typeErr }, { status: 400 });
  }

  const thumbOk = optionalTrimmedString((body as { thumbnailPath?: unknown }).thumbnailPath, 500);
  const posterOk = optionalTrimmedString((body as { posterPath?: unknown }).posterPath, 500);
  if (!thumbOk.ok) {
    return NextResponse.json({ error: "validation", message: thumbOk.error }, { status: 400 });
  }
  if (!posterOk.ok) {
    return NextResponse.json({ error: "validation", message: posterOk.error }, { status: 400 });
  }

  let categoryId: string | null = null;
  if ((body as { categoryId?: unknown }).categoryId !== undefined) {
    const c = (body as { categoryId: unknown }).categoryId;
    if (c === null) {
      categoryId = null;
    } else if (typeof c === "string" && c.trim() !== "") {
      categoryId = c.trim();
    }
  }

  const releaseYearOk = optionalPositiveInt((body as { releaseYear?: unknown }).releaseYear, {
    min: 1888,
    max: 2100,
    label: "Año"
  });
  if (!releaseYearOk.ok) {
    return NextResponse.json({ error: "validation", message: releaseYearOk.error }, { status: 400 });
  }

  const maturityOk = optionalMaturityRating((body as { maturityRating?: unknown }).maturityRating);
  if (!maturityOk.ok) {
    return NextResponse.json({ error: "validation", message: maturityOk.error }, { status: 400 });
  }

  const seasonOk = optionalPositiveInt((body as { seasonNumber?: unknown }).seasonNumber, {
    min: 1,
    max: 999,
    label: "Temporada"
  });
  if (!seasonOk.ok) {
    return NextResponse.json({ error: "validation", message: seasonOk.error }, { status: 400 });
  }

  const episodeOk = optionalPositiveInt((body as { episodeNumber?: unknown }).episodeNumber, {
    min: 1,
    max: 9999,
    label: "Número de episodio"
  });
  if (!episodeOk.ok) {
    return NextResponse.json({ error: "validation", message: episodeOk.error }, { status: 400 });
  }

  const releaseScopeRaw =
    typeof (body as { releaseScope?: unknown }).releaseScope === "string"
      ? (body as { releaseScope: string }).releaseScope.trim()
      : "public_catalog";
  const rsErr = assertReleaseScope(releaseScopeRaw);
  if (rsErr !== null) {
    return NextResponse.json({ error: "validation", message: rsErr }, { status: 400 });
  }

  try {
    const prisma = getFamilyPrisma();

    if (categoryId !== null) {
      const cat = await prisma.category.findUnique({ where: { id: categoryId } });
      if (cat === null) {
        return NextResponse.json({ error: "category_not_found" }, { status: 400 });
      }
    }

    const baseSlug = buildAdminSlugCandidate(titleOk.value, hasExplicitSlug ? (slugRaw as string) : null);
    const finalSlug = hasExplicitSlug
      ? baseSlug
      : await ensureUniqueAdminSlug(baseSlug, async (candidate) => {
          const existing = await prisma.contentItem.findUnique({ where: { slug: candidate }, select: { id: true } });
          return existing !== null;
        });

    const data: Prisma.ContentItemUncheckedCreateInput = {
      slug: finalSlug,
      title: titleOk.value,
      synopsis: synopsisOk.value,
      editorialStatus: editorialRaw,
      releaseScope: releaseScopeRaw,
      visibility,
      type,
      thumbnailPath: thumbOk.value,
      posterPath: posterOk.value,
      releaseYear: releaseYearOk.value,
      maturityRating: maturityOk.value,
      seasonNumber: seasonOk.value,
      episodeNumber: episodeOk.value
    };
    if (categoryId !== null) {
      data.categoryId = categoryId;
    }

    const created = await prisma.contentItem.create({
      data,
      include: { _count: { select: { accessGrants: true } } }
    });

    return NextResponse.json({ item: mapListItem(created) }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "slug_taken" }, { status: 409 });
    }
    const message = error instanceof Error ? error.message : "db_error";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}

import { Prisma } from "../../../../../generated/prisma-family/client";
import { NextResponse } from "next/server";
import type { AdminCategoryDto } from "../../../../../lib/family/admin-contracts";
import { buildAdminSlugCandidate, ensureUniqueAdminSlug } from "../../../../../lib/server/admin/admin-slugs";
import { assertValidSlug, optionalTrimmedString } from "../../../../../lib/server/admin/admin-validation";
import { requireAdminApi } from "../../../../../lib/server/auth/require-admin-api";
import { getFamilyPrisma } from "../../../../../lib/server/db";

export const runtime = "nodejs";

function mapCategory(c: {
  id: string;
  slug: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}): AdminCategoryDto {
  return {
    id: c.id,
    slug: c.slug,
    name: c.name,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString()
  };
}

export async function GET() {
  const gate = await requireAdminApi();
  if (gate instanceof NextResponse) {
    return gate;
  }

  try {
    const prisma = getFamilyPrisma();
    const rows = await prisma.category.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json({ items: rows.map(mapCategory) });
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
  const nameRaw = (body as { name?: unknown }).name;

  if (typeof nameRaw !== "string") {
    return NextResponse.json({ error: "name_required" }, { status: 400 });
  }

  const nameOk = optionalTrimmedString(nameRaw, 200);
  if (!nameOk.ok || nameOk.value === null || nameOk.value.length < 1) {
    return NextResponse.json({ error: "validation", message: "Nombre obligatorio." }, { status: 400 });
  }

  const hasExplicitSlug = typeof slugRaw === "string" && slugRaw.trim() !== "";
  if (hasExplicitSlug) {
    const slugErr = assertValidSlug(slugRaw as string);
    if (slugErr !== null) {
      return NextResponse.json({ error: "validation", message: slugErr }, { status: 400 });
    }
  }

  try {
    const prisma = getFamilyPrisma();
    const baseSlug = buildAdminSlugCandidate(nameOk.value, hasExplicitSlug ? (slugRaw as string) : null);
    const finalSlug = hasExplicitSlug
      ? baseSlug
      : await ensureUniqueAdminSlug(baseSlug, async (candidate) => {
          const existing = await prisma.category.findUnique({ where: { slug: candidate }, select: { id: true } });
          return existing !== null;
        });

    const created = await prisma.category.create({
      data: {
        slug: finalSlug,
        name: nameOk.value
      }
    });
    return NextResponse.json({ item: mapCategory(created) }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "slug_taken" }, { status: 409 });
    }
    const message = error instanceof Error ? error.message : "db_error";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}

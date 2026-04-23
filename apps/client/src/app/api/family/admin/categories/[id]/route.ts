import { Prisma } from "../../../../../../generated/prisma-family/client";
import { NextResponse } from "next/server";
import { assertValidSlug, optionalTrimmedString } from "../../../../../../lib/server/admin/admin-validation";
import { requireAdminApi } from "../../../../../../lib/server/auth/require-admin-api";
import { getFamilyPrisma } from "../../../../../../lib/server/db";
import type { AdminCategoryDto } from "../../../../../../lib/family/admin-contracts";

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
    const row = await prisma.category.findUnique({ where: { id } });

    if (row === null) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    return NextResponse.json({ item: mapCategory(row) });
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

  const data: { slug?: string; name?: string } = {};

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

  if ((body as { name?: unknown }).name !== undefined) {
    const n = optionalTrimmedString((body as { name: unknown }).name, 200);
    if (!n.ok || n.value === null || n.value.length < 1) {
      return NextResponse.json({ error: "validation", message: "Nombre inválido." }, { status: 400 });
    }
    data.name = n.value;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "no_fields" }, { status: 400 });
  }

  try {
    const prisma = getFamilyPrisma();
    const updated = await prisma.category.update({
      where: { id },
      data
    });
    return NextResponse.json({ item: mapCategory(updated) });
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
    await prisma.category.delete({ where: { id } });
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

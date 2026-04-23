import { Prisma } from "../../../../../../../generated/prisma-family/client";
import { NextResponse } from "next/server";
import type { AdminProfileAccessDto } from "../../../../../../../lib/family/admin-contracts";
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

  const { id: contentItemId } = await ctx.params;

  try {
    const prisma = getFamilyPrisma();
    const item = await prisma.contentItem.findUnique({ where: { id: contentItemId } });
    if (item === null) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const rows = await prisma.profileContentAccess.findMany({
      where: { contentItemId },
      include: {
        profile: {
          select: {
            displayName: true,
            userId: true,
            user: { select: { email: true } }
          }
        }
      }
    });

    const grants: AdminProfileAccessDto[] = rows.map((r) => ({
      profileId: r.profileId,
      displayName: r.profile.displayName,
      userId: r.profile.userId,
      userEmail: r.profile.user.email
    }));

    return NextResponse.json({ grants });
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

  const idsRaw = (body as { profileIds?: unknown }).profileIds;
  if (!Array.isArray(idsRaw)) {
    return NextResponse.json({ error: "profile_ids_array_required" }, { status: 400 });
  }

  const profileIds: string[] = [];
  for (const x of idsRaw) {
    if (typeof x !== "string" || x.trim() === "") {
      return NextResponse.json({ error: "invalid_profile_id" }, { status: 400 });
    }
    profileIds.push(x.trim());
  }

  const unique = [...new Set(profileIds)];

  try {
    const prisma = getFamilyPrisma();
    const item = await prisma.contentItem.findUnique({ where: { id: contentItemId } });
    if (item === null) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    if (unique.length > 0) {
      const found = await prisma.profile.findMany({
        where: { id: { in: unique } },
        select: { id: true }
      });
      if (found.length !== unique.length) {
        return NextResponse.json({ error: "profile_not_found" }, { status: 400 });
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.profileContentAccess.deleteMany({ where: { contentItemId } });
      if (unique.length > 0) {
        await tx.profileContentAccess.createMany({
          data: unique.map((profileId) => ({
            profileId,
            contentItemId
          }))
        });
      }
    });

    const rows = await prisma.profileContentAccess.findMany({
      where: { contentItemId },
      include: {
        profile: {
          select: {
            displayName: true,
            userId: true,
            user: { select: { email: true } }
          }
        }
      }
    });

    const grants: AdminProfileAccessDto[] = rows.map((r) => ({
      profileId: r.profileId,
      displayName: r.profile.displayName,
      userId: r.profile.userId,
      userEmail: r.profile.user.email
    }));

    return NextResponse.json({ grants });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "unique_violation" }, { status: 409 });
    }
    const message = error instanceof Error ? error.message : "db_error";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}

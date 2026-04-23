import { Prisma } from "../../../../../generated/prisma-family/client";
import { NextResponse } from "next/server";
import type { AdminUserSummaryDto } from "../../../../../lib/family/admin-contracts";
import {
  parseAdminEmail,
  parseAdminPassword,
  parseAdminUserRole
} from "../../../../../lib/server/admin/admin-validation";
import { requireAdminApi } from "../../../../../lib/server/auth/require-admin-api";
import { hashFamilyPassword } from "../../../../../lib/server/auth/password-family";
import { getFamilyPrisma } from "../../../../../lib/server/db";

export const runtime = "nodejs";

const DEFAULT_PROFILES = ["Principal", "Niños"] as const;

function mapUser(row: {
  id: string;
  email: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
  _count: { profiles: number };
}): AdminUserSummaryDto {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    profileCount: row._count.profiles,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

export async function GET() {
  const gate = await requireAdminApi();
  if (gate instanceof NextResponse) {
    return gate;
  }

  try {
    const prisma = getFamilyPrisma();
    const rows = await prisma.user.findMany({
      orderBy: { email: "asc" },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { profiles: true } }
      }
    });
    return NextResponse.json({ items: rows.map(mapUser) });
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

  const rec = body as Record<string, unknown>;
  const emailRes = parseAdminEmail(rec.email);
  if (!emailRes.ok) {
    return NextResponse.json({ error: "validation", message: emailRes.error }, { status: 400 });
  }

  const passRes = parseAdminPassword(rec.password, true);
  if (!passRes.ok || passRes.password === null) {
    return NextResponse.json(
      { error: "validation", message: passRes.ok ? "Contraseña obligatoria." : passRes.error },
      { status: 400 }
    );
  }

  const roleRes = parseAdminUserRole(rec.role, "family_viewer");
  if (!roleRes.ok) {
    return NextResponse.json({ error: "validation", message: roleRes.error }, { status: 400 });
  }

  const withProfiles =
    rec.withDefaultProfiles === undefined
      ? true
      : rec.withDefaultProfiles === true || rec.withDefaultProfiles === "true";

  try {
    const prisma = getFamilyPrisma();
    const passwordHash = await hashFamilyPassword(passRes.password);

    const created = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: emailRes.email,
          passwordHash,
          role: roleRes.role
        },
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { profiles: true } }
        }
      });

      if (withProfiles) {
        await tx.profile.createMany({
          data: DEFAULT_PROFILES.map((displayName) => ({
            userId: user.id,
            displayName
          }))
        });
        const withCounts = await tx.user.findUniqueOrThrow({
          where: { id: user.id },
          select: {
            id: true,
            email: true,
            role: true,
            createdAt: true,
            updatedAt: true,
            _count: { select: { profiles: true } }
          }
        });
        return withCounts;
      }

      return user;
    });

    return NextResponse.json({ item: mapUser(created) }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "email_taken" }, { status: 409 });
    }
    const message = error instanceof Error ? error.message : "db_error";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}

import { Prisma, type PrismaClient } from "../../../../../../generated/prisma-family/client";
import { NextResponse } from "next/server";
import type { AdminUserDetailDto } from "../../../../../../lib/family/admin-contracts";
import { parseAdminEmail, parseAdminPassword } from "../../../../../../lib/server/admin/admin-validation";
import { requireAdminApi } from "../../../../../../lib/server/auth/require-admin-api";
import { hashFamilyPassword } from "../../../../../../lib/server/auth/password-family";
import { getFamilyPrisma } from "../../../../../../lib/server/db";

export const runtime = "nodejs";

function mapDetail(u: {
  id: string;
  email: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}): AdminUserDetailDto {
  return {
    id: u.id,
    email: u.email,
    role: u.role,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString()
  };
}

async function countAdmins(prisma: PrismaClient): Promise<number> {
  return prisma.user.count({ where: { role: "admin" } });
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
    const row = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, role: true, createdAt: true, updatedAt: true }
    });

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

  const rec = body as Record<string, unknown>;
  const data: { email?: string; passwordHash?: string; role?: "admin" | "family_viewer" } = {};

  if (rec.email !== undefined) {
    const emailRes = parseAdminEmail(rec.email);
    if (!emailRes.ok) {
      return NextResponse.json({ error: "validation", message: emailRes.error }, { status: 400 });
    }
    data.email = emailRes.email;
  }

  if (rec.password !== undefined) {
    const passRes = parseAdminPassword(rec.password, false);
    if (!passRes.ok) {
      return NextResponse.json({ error: "validation", message: passRes.error }, { status: 400 });
    }
    if (passRes.password !== null) {
      data.passwordHash = await hashFamilyPassword(passRes.password);
    }
  }

  if (rec.role !== undefined) {
    if (typeof rec.role !== "string") {
      return NextResponse.json({ error: "validation", message: "Rol inválido." }, { status: 400 });
    }
    const r = rec.role.trim();
    if (r !== "admin" && r !== "family_viewer") {
      return NextResponse.json(
        { error: "validation", message: "Rol debe ser admin o family_viewer." },
        { status: 400 }
      );
    }
    data.role = r;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "no_fields" }, { status: 400 });
  }

  try {
    const prisma = getFamilyPrisma();
    const existing = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true }
    });

    if (existing === null) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    if (data.role !== undefined && existing.role === "admin" && data.role === "family_viewer") {
      const admins = await countAdmins(prisma);
      if (admins <= 1) {
        return NextResponse.json(
          { error: "last_admin", message: "Debe existir al menos un usuario administrador." },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, email: true, role: true, createdAt: true, updatedAt: true }
    });
    return NextResponse.json({ item: mapDetail(updated) });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "email_taken" }, { status: 409 });
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

  if (id === gate.id) {
    return NextResponse.json(
      { error: "cannot_delete_self", message: "No puedes eliminar tu propia cuenta desde aquí." },
      { status: 400 }
    );
  }

  try {
    const prisma = getFamilyPrisma();
    const target = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true }
    });

    if (target === null) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    if (target.role === "admin") {
      const admins = await countAdmins(prisma);
      if (admins <= 1) {
        return NextResponse.json(
          { error: "last_admin", message: "No se puede eliminar el único administrador." },
          { status: 409 }
        );
      }
    }

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    const message = error instanceof Error ? error.message : "db_error";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}

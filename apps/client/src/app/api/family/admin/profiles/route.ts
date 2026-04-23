import { NextResponse } from "next/server";
import type { AdminProfileOptionDto } from "../../../../../lib/family/admin-contracts";
import { requireAdminApi } from "../../../../../lib/server/auth/require-admin-api";
import { getFamilyPrisma } from "../../../../../lib/server/db";

export const runtime = "nodejs";

export async function GET() {
  const gate = await requireAdminApi();
  if (gate instanceof NextResponse) {
    return gate;
  }

  try {
    const prisma = getFamilyPrisma();
    const rows = await prisma.profile.findMany({
      orderBy: [{ displayName: "asc" }],
      select: {
        id: true,
        displayName: true,
        userId: true,
        user: { select: { email: true } }
      }
    });
    const items: AdminProfileOptionDto[] = rows.map((p) => ({
      id: p.id,
      displayName: p.displayName,
      userId: p.userId,
      userEmail: p.user.email
    }));
    return NextResponse.json({ items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "db_error";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}

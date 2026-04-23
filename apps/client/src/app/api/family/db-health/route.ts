import { NextResponse } from "next/server";
import { requireAdminApi } from "../../../../lib/server/auth/require-admin-api";
import { getFamilyPrisma } from "../../../../lib/server/db";
import { serviceUnavailableResponse } from "../../../../lib/server/http/family-api-errors";

export const runtime = "nodejs";

/**
 * Comprueba conectividad Prisma → PostgreSQL para el esquema Family (`family_v1`).
 */
export async function GET() {
  const gate = await requireAdminApi();
  if (gate instanceof NextResponse) {
    return gate;
  }

  try {
    const prisma = getFamilyPrisma();
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, prisma: "family_v1" });
  } catch (error) {
    return serviceUnavailableResponse(error);
  }
}

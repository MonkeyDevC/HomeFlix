import { NextResponse } from "next/server";
import { getActiveProfileSummary } from "../../../../../lib/server/auth/active-profile";
import { getFamilySession } from "../../../../../lib/server/auth/get-family-session";
import { getFamilyPrisma } from "../../../../../lib/server/db";
import type { FamilyMeResponse } from "../../../../../lib/family/auth-contracts";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getFamilySession();

    if (session === null) {
      return NextResponse.json(
        { ok: false, error: "unauthorized" } satisfies FamilyMeResponse,
        { status: 401 }
      );
    }

    const prisma = getFamilyPrisma();
    const profiles = await prisma.profile.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: "asc" },
      select: { id: true, displayName: true, avatarKey: true }
    });

    const active = await getActiveProfileSummary();

    return NextResponse.json({
      ok: true,
      user: session,
      profiles: profiles.map((p) => ({
        id: p.id,
        displayName: p.displayName,
        avatarKey: p.avatarKey
      })),
      activeProfile:
        active === null
          ? null
          : {
              profileId: active.profileId,
              userId: active.userId,
              displayName: active.displayName,
              avatarKey: active.avatarKey
            }
    } satisfies FamilyMeResponse);
  } catch {
    return NextResponse.json({ ok: false, error: "server_error" } satisfies FamilyMeResponse, {
      status: 503
    });
  }
}

import { NextResponse } from "next/server";
import { getFamilySession } from "../../../../../lib/server/auth/get-family-session";
import { getFamilyPrisma } from "../../../../../lib/server/db";
import { clearedFamilyCookieOptions, familyAuthCookieOptions } from "../../../../../lib/server/session/cookie-options";
import { FAMILY_PROFILE_COOKIE } from "../../../../../lib/server/session/family-cookies";
import { signFamilyProfileToken } from "../../../../../lib/server/session/family-jwt";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getFamilySession();

  if (session === null) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const profileId =
    typeof (body as { profileId?: unknown }).profileId === "string"
      ? (body as { profileId: string }).profileId.trim()
      : "";

  if (profileId === "") {
    return NextResponse.json({ error: "invalid_profile_id" }, { status: 400 });
  }

  try {
    const prisma = getFamilyPrisma();
    const profile = await prisma.profile.findFirst({
      where: { id: profileId, userId: session.id },
      select: { id: true, userId: true, displayName: true, avatarKey: true }
    });

    if (profile === null) {
      return NextResponse.json({ error: "profile_not_found" }, { status: 404 });
    }

    const token = await signFamilyProfileToken({ sub: session.id, pid: profile.id });
    const res = NextResponse.json({
      ok: true,
      activeProfile: {
        profileId: profile.id,
        userId: profile.userId,
        displayName: profile.displayName,
        avatarKey: profile.avatarKey
      }
    });
    res.cookies.set(FAMILY_PROFILE_COOKIE, token, familyAuthCookieOptions());
    return res;
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_error";
    return NextResponse.json({ error: "server_error", message }, { status: 503 });
  }
}

export async function DELETE() {
  const session = await getFamilySession();

  if (session === null) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(FAMILY_PROFILE_COOKIE, "", clearedFamilyCookieOptions());
  return res;
}

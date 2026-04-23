import { NextResponse } from "next/server";
import { verifyFamilyPassword } from "../../../../../lib/server/auth/password-family";
import { getFamilyPrisma } from "../../../../../lib/server/db";
import { clearedFamilyCookieOptions, familyAuthCookieOptions } from "../../../../../lib/server/session/cookie-options";
import { FAMILY_PROFILE_COOKIE, FAMILY_SESSION_COOKIE } from "../../../../../lib/server/session/family-cookies";
import { signFamilySessionToken } from "../../../../../lib/server/session/family-jwt";
import type { FamilyLoginRequest, FamilyLoginResponse } from "../../../../../lib/family/auth-contracts";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_credentials" } satisfies FamilyLoginResponse,
      { status: 400 }
    );
  }

  const parsed = body as Partial<FamilyLoginRequest>;
  const email = typeof parsed.email === "string" ? parsed.email.trim().toLowerCase() : "";
  const password = typeof parsed.password === "string" ? parsed.password : "";

  if (email === "" || password === "") {
    return NextResponse.json(
      { ok: false, error: "invalid_credentials" } satisfies FamilyLoginResponse,
      { status: 400 }
    );
  }

  try {
    const prisma = getFamilyPrisma();
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        role: true
      }
    });

    if (user === null) {
      return NextResponse.json(
        { ok: false, error: "invalid_credentials" } satisfies FamilyLoginResponse,
        { status: 401 }
      );
    }

    const valid = await verifyFamilyPassword(password, user.passwordHash);

    if (!valid) {
      return NextResponse.json(
        { ok: false, error: "invalid_credentials" } satisfies FamilyLoginResponse,
        { status: 401 }
      );
    }

    const role = user.role === "admin" ? "admin" : "family_viewer";
    const token = await signFamilySessionToken({
      sub: user.id,
      email: user.email,
      role
    });

    const profiles = await prisma.profile.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
      select: { id: true, displayName: true, avatarKey: true }
    });

    const res = NextResponse.json({
      ok: true,
      user: { id: user.id, email: user.email, role },
      profiles: profiles.map((p) => ({
        id: p.id,
        displayName: p.displayName,
        avatarKey: p.avatarKey
      })),
      mustSelectProfile: profiles.length > 0
    } satisfies FamilyLoginResponse);

    const opts = familyAuthCookieOptions();
    res.cookies.set(FAMILY_SESSION_COOKIE, token, opts);
    res.cookies.set(FAMILY_PROFILE_COOKIE, "", clearedFamilyCookieOptions());

    return res;
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_error";
    return NextResponse.json(
      { ok: false, error: "server_error", message } satisfies FamilyLoginResponse,
      { status: 503 }
    );
  }
}

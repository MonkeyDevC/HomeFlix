import { NextResponse } from "next/server";
import { clearedFamilyCookieOptions } from "../../../../../lib/server/session/cookie-options";
import { FAMILY_PROFILE_COOKIE, FAMILY_SESSION_COOKIE } from "../../../../../lib/server/session/family-cookies";

export const runtime = "nodejs";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  const clear = clearedFamilyCookieOptions();
  res.cookies.set(FAMILY_SESSION_COOKIE, "", clear);
  res.cookies.set(FAMILY_PROFILE_COOKIE, "", clear);
  return res;
}

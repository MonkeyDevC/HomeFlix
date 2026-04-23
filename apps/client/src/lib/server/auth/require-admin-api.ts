import { NextResponse } from "next/server";
import { getFamilySession, type FamilySessionUser } from "./get-family-session";

/**
 * Guard para route handlers `/api/family/admin/*`.
 */
export async function requireAdminApi():
  Promise<FamilySessionUser | NextResponse> {
  const user = await getFamilySession();

  if (user === null) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (user.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  return user;
}

export function isAdminResult(
  u: FamilySessionUser | NextResponse
): u is FamilySessionUser {
  return !(u instanceof NextResponse);
}

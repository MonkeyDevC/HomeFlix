import { cookies } from "next/headers";
import { FAMILY_SESSION_COOKIE } from "../session/family-cookies";
import { verifyFamilySessionToken } from "../session/family-jwt";

export type FamilySessionUser = Readonly<{
  id: string;
  email: string;
  role: "admin" | "family_viewer";
}>;

function normalizeRole(role: string): "admin" | "family_viewer" {
  return role === "admin" ? "admin" : "family_viewer";
}

/** Usuario autenticado vía cookie firmada (RSC, handlers, actions). */
export async function getFamilySession(): Promise<FamilySessionUser | null> {
  const jar = await cookies();
  const raw = jar.get(FAMILY_SESSION_COOKIE)?.value;

  if (raw === undefined || raw === "") {
    return null;
  }

  const payload = await verifyFamilySessionToken(raw);

  if (payload === null) {
    return null;
  }

  return {
    id: payload.sub,
    email: payload.email,
    role: normalizeRole(payload.role)
  };
}

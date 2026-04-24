import { redirect } from "next/navigation";
import { getFamilySession, type FamilySessionUser } from "./get-family-session";

/** `admin` → `/auth/admin/login` (backoffice); `family` → `/auth/login` (espectadores). */
export type FamilyLoginPortal = "family" | "admin";

export async function requireFamilyUser(
  nextPath: string,
  portal: FamilyLoginPortal = "family"
): Promise<FamilySessionUser> {
  const user = await getFamilySession();

  if (user === null) {
    const base = portal === "admin" ? "/auth/admin/login" : "/auth/login";
    redirect(`${base}?next=${encodeURIComponent(nextPath)}`);
  }

  return user;
}

import { redirect } from "next/navigation";
import { getFamilySession, type FamilySessionUser } from "./get-family-session";

export async function requireFamilyUser(nextPath: string): Promise<FamilySessionUser> {
  const user = await getFamilySession();

  if (user === null) {
    redirect(`/auth/login?next=${encodeURIComponent(nextPath)}`);
  }

  return user;
}

import { redirect } from "next/navigation";
import { getActiveProfileSummary } from "./active-profile";
import { requireFamilyUser } from "./require-family-user";

/** Storefront: sesión Family + perfil activo explícito. */
export async function requireStorefrontAccess(nextPath: string) {
  await requireFamilyUser(nextPath);
  const active = await getActiveProfileSummary();

  if (active === null) {
    redirect(`/auth/select-profile?next=${encodeURIComponent(nextPath)}`);
  }

  return active;
}

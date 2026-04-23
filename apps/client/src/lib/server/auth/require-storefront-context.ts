import { redirect } from "next/navigation";
import { getActiveProfileSummary } from "./active-profile";
import { requireFamilyUser } from "./require-family-user";
import type { StorefrontCatalogActor } from "./storefront-catalog-actor";

/** Storefront: sesión Family + perfil activo explícito + rol para reglas de catálogo (`releaseScope`). */
export async function requireStorefrontAccess(nextPath: string): Promise<StorefrontCatalogActor> {
  const session = await requireFamilyUser(nextPath);
  const active = await getActiveProfileSummary();

  if (active === null) {
    redirect(`/auth/select-profile?next=${encodeURIComponent(nextPath)}`);
  }

  return { ...active, viewerRole: session.role };
}

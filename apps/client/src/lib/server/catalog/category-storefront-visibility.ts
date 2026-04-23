import type { Prisma } from "../../../generated/prisma-family/client";
import type { UserRoleFamily } from "../../family/domain-shapes";
import { RELEASE_SCOPE_PUBLIC_CATALOG } from "./content-storefront-visibility";

/**
 * Filtro Prisma para categorías visibles en el home según rol.
 * Los espectadores solo ven carruseles `public_catalog`; los admins ven todos.
 */
export function prismaWhereStorefrontVisibleCategory(
  viewerRole: UserRoleFamily
): Prisma.CategoryWhereInput {
  if (viewerRole !== "admin") {
    return { releaseScope: RELEASE_SCOPE_PUBLIC_CATALOG };
  }
  return {};
}

export function canSpectatorSeeCategoryReleaseScope(releaseScope: string): boolean {
  return releaseScope === RELEASE_SCOPE_PUBLIC_CATALOG;
}

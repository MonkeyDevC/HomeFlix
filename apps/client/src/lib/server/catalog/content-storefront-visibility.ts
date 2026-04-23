import type { Prisma } from "../../../generated/prisma-family/client";
import type { UserRoleFamily } from "../../family/domain-shapes";

/** Solo administradores autenticados con perfil autorizado (fila en ProfileContentAccess). */
export const RELEASE_SCOPE_ADMIN_ONLY = "admin_only" as const;

/** Catálogo familiar: requiere además publicación y reglas de editorial. */
export const RELEASE_SCOPE_PUBLIC_CATALOG = "public_catalog" as const;

/**
 * Filtro Prisma único para ítems visibles en storefront (home, búsqueda, series, relacionados, etc.).
 *
 * - Espectador: `published` + `public_catalog` + acceso por perfil.
 * - Admin: además ve `admin_only` con acceso por perfil (cualquier estado editorial, p. ej. borrador en QA).
 */
export function prismaWhereStorefrontVisibleContent(
  profileId: string,
  viewerRole: UserRoleFamily
): Prisma.ContentItemWhereInput {
  const access = { some: { profileId } } as const;

  const publicCatalog: Prisma.ContentItemWhereInput = {
    editorialStatus: "published",
    releaseScope: RELEASE_SCOPE_PUBLIC_CATALOG,
    accessGrants: access
  };

  if (viewerRole !== "admin") {
    return publicCatalog;
  }

  const adminPreview: Prisma.ContentItemWhereInput = {
    releaseScope: RELEASE_SCOPE_ADMIN_ONLY,
    accessGrants: access
  };

  return { OR: [publicCatalog, adminPreview] };
}

export function canSpectatorSeeContentOnStorefront(p: {
  editorialStatus: string;
  releaseScope: string;
  hasProfileAccess: boolean;
}): boolean {
  return (
    p.hasProfileAccess &&
    p.editorialStatus === "published" &&
    p.releaseScope === RELEASE_SCOPE_PUBLIC_CATALOG
  );
}

export function canAdminProfileSeeContentOnStorefront(p: {
  editorialStatus: string;
  releaseScope: string;
  hasProfileAccess: boolean;
}): boolean {
  if (!p.hasProfileAccess) {
    return false;
  }
  if (p.releaseScope === RELEASE_SCOPE_ADMIN_ONLY) {
    return true;
  }
  return (
    p.editorialStatus === "published" &&
    p.releaseScope === RELEASE_SCOPE_PUBLIC_CATALOG
  );
}

export function contentVisibleForStorefrontViewer(
  viewerRole: UserRoleFamily,
  fields: { editorialStatus: string; releaseScope: string; hasProfileAccess: boolean }
): boolean {
  return viewerRole === "admin"
    ? canAdminProfileSeeContentOnStorefront(fields)
    : canSpectatorSeeContentOnStorefront(fields);
}

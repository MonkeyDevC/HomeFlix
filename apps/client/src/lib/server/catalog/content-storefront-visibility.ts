import type { Prisma } from "../../../generated/prisma-family/client";
import type { UserRoleFamily } from "../../family/domain-shapes";

/** Solo administradores autenticados con perfil autorizado (fila en ProfileContentAccess). */
export const RELEASE_SCOPE_ADMIN_ONLY = "admin_only" as const;

/** Catálogo familiar: requiere además publicación y reglas de editorial. */
export const RELEASE_SCOPE_PUBLIC_CATALOG = "public_catalog" as const;

/** Visibilidades que el catálogo familiar trata como “hogar / abierto” sin fila en ProfileContentAccess. */
const CATALOG_WIDE_VISIBILITY = ["household", "public_internal"] as const;

/**
 * Filtro Prisma único para ítems visibles en storefront (home, búsqueda, series, relacionados, etc.).
 *
 * - `private`: sigue exigiendo `ProfileContentAccess` para el perfil activo (invitación explícita).
 * - `household` | `public_internal`: publicado + `public_catalog` basta para cualquier perfil (nuevos
 *   usuarios/perfiles creados después de publicar el contenido siguen viéndolo, alineado con las
 *   etiquetas de UI “hogar” / “todos”).
 * - `admin_only`: solo con fila de acceso (vista previa QA); el admin sigue viendo catálogo público igual.
 */
export function prismaWhereStorefrontVisibleContent(
  profileId: string,
  viewerRole: UserRoleFamily
): Prisma.ContentItemWhereInput {
  const access = { some: { profileId } } as const;

  const publicCatalog: Prisma.ContentItemWhereInput = {
    editorialStatus: "published",
    releaseScope: RELEASE_SCOPE_PUBLIC_CATALOG,
    OR: [
      { accessGrants: access },
      { visibility: { in: [...CATALOG_WIDE_VISIBILITY] } }
    ]
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
  visibility: string;
}): boolean {
  if (p.editorialStatus !== "published" || p.releaseScope !== RELEASE_SCOPE_PUBLIC_CATALOG) {
    return false;
  }
  if (p.visibility === "private") {
    return p.hasProfileAccess;
  }
  if (p.visibility === "household" || p.visibility === "public_internal") {
    return true;
  }
  return p.hasProfileAccess;
}

export function canAdminProfileSeeContentOnStorefront(p: {
  editorialStatus: string;
  releaseScope: string;
  hasProfileAccess: boolean;
  visibility: string;
}): boolean {
  if (p.releaseScope === RELEASE_SCOPE_ADMIN_ONLY) {
    return p.hasProfileAccess;
  }
  if (p.releaseScope !== RELEASE_SCOPE_PUBLIC_CATALOG) {
    return false;
  }
  if (p.editorialStatus !== "published") {
    return false;
  }
  if (p.visibility === "private") {
    return p.hasProfileAccess;
  }
  if (p.visibility === "household" || p.visibility === "public_internal") {
    return true;
  }
  return p.hasProfileAccess;
}

export function contentVisibleForStorefrontViewer(
  viewerRole: UserRoleFamily,
  fields: {
    editorialStatus: string;
    releaseScope: string;
    hasProfileAccess: boolean;
    visibility: string;
  }
): boolean {
  return viewerRole === "admin"
    ? canAdminProfileSeeContentOnStorefront(fields)
    : canSpectatorSeeContentOnStorefront(fields);
}

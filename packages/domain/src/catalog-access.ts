import type { ContentItemStatus, PublicationVisibility, Role } from "./status.js";

/**
 * FASE 7: reglas mínimas de visibilidad para consumo (viewer) vs admin.
 * Admin puede ver cualquier combinación (incl. borradores y private).
 */
export function canAccessContentItemForConsumption(params: {
  readonly role: Role;
  readonly editorialStatus: ContentItemStatus;
  readonly visibility: PublicationVisibility;
}): boolean {
  if (params.role === "admin") {
    return true;
  }

  if (params.editorialStatus !== "published") {
    return false;
  }

  if (params.visibility === "private") {
    return false;
  }

  return (
    params.visibility === "household" ||
    params.visibility === "public-internal"
  );
}

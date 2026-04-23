import type { ActiveProfileSummary } from "./active-profile";

/**
 * Perfil activo en storefront + rol de la sesión Family (qué reglas de catálogo aplican).
 */
export type StorefrontCatalogActor = ActiveProfileSummary &
  Readonly<{
    viewerRole: "admin" | "family_viewer";
  }>;

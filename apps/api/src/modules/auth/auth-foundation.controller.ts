import type { AuthFoundationResponse } from "@homeflix/contracts";

export function getAuthFoundationResponse(): AuthFoundationResponse {
  return {
    ok: true,
    data: {
      notes: [
        "FASE 7: login y access token JWT emitidos por apps/api (HS256).",
        "El storefront adjunta Authorization: Bearer en catálogo y reproducción.",
        "Directus sigue acotado al CMS; no es el motor de auth del consumo público."
      ],
      owner: "apps/api",
      status: "phase-7-consumer-auth",
      strategy: "api-issued-jwt-bearer",
      tokenTransport: "authorization-header"
    }
  };
}

import { NextResponse } from "next/server";
import { requireStorefrontApi } from "../../../../lib/server/auth/require-storefront-api";
import { listPublishedCatalogForProfile } from "../../../../lib/server/catalog/catalog-for-profile";
import { serviceUnavailableResponse } from "../../../../lib/server/http/family-api-errors";

export const runtime = "nodejs";

/**
 * Catálogo Family para el **perfil activo** (cookies). Sin `profileId` en query: fuente de verdad servidor.
 */
export async function GET() {
  try {
    const gate = await requireStorefrontApi();
    if (gate instanceof NextResponse) {
      return gate;
    }
    const active = gate;

    const items = await listPublishedCatalogForProfile(active.profileId, active.viewerRole);
    return NextResponse.json({
      profileId: active.profileId,
      rule: "storefront_visibility_release_scope_profile_content_access",
      count: items.length,
      items
    });
  } catch (error) {
    return serviceUnavailableResponse(error);
  }
}

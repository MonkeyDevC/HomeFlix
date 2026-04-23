import { NextResponse } from "next/server";
import { requireStorefrontApi } from "../../../../lib/server/auth/require-storefront-api";
import { searchFamilyCatalogForProfile } from "../../../../lib/server/catalog/storefront-home-search";
import { serviceUnavailableResponse } from "../../../../lib/server/http/family-api-errors";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const gate = await requireStorefrontApi();
  if (gate instanceof NextResponse) {
    return gate;
  }
  const active = gate;

  const query = new URL(request.url).searchParams.get("q") ?? "";

  try {
    const result = await searchFamilyCatalogForProfile(active, query);
    return NextResponse.json({
      profileId: active.profileId,
      profileDisplayName: active.displayName,
      ...result
    });
  } catch (error) {
    return serviceUnavailableResponse(error);
  }
}


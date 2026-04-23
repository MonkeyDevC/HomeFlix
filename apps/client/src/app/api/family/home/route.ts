import { NextResponse } from "next/server";
import { requireStorefrontApi } from "../../../../lib/server/auth/require-storefront-api";
import { getFamilyHomeForProfile } from "../../../../lib/server/catalog/storefront-home-search";
import { serviceUnavailableResponse } from "../../../../lib/server/http/family-api-errors";

export const runtime = "nodejs";

export async function GET() {
  const gate = await requireStorefrontApi();
  if (gate instanceof NextResponse) {
    return gate;
  }
  const active = gate;

  try {
    const home = await getFamilyHomeForProfile(active);
    return NextResponse.json(home);
  } catch (error) {
    return serviceUnavailableResponse(error);
  }
}


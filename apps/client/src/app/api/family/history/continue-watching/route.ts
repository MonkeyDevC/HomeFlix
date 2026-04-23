import { NextResponse } from "next/server";
import { requireStorefrontApi } from "../../../../../lib/server/auth/require-storefront-api";
import { listContinueWatchingForProfile } from "../../../../../lib/server/catalog/watch-history-for-profile";
import { serviceUnavailableResponse } from "../../../../../lib/server/http/family-api-errors";

export const runtime = "nodejs";

export async function GET() {
  const gate = await requireStorefrontApi();
  if (gate instanceof NextResponse) {
    return gate;
  }
  const active = gate;

  try {
    const items = await listContinueWatchingForProfile(active.profileId, active.viewerRole);
    return NextResponse.json({
      profileId: active.profileId,
      profileDisplayName: active.displayName,
      items
    });
  } catch (error) {
    return serviceUnavailableResponse(error);
  }
}


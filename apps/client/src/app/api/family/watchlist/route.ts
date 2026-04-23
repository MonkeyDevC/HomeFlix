import { NextResponse } from "next/server";
import { requireStorefrontApi } from "../../../../lib/server/auth/require-storefront-api";
import {
  listWatchlistCardsForProfile,
  getWatchlistContentIdSetForProfile
} from "../../../../lib/server/catalog/watchlist-for-profile";
import { serviceUnavailableResponse } from "../../../../lib/server/http/family-api-errors";

export const runtime = "nodejs";

export async function GET() {
  const gate = await requireStorefrontApi();
  if (gate instanceof NextResponse) {
    return gate;
  }

  try {
    const [items, idSet] = await Promise.all([
      listWatchlistCardsForProfile(gate.profileId),
      getWatchlistContentIdSetForProfile(gate.profileId)
    ]);
    return NextResponse.json({
      ok: true,
      profileId: gate.profileId,
      items,
      contentItemIds: Array.from(idSet)
    });
  } catch (error) {
    return serviceUnavailableResponse(error);
  }
}

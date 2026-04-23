import { NextResponse } from "next/server";
import { requireStorefrontApi } from "../../../../../lib/server/auth/require-storefront-api";
import {
  addToWatchlist,
  removeFromWatchlist
} from "../../../../../lib/server/catalog/watchlist-for-profile";
import {
  badRequestResponse,
  notFoundResponse,
  serviceUnavailableResponse
} from "../../../../../lib/server/http/family-api-errors";

export const runtime = "nodejs";

function sanitizeId(raw: string | undefined): string {
  return typeof raw === "string" ? raw.trim() : "";
}

export async function POST(
  _request: Request,
  context: { params: Promise<{ contentItemId: string }> }
) {
  const gate = await requireStorefrontApi();
  if (gate instanceof NextResponse) {
    return gate;
  }

  const params = await context.params;
  const contentItemId = sanitizeId(params.contentItemId);
  if (contentItemId === "") {
    return badRequestResponse("invalid_content_item_id");
  }

  try {
    const result = await addToWatchlist(gate.profileId, contentItemId);
    if (!result.ok) {
      return notFoundResponse();
    }
    return NextResponse.json({
      ok: true,
      profileId: gate.profileId,
      contentItemId,
      inWatchlist: true
    });
  } catch (error) {
    return serviceUnavailableResponse(error);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ contentItemId: string }> }
) {
  const gate = await requireStorefrontApi();
  if (gate instanceof NextResponse) {
    return gate;
  }

  const params = await context.params;
  const contentItemId = sanitizeId(params.contentItemId);
  if (contentItemId === "") {
    return badRequestResponse("invalid_content_item_id");
  }

  try {
    await removeFromWatchlist(gate.profileId, contentItemId);
    return NextResponse.json({
      ok: true,
      profileId: gate.profileId,
      contentItemId,
      inWatchlist: false
    });
  } catch (error) {
    return serviceUnavailableResponse(error);
  }
}

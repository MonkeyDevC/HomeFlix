import { NextResponse } from "next/server";
import { requireStorefrontApi } from "../../../../../../lib/server/auth/require-storefront-api";
import { getContentDetailForActiveProfile } from "../../../../../../lib/server/catalog/content-detail-for-profile";
import { notFoundResponse, serviceUnavailableResponse } from "../../../../../../lib/server/http/family-api-errors";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ slug: string }> }
) {
  const gate = await requireStorefrontApi();
  if (gate instanceof NextResponse) {
    return gate;
  }
  const active = gate;

  const { slug } = await ctx.params;
  try {
    const detail = await getContentDetailForActiveProfile(slug, active.profileId, active.viewerRole);
    if (detail === null) {
      return notFoundResponse();
    }
    return NextResponse.json({
      profileId: active.profileId,
      rule: "storefront_visibility_release_scope_profile_access_and_local_media",
      item: detail.item,
      playback: detail.playback,
      photoGallery: detail.photoGallery
    });
  } catch (error) {
    return serviceUnavailableResponse(error);
  }
}


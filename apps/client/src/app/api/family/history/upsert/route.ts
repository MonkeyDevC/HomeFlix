import { NextResponse } from "next/server";
import { requireStorefrontApi } from "../../../../../lib/server/auth/require-storefront-api";
import { upsertWatchHistoryForProfile } from "../../../../../lib/server/catalog/watch-history-for-profile";
import {
  badRequestResponse,
  notFoundResponse,
  serviceUnavailableResponse
} from "../../../../../lib/server/http/family-api-errors";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const gate = await requireStorefrontApi();
  if (gate instanceof NextResponse) {
    return gate;
  }
  const active = gate;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequestResponse("invalid_json");
  }

  const contentItemId =
    typeof (body as { contentItemId?: unknown }).contentItemId === "string"
      ? (body as { contentItemId: string }).contentItemId.trim()
      : "";
  const progressSeconds = (body as { progressSeconds?: unknown }).progressSeconds;
  const durationSeconds = (body as { durationSeconds?: unknown }).durationSeconds;
  const ended = (body as { ended?: unknown }).ended;

  if (contentItemId === "") {
    return badRequestResponse("invalid_content_item_id");
  }
  if (typeof progressSeconds !== "number" || !Number.isFinite(progressSeconds) || progressSeconds < 0) {
    return badRequestResponse("invalid_progress_seconds");
  }
  if (
    durationSeconds !== undefined &&
    durationSeconds !== null &&
    (typeof durationSeconds !== "number" || !Number.isFinite(durationSeconds) || durationSeconds <= 0)
  ) {
    return badRequestResponse("invalid_duration_seconds");
  }
  if (ended !== undefined && typeof ended !== "boolean") {
    return badRequestResponse("invalid_ended_flag");
  }

  try {
    const result = await upsertWatchHistoryForProfile({
      profileId: active.profileId,
      contentItemId,
      viewerRole: active.viewerRole,
      progressSeconds,
      durationSeconds: durationSeconds ?? null,
      ended: ended === true
    });

    if (!result.ok) {
      return notFoundResponse();
    }

    return NextResponse.json({
      ok: true,
      profileId: active.profileId,
      result: result.result
    });
  } catch (error) {
    return serviceUnavailableResponse(error);
  }
}


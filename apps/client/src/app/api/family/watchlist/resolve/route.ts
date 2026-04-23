import { NextResponse } from "next/server";
import { requireStorefrontApi } from "../../../../../lib/server/auth/require-storefront-api";
import {
  addToWatchlist,
  removeFromWatchlist,
  resolveWatchlistContentItemId
} from "../../../../../lib/server/catalog/watchlist-for-profile";
import {
  badRequestResponse,
  notFoundResponse,
  serviceUnavailableResponse
} from "../../../../../lib/server/http/family-api-errors";

export const runtime = "nodejs";

type CardKind = "series" | "standalone";

type ResolveInput = Readonly<{ kind: CardKind; id: string; action: "add" | "remove" }>;

async function parse(request: Request): Promise<
  | { ok: true; input: ResolveInput }
  | { ok: false; error: string }
> {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const kind = body.kind;
    const id = body.id;
    const action = body.action;

    if (kind !== "series" && kind !== "standalone") {
      return { ok: false, error: "invalid_kind" };
    }
    if (typeof id !== "string" || id.trim() === "") {
      return { ok: false, error: "invalid_id" };
    }
    if (action !== "add" && action !== "remove") {
      return { ok: false, error: "invalid_action" };
    }
    return {
      ok: true,
      input: { kind: kind as CardKind, id: id.trim(), action: action as "add" | "remove" }
    };
  } catch {
    return { ok: false, error: "invalid_json" };
  }
}

export async function POST(request: Request) {
  const gate = await requireStorefrontApi();
  if (gate instanceof NextResponse) {
    return gate;
  }

  const parsed = await parse(request);
  if (!parsed.ok) {
    return badRequestResponse(parsed.error);
  }

  const { kind, id, action } = parsed.input;

  try {
    const contentItemId = await resolveWatchlistContentItemId(gate.profileId, { kind, id }, gate.viewerRole);
    if (contentItemId === null) {
      return notFoundResponse();
    }

    if (action === "add") {
      const result = await addToWatchlist(gate.profileId, contentItemId, gate.viewerRole);
      if (!result.ok) {
        return notFoundResponse();
      }
      return NextResponse.json({
        ok: true,
        profileId: gate.profileId,
        contentItemId,
        inWatchlist: true
      });
    }

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

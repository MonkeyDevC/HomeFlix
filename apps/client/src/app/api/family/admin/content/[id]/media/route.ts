import { NextResponse } from "next/server";
import { buildAdminContentMediaSummaryDto } from "../../../../../../../lib/server/admin/admin-content-media-summary";
import { requireAdminApi } from "../../../../../../../lib/server/auth/require-admin-api";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const gate = await requireAdminApi();
  if (gate instanceof NextResponse) {
    return gate;
  }

  const { id } = await ctx.params;

  try {
    const summary = await buildAdminContentMediaSummaryDto(id);
    if (summary === null) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    return NextResponse.json({ item: summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : "db_error";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}


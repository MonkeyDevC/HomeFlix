import { NextResponse } from "next/server";
import { getActiveProfileSummary } from "../../../../lib/server/auth/active-profile";
import { getFamilySession } from "../../../../lib/server/auth/get-family-session";
import { getFamilyPrisma } from "../../../../lib/server/db";
import { listPublishedCatalogForProfile } from "../../../../lib/server/catalog/catalog-for-profile";
import {
  badRequestResponse,
  notFoundResponse,
  serviceUnavailableResponse,
  unauthorizedResponse
} from "../../../../lib/server/http/family-api-errors";

export const runtime = "nodejs";

const uuidRe =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Vista técnica del catálogo Family.
 * Requiere sesión. `profileId` opcional: si falta, usa el perfil activo en cookie.
 * Si se envía `profileId`, debe pertenecer al usuario autenticado.
 */
export async function GET(request: Request) {
  const session = await getFamilySession();

  if (session === null) {
    return unauthorizedResponse();
  }

  const qp = new URL(request.url).searchParams.get("profileId");
  let targetProfileId: string | null = null;

  if (qp !== null && qp !== "") {
    if (!uuidRe.test(qp)) {
      return badRequestResponse("invalid_profile_id", "UUID v4 o similar");
    }

    const prisma = getFamilyPrisma();
    const owned = await prisma.profile.findFirst({
      where: { id: qp, userId: session.id },
      select: { id: true }
    });

    if (owned === null) {
      return notFoundResponse();
    }

    targetProfileId = qp;
  } else {
    const active = await getActiveProfileSummary();
    targetProfileId = active?.profileId ?? null;
  }

  if (targetProfileId === null) {
    return badRequestResponse(
      "no_profile_target",
      "Pasa ?profileId=… de tu cuenta o establece perfil activo vía /auth/select-profile"
    );
  }

  try {
    const items = await listPublishedCatalogForProfile(targetProfileId, session.role);
    return NextResponse.json({
      profileId: targetProfileId,
      rule: "storefront_visibility_release_scope_profile_content_access",
      count: items.length,
      items
    });
  } catch (error) {
    return serviceUnavailableResponse(error);
  }
}

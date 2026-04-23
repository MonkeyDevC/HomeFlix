import { NextResponse } from "next/server";
import { getActiveProfileSummary } from "./active-profile";
import { getFamilySession } from "./get-family-session";
import type { StorefrontCatalogActor } from "./storefront-catalog-actor";
import { forbiddenResponse, unauthorizedResponse } from "../http/family-api-errors";

export async function requireStorefrontApi(): Promise<StorefrontCatalogActor | NextResponse> {
  const session = await getFamilySession();
  if (session === null) {
    return unauthorizedResponse();
  }

  const active = await getActiveProfileSummary();
  if (active === null) {
    return forbiddenResponse();
  }

  return { ...active, viewerRole: session.role };
}


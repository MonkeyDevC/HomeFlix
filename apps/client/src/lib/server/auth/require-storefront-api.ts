import { NextResponse } from "next/server";
import type { ActiveProfileSummary } from "./active-profile";
import { getActiveProfileSummary } from "./active-profile";
import { getFamilySession } from "./get-family-session";
import { forbiddenResponse, unauthorizedResponse } from "../http/family-api-errors";

export async function requireStorefrontApi():
  Promise<ActiveProfileSummary | NextResponse> {
  const session = await getFamilySession();
  if (session === null) {
    return unauthorizedResponse();
  }

  const active = await getActiveProfileSummary();
  if (active === null) {
    return forbiddenResponse();
  }

  return active;
}


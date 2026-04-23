import { cookies } from "next/headers";
import { getFamilyPrisma } from "../db";
import { FAMILY_PROFILE_COOKIE } from "../session/family-cookies";
import { verifyFamilyProfileToken } from "../session/family-jwt";
import { getFamilySession } from "./get-family-session";

export type ActiveProfileSummary = Readonly<{
  profileId: string;
  userId: string;
  displayName: string;
  avatarKey: string | null;
}>;

/**
 * Perfil activo desde cookie firmada + comprobación en DB (no confiar solo en el cliente).
 */
export async function getActiveProfileSummary(): Promise<ActiveProfileSummary | null> {
  const session = await getFamilySession();

  if (session === null) {
    return null;
  }

  const jar = await cookies();
  const raw = jar.get(FAMILY_PROFILE_COOKIE)?.value;

  if (raw === undefined || raw === "") {
    return null;
  }

  const tokenPayload = await verifyFamilyProfileToken(raw);

  if (tokenPayload === null || tokenPayload.sub !== session.id) {
    return null;
  }

  const prisma = getFamilyPrisma();
  const profile = await prisma.profile.findFirst({
    where: { id: tokenPayload.pid, userId: session.id },
    select: { id: true, userId: true, displayName: true, avatarKey: true }
  });

  if (profile === null) {
    return null;
  }

  return {
    profileId: profile.id,
    userId: profile.userId,
    displayName: profile.displayName,
    avatarKey: profile.avatarKey
  };
}

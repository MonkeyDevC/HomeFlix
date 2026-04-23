import { SignJWT, jwtVerify } from "jose";
import { getFamilyJwtSecretOrThrow } from "../env";

const SESSION_TYP = "family_session";
const PROFILE_TYP = "family_profile";

const encoder = new TextEncoder();

function secretKey(): Uint8Array {
  return encoder.encode(getFamilyJwtSecretOrThrow());
}

export type FamilySessionJwtPayload = Readonly<{
  sub: string;
  email: string;
  role: string;
  typ: typeof SESSION_TYP;
}>;

export type FamilyProfileJwtPayload = Readonly<{
  sub: string;
  pid: string;
  typ: typeof PROFILE_TYP;
}>;

const sevenDays = 60 * 60 * 24 * 7;

export async function signFamilySessionToken(
  payload: Omit<FamilySessionJwtPayload, "typ">
): Promise<string> {
  const key = secretKey();
  return new SignJWT({ email: payload.email, role: payload.role, typ: SESSION_TYP })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${sevenDays}s`)
    .sign(key);
}

export async function verifyFamilySessionToken(
  token: string
): Promise<FamilySessionJwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (payload.sub === undefined || typeof payload.sub !== "string") {
      return null;
    }
    const email = payload.email;
    const role = payload.role;
    if (typeof email !== "string" || typeof role !== "string") {
      return null;
    }
    if (payload.typ !== SESSION_TYP) {
      return null;
    }
    return { sub: payload.sub, email, role, typ: SESSION_TYP };
  } catch {
    return null;
  }
}

export async function signFamilyProfileToken(
  payload: Omit<FamilyProfileJwtPayload, "typ">
): Promise<string> {
  const key = secretKey();
  return new SignJWT({ pid: payload.pid, typ: PROFILE_TYP })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${sevenDays}s`)
    .sign(key);
}

export async function verifyFamilyProfileToken(
  token: string
): Promise<FamilyProfileJwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (payload.sub === undefined || typeof payload.sub !== "string") {
      return null;
    }
    const pid = payload.pid;
    if (typeof pid !== "string") {
      return null;
    }
    if (payload.typ !== PROFILE_TYP) {
      return null;
    }
    return { sub: payload.sub, pid, typ: PROFILE_TYP };
  } catch {
    return null;
  }
}

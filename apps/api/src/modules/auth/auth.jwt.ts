import { SignJWT, jwtVerify } from "jose";
import type { Role } from "@homeflix/domain";

export interface HomeflixJwtPayload {
  readonly sub: string;
  readonly role: Role;
}

const encoder = new TextEncoder();

export async function signHomeflixAccessToken(
  secret: string,
  payload: HomeflixJwtPayload
): Promise<string> {
  const key = encoder.encode(secret);

  return new SignJWT({
    role: payload.role
  })
    .setProtectedHeader({
      alg: "HS256"
    })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key);
}

export async function verifyHomeflixAccessToken(
  secret: string,
  token: string
): Promise<HomeflixJwtPayload> {
  const key = encoder.encode(secret);

  const { payload } = await jwtVerify(token, key, {
    algorithms: ["HS256"]
  });

  const sub = payload.sub;
  const role = payload.role;

  if (typeof sub !== "string" || (role !== "admin" && role !== "viewer")) {
    throw new Error("Invalid access token payload.");
  }

  return {
    role,
    sub
  };
}

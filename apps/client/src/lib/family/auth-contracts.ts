import type { UserRoleFamily } from "./domain-shapes";

/** POST /api/family/auth/login */
export type FamilyLoginRequest = Readonly<{
  email: string;
  password: string;
}>;

export type FamilySessionSummary = Readonly<{
  id: string;
  email: string;
  role: UserRoleFamily;
}>;

export type FamilyProfileSummary = Readonly<{
  id: string;
  displayName: string;
  avatarKey: string | null;
}>;

export type FamilyActiveProfileSummary = Readonly<{
  profileId: string;
  userId: string;
  displayName: string;
  avatarKey: string | null;
}>;

export type FamilyLoginResponseOk = Readonly<{
  ok: true;
  user: FamilySessionSummary;
  profiles: readonly FamilyProfileSummary[];
  mustSelectProfile: boolean;
}>;

export type FamilyLoginResponseErr = Readonly<{
  ok: false;
  error: "invalid_credentials" | "server_error";
  message?: string;
}>;

export type FamilyLoginResponse = FamilyLoginResponseOk | FamilyLoginResponseErr;

export type FamilyMeResponseOk = Readonly<{
  ok: true;
  user: FamilySessionSummary;
  profiles: readonly FamilyProfileSummary[];
  activeProfile: FamilyActiveProfileSummary | null;
}>;

export type FamilyMeResponseErr = Readonly<{
  ok: false;
  error: "unauthorized" | "server_error";
}>;

export type FamilyMeResponse = FamilyMeResponseOk | FamilyMeResponseErr;

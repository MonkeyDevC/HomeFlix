"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import type { FamilyMeResponseOk } from "../../lib/family/auth-contracts";

type ProfileSummary = Readonly<{
  id: string;
  displayName: string;
  avatarKey: string | null;
}>;

export interface ProfileSessionContextValue {
  readonly profiles: readonly ProfileSummary[];
  readonly activeProfileId: string | null;
  /** `true` si la cookie de perfil activo quedó actualizada (o se limpió con `null`). */
  readonly setActiveProfileId: (id: string | null) => Promise<boolean>;
  readonly loading: boolean;
  readonly errorMessage: string | null;
  /** Usuario autenticado en el monolito Family (cookie). */
  readonly familyUser: Readonly<{ email: string; role: string }> | null;
}

const ProfileSessionContext = createContext<ProfileSessionContextValue | null>(null);

function mapToContractProfiles(
  rows: FamilyMeResponseOk["profiles"]
): readonly ProfileSummary[] {
  return rows.map((p) => ({
    id: p.id,
    displayName: p.displayName,
    avatarKey: p.avatarKey
  }));
}

export function ProfileSessionProvider({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  const [profiles, setProfiles] = useState<readonly ProfileSummary[]>([]);
  const [activeProfileId, setActiveProfileIdState] = useState<string | null>(null);
  const [familyUser, setFamilyUser] = useState<ProfileSessionContextValue["familyUser"]>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadMe = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);

    const res = await fetch("/api/family/auth/me", { credentials: "include" });
    if (res.status === 401) {
      setProfiles([]);
      setActiveProfileIdState(null);
      setFamilyUser(null);
      setErrorMessage("Inicia sesión con tu cuenta Family (/auth/login).");
      setLoading(false);
      return;
    }

    if (!res.ok) {
      setErrorMessage("No se pudo cargar la sesión Family.");
      setProfiles([]);
      setActiveProfileIdState(null);
      setFamilyUser(null);
      setLoading(false);
      return;
    }

    const data = (await res.json()) as FamilyMeResponseOk | { ok: false };

    if (data.ok !== true) {
      setErrorMessage("Respuesta inválida del servidor.");
      setProfiles([]);
      setActiveProfileIdState(null);
      setFamilyUser(null);
      setLoading(false);
      return;
    }

    setFamilyUser({ email: data.user.email, role: data.user.role });
    setProfiles(mapToContractProfiles(data.profiles));
    setActiveProfileIdState(data.activeProfile?.profileId ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadMe();
  }, [loadMe]);

  const setActiveProfileId = useCallback(async (id: string | null): Promise<boolean> => {
    if (id === null) {
      await fetch("/api/family/auth/active-profile", {
        method: "DELETE",
        credentials: "include"
      });
      await loadMe();
      return true;
    }

    const res = await fetch("/api/family/auth/active-profile", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId: id })
    });
    if (res.ok) {
      await loadMe();
      return true;
    }
    return false;
  }, [loadMe]);

  const value = useMemo<ProfileSessionContextValue>(
    () => ({
      activeProfileId,
      errorMessage,
      familyUser,
      loading,
      profiles,
      setActiveProfileId
    }),
    [activeProfileId, errorMessage, familyUser, loading, profiles, setActiveProfileId]
  );

  return (
    <ProfileSessionContext.Provider value={value}>{children}</ProfileSessionContext.Provider>
  );
}

export function useProfileSession(): ProfileSessionContextValue {
  const context = useContext(ProfileSessionContext);

  if (context === null) {
    throw new Error("useProfileSession debe usarse dentro de ProfileSessionProvider.");
  }

  return context;
}

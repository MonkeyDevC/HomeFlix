"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FamilyPageHeader, FamilySectionLayout } from "../../../../components/family-ui";

export default function NoProfilesPage() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const logout = () => {
    setPending(true);
    void (async () => {
      await fetch("/api/family/auth/logout", { method: "POST", credentials: "include" });
      router.push("/auth/login");
      router.refresh();
    })();
  };

  return (
    <FamilySectionLayout>
      <FamilyPageHeader
        description="Tu usuario no tiene perfiles de consumo. Un administrador puede darte de alta con perfiles iniciales en Admin → Usuarios, o puedes usar el seed Prisma del client."
        title="Sin perfiles"
      />
      <p style={{ color: "var(--hf-muted, #94a3b8)", fontSize: "0.9rem", lineHeight: 1.5, margin: 0 }}>
        Ejecuta el seed Prisma del client o inserta filas en <code>family_v1.profiles</code> ligadas a tu{" "}
        <code>user_id</code>.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginTop: "1.25rem" }}>
        <button
          disabled={pending}
          onClick={logout}
          style={{
            background: "#334155",
            border: "none",
            borderRadius: "8px",
            color: "#e5e7eb",
            cursor: pending ? "wait" : "pointer",
            padding: "0.55rem 1rem"
          }}
          type="button"
        >
          Cerrar sesión
        </button>
        <Link
          href="/"
          style={{
            alignItems: "center",
            border: "1px solid rgba(148,163,184,0.35)",
            borderRadius: "8px",
            color: "#93c5fd",
            display: "inline-flex",
            padding: "0.55rem 1rem"
          }}
        >
          Inicio
        </Link>
      </div>
    </FamilySectionLayout>
  );
}

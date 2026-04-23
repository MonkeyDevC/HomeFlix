"use client";

import type { ProfileSummary } from "@homeflix/contracts";
import { useEffect, useState } from "react";
import { fetchProfiles } from "../../lib/api/api-http-client";

type State =
  | { readonly kind: "loading" }
  | { readonly kind: "ready"; readonly profiles: readonly ProfileSummary[] }
  | { readonly kind: "error"; readonly message: string };

export function ProfilesDevSurface({
  apiBaseUrl
}: Readonly<{
  apiBaseUrl: string;
}>) {
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    setState({ kind: "loading" });

    void (async () => {
      const result = await fetchProfiles(apiBaseUrl);

      if (cancelled) {
        return;
      }

      if (result.state !== "ok") {
        setState({ kind: "error", message: result.message });
        return;
      }

      setState({ kind: "ready", profiles: result.data });
    })();

    return () => {
      cancelled = true;
    };
  }, [apiBaseUrl]);

  if (state.kind === "loading") {
    return (
      <div className="hdc-panel" aria-busy="true">
        <p className="hdc-muted">Cargando perfiles…</p>
      </div>
    );
  }

  if (state.kind === "error") {
    return (
      <div className="hdc-panel" role="alert" style={{ borderColor: "rgba(239, 68, 68, 0.35)" }}>
        <p className="hdc-panel-title" style={{ color: "#fca5a5" }}>
          Error
        </p>
        <p className="hdc-muted">{state.message}</p>
      </div>
    );
  }

  if (state.profiles.length === 0) {
    return (
      <div className="hdc-panel">
        <p className="hdc-panel-title">Sin perfiles</p>
        <p className="hdc-muted">La API devolvió una lista vacía.</p>
      </div>
    );
  }

  return (
    <div className="hdc-panel">
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
          <thead>
            <tr style={{ textAlign: "left", color: "var(--hdc-text-muted, #8b93a7)" }}>
              <th style={{ padding: "8px 10px" }}>Nombre</th>
              <th style={{ padding: "8px 10px" }}>ID</th>
            </tr>
          </thead>
          <tbody>
            {state.profiles.map((p) => (
              <tr key={p.id} style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <td style={{ padding: "10px", fontWeight: 700 }}>{p.displayName}</td>
                <td style={{ padding: "10px", fontFamily: "ui-monospace, monospace", color: "#cbd5e1" }}>
                  {p.id}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import type { AdminProfileAccessDto, AdminProfileOptionDto } from "../../lib/family/admin-contracts";
import { adminParseJson } from "../../lib/family/admin-json";

export function ProfileAccessEditor({
  contentItemId,
  profiles,
  initialProfileIds
}: Readonly<{
  contentItemId: string;
  profiles: ReadonlyArray<AdminProfileOptionDto>;
  initialProfileIds: readonly string[];
}>) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set(initialProfileIds));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function save() {
    setBusy(true);
    setMessage(null);
    setError(null);
    const res = await fetch(`/api/family/admin/content/${contentItemId}/profile-access`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileIds: [...selected] })
    });
    const parsed = await adminParseJson<{ grants: AdminProfileAccessDto[] }>(res);
    setBusy(false);
    if (!parsed.ok) {
      setError(parsed.message);
      return;
    }
    setMessage("Accesos actualizados.");
    setSelected(new Set(parsed.data.grants.map((g) => g.profileId)));
  }

  if (profiles.length === 0) {
    return (
      <p className="hf-admin-empty-copy">
        No hay perfiles en la base todavía. Crea perfiles familiares antes de asignar visibilidad.
      </p>
    );
  }

  return (
    <div>
      {error !== null ? <p className="hf-admin-form-msg hf-admin-form-msg--error" role="alert">{error}</p> : null}
      {message !== null ? <p className="hf-admin-form-msg hf-admin-form-msg--success" role="status">{message}</p> : null}

      <div>
        {profiles.map((p) => (
          <label key={p.id} className="hf-admin-access-row">
            <input
              checked={selected.has(p.id)}
              onChange={() => toggle(p.id)}
              type="checkbox"
            />
            <span className="hf-admin-access-row__text">
              <strong>{p.displayName}</strong>
              <span className="hf-admin-access-row__account">{p.userEmail}</span>
            </span>
          </label>
        ))}
      </div>

      <div className="hf-admin-actions-row" style={{ marginTop: "0.9rem" }}>
        <button
          className="hf-admin-primary-action"
          disabled={busy}
          onClick={() => void save()}
          type="button"
        >
          {busy ? "Guardando…" : "Guardar accesos"}
        </button>
      </div>
    </div>
  );
}

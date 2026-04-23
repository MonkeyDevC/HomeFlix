"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import type { AdminUserDetailDto } from "../../lib/family/admin-contracts";
import { adminParseJson } from "../../lib/family/admin-json";
import { AdminInfoHint } from "./admin-info-hint";

export function AdminUserForm({
  mode,
  userId,
  initial
}: Readonly<{
  mode: "create" | "edit";
  userId?: string;
  initial?: Readonly<{ email: string; role: string }>;
}>) {
  const router = useRouter();
  const [email, setEmail] = useState(initial?.email ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(initial?.role === "admin" ? "admin" : "family_viewer");
  const [withDefaultProfiles, setWithDefaultProfiles] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    setError(null);

    const url =
      mode === "create" ? "/api/family/admin/users" : `/api/family/admin/users/${userId ?? ""}`;
    const method = mode === "create" ? "POST" : "PATCH";

    const payload: Record<string, unknown> = { email, role };
    if (mode === "create") {
      payload.password = password;
      payload.withDefaultProfiles = withDefaultProfiles;
    } else if (password.trim() !== "") {
      payload.password = password;
    }

    const res = await fetch(url, {
      method,
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const parsed = await adminParseJson<{ item: AdminUserDetailDto }>(res);
    setBusy(false);
    if (!parsed.ok) {
      setError(parsed.message);
      return;
    }
    setMessage(mode === "create" ? "Usuario creado." : "Cambios guardados.");
    if (mode === "create") {
      router.push(`/admin/users/${parsed.data.item.id}`);
      router.refresh();
    } else {
      setPassword("");
      router.refresh();
    }
  }

  return (
    <form className="hf-admin-form" onSubmit={(ev) => void onSubmit(ev)}>
      <AdminInfoHint>
        Las contraseñas se guardan con hash (bcrypt). En edición, deja la contraseña en blanco si no quieres
        cambiarla.
      </AdminInfoHint>

      {error !== null ? <p className="hf-admin-form-msg hf-admin-form-msg--error" role="alert">{error}</p> : null}
      {message !== null ? <p className="hf-admin-form-msg hf-admin-form-msg--success" role="status">{message}</p> : null}

      <div className="hf-admin-field">
        <label className="hf-admin-field-label" htmlFor="user-email">
          Correo electrónico
        </label>
        <input
          id="user-email"
          autoComplete="off"
          className="hf-admin-input"
          onChange={(ev) => setEmail(ev.target.value)}
          required
          type="email"
          value={email}
        />
      </div>

      <div className="hf-admin-field">
        <label className="hf-admin-field-label" htmlFor="user-password">
          {mode === "create" ? "Contraseña" : "Nueva contraseña (opcional)"}
        </label>
        <input
          id="user-password"
          autoComplete={mode === "create" ? "new-password" : "new-password"}
          className="hf-admin-input"
          minLength={mode === "create" ? 8 : undefined}
          onChange={(ev) => setPassword(ev.target.value)}
          required={mode === "create"}
          type="password"
          value={password}
        />
        <p className="hf-admin-field-hint">Mínimo 8 caracteres.</p>
      </div>

      <div className="hf-admin-field">
        <label className="hf-admin-field-label" htmlFor="user-role">
          Rol
        </label>
        <select
          id="user-role"
          className="hf-admin-input"
          onChange={(ev) => setRole(ev.target.value as "admin" | "family_viewer")}
          value={role}
        >
          <option value="family_viewer">Espectador familiar (family_viewer)</option>
          <option value="admin">Administrador (admin)</option>
        </select>
      </div>

      {mode === "create" ? (
        <div className="hf-admin-field">
          <p className="hf-admin-field-label">Perfiles iniciales</p>
          <label
            htmlFor="user-profiles"
            style={{ alignItems: "center", cursor: "pointer", display: "flex", gap: "0.5rem" }}
          >
            <input
              id="user-profiles"
              checked={withDefaultProfiles}
              onChange={(ev) => setWithDefaultProfiles(ev.target.checked)}
              type="checkbox"
            />
            <span>Crear &quot;Principal&quot; y &quot;Niños&quot; (recomendado)</span>
          </label>
          <p className="hf-admin-field-hint">
            Si lo desmarcas, el usuario podrá iniciar sesión pero verá la pantalla de “sin perfiles” hasta que
            existan filas en la base.
          </p>
        </div>
      ) : null}

      <div className="hf-admin-actions-row">
        <button className="hf-admin-primary-action" disabled={busy} type="submit">
          {busy ? "Guardando…" : mode === "create" ? "Crear usuario" : "Guardar cambios"}
        </button>
        <Link className="hf-admin-secondary-action" href="/admin/users">
          Volver al listado
        </Link>
      </div>
    </form>
  );
}

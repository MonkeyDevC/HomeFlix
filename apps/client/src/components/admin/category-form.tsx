"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import type { AdminCategoryDto } from "../../lib/family/admin-contracts";
import { adminParseJson } from "../../lib/family/admin-json";
import { AdminInfoHint } from "./admin-info-hint";
import { CategoryReleaseScopeSection } from "./category-release-scope-section";
import { SlugPreviewField } from "./slug-preview-field";

export function CategoryForm({
  mode,
  categoryId,
  initial
}: Readonly<{
  mode: "create" | "edit";
  categoryId?: string;
  initial?: Readonly<{ slug: string; name: string; releaseScope?: string }>;
}>) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? "");
  const [releaseScope, setReleaseScope] = useState<"admin_only" | "public_catalog">(
    initial?.releaseScope === "admin_only" ? "admin_only" : "public_catalog"
  );
  const [slugOverride, setSlugOverride] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    setError(null);

    const url =
      mode === "create" ? "/api/family/admin/categories" : `/api/family/admin/categories/${categoryId ?? ""}`;
    const method = mode === "create" ? "POST" : "PATCH";

    const payload: Record<string, string> = { name, releaseScope };
    if (slugOverride.trim() !== "") {
      payload.slug = slugOverride.trim();
    }

    const res = await fetch(url, {
      method,
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const parsed = await adminParseJson<{ item: AdminCategoryDto }>(res);
    setBusy(false);
    if (!parsed.ok) {
      setError(parsed.message);
      return;
    }
    setMessage(mode === "create" ? "Carrusel creado." : "Cambios guardados.");
    if (mode === "create") {
      router.push(`/admin/categories/${parsed.data.item.id}`);
      router.refresh();
    } else {
      router.refresh();
    }
  }

  return (
    <form className="hf-admin-form" onSubmit={(ev) => void onSubmit(ev)}>
      <AdminInfoHint>
        Las categorías se muestran como carruseles en el home. Puedes dejarlas en vista previa interna o
        liberarlas al catálogo familiar cuando estén listas.
      </AdminInfoHint>

      {error !== null ? <p className="hf-admin-form-msg hf-admin-form-msg--error" role="alert">{error}</p> : null}
      {message !== null ? <p className="hf-admin-form-msg hf-admin-form-msg--success" role="status">{message}</p> : null}

      <div className="hf-admin-field">
        <label className="hf-admin-field-label" htmlFor="cat-name">
          Nombre del carrusel
        </label>
        <input
          id="cat-name"
          className="hf-admin-input"
          onChange={(ev) => setName(ev.target.value)}
          required
          value={name}
          placeholder="Ej. Para toda la familia"
          autoComplete="off"
        />
        <p className="hf-admin-field-hint">Así lo verán los perfiles en el home (si el carrusel es público).</p>
      </div>

      <CategoryReleaseScopeSection onChange={setReleaseScope} value={releaseScope} />

      <SlugPreviewField
        currentSlug={initial?.slug ?? ""}
        onSlugChange={setSlugOverride}
        overrideValue={slugOverride}
        sourceLabel="el nombre del carrusel"
        sourceValue={name}
      />

      <div className="hf-admin-actions-row">
        <button className="hf-admin-primary-action" disabled={busy} type="submit">
          {busy ? "Guardando…" : mode === "create" ? "Crear carrusel" : "Guardar cambios"}
        </button>
        <Link href="/admin/categories" className="hf-admin-secondary-action">
          Volver al listado
        </Link>
      </div>
    </form>
  );
}

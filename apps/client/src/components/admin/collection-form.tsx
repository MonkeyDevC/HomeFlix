"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import type { AdminCollectionDto } from "../../lib/family/admin-contracts";
import { adminParseJson } from "../../lib/family/admin-json";
import { AdminInfoHint } from "./admin-info-hint";
import { SlugPreviewField } from "./slug-preview-field";

export function CollectionForm({
  mode,
  collectionId,
  initial
}: Readonly<{
  mode: "create" | "edit";
  collectionId?: string;
  initial?: Readonly<{ slug: string; name: string; description: string }>;
}>) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
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
      mode === "create"
        ? "/api/family/admin/collections"
        : `/api/family/admin/collections/${collectionId ?? ""}`;
    const method = mode === "create" ? "POST" : "PATCH";

    const payload: Record<string, string | null> = {
      name,
      description: description.trim() === "" ? null : description
    };
    if (slugOverride.trim() !== "") {
      payload.slug = slugOverride.trim();
    }

    const res = await fetch(url, {
      method,
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const parsed = await adminParseJson<{ item: AdminCollectionDto }>(res);
    setBusy(false);
    if (!parsed.ok) {
      setError(parsed.message);
      return;
    }
    setMessage(mode === "create" ? "Serie creada." : "Cambios guardados.");
    if (mode === "create") {
      router.push(`/admin/collections/${parsed.data.item.id}`);
      router.refresh();
    } else {
      router.refresh();
    }
  }

  return (
    <form className="hf-admin-form" onSubmit={(ev) => void onSubmit(ev)}>
      <AdminInfoHint>
        Una serie agrupa varios episodios (o capítulos) que se verán relacionados en el catálogo.
      </AdminInfoHint>

      {error !== null ? <p className="hf-admin-form-msg hf-admin-form-msg--error" role="alert">{error}</p> : null}
      {message !== null ? <p className="hf-admin-form-msg hf-admin-form-msg--success" role="status">{message}</p> : null}

      <div className="hf-admin-field">
        <label className="hf-admin-field-label" htmlFor="col-name">Nombre de la serie</label>
        <input
          id="col-name"
          className="hf-admin-input"
          onChange={(ev) => setName(ev.target.value)}
          required
          value={name}
          placeholder="Ej. Verano 2026"
          autoComplete="off"
        />
      </div>

      <div className="hf-admin-field">
        <label className="hf-admin-field-label" htmlFor="col-desc">Descripción (opcional)</label>
        <textarea
          id="col-desc"
          className="hf-admin-textarea"
          onChange={(ev) => setDescription(ev.target.value)}
          rows={4}
          value={description}
          placeholder="Una línea corta sobre la serie"
        />
      </div>

      <SlugPreviewField
        currentSlug={initial?.slug ?? ""}
        onSlugChange={setSlugOverride}
        overrideValue={slugOverride}
        sourceLabel="el nombre de la serie"
        sourceValue={name}
      />

      <div className="hf-admin-actions-row">
        <button className="hf-admin-primary-action" disabled={busy} type="submit">
          {busy ? "Guardando…" : mode === "create" ? "Crear serie" : "Guardar cambios"}
        </button>
        <Link href="/admin/collections" className="hf-admin-secondary-action">
          Volver al listado
        </Link>
      </div>
    </form>
  );
}

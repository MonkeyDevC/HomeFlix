"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import type { AdminContentMediaSummaryDto } from "../../lib/family/admin-contracts";
import { adminParseJson } from "../../lib/family/admin-json";
import { AdminInlineAlert } from "./admin-inline-alert";
import { FileReplaceButton } from "./file-replace-button";

export function UploadFieldBase({
  accepted,
  endpoint,
  hint,
  label,
  onSuccess
}: Readonly<{
  label: string;
  hint: string;
  endpoint: string;
  accepted: string;
  onSuccess: (next: AdminContentMediaSummaryDto) => void;
}>) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    setError(null);
    setSuccess(null);
    const formEl = ev.currentTarget;
    const input = formEl.elements.namedItem("file");
    if (!(input instanceof HTMLInputElement) || input.files === null || input.files.length === 0) {
      setError("Selecciona un archivo.");
      return;
    }

    const selected = input.files.item(0);
    if (selected === null) {
      setError("Selecciona un archivo.");
      return;
    }

    const payload = new FormData();
    payload.append("file", selected);

    setBusy(true);
    const res = await fetch(endpoint, {
      method: "POST",
      credentials: "include",
      body: payload
    });
    const parsed = await adminParseJson<{ item: AdminContentMediaSummaryDto }>(res);
    setBusy(false);
    if (!parsed.ok) {
      setError(parsed.message);
      return;
    }
    onSuccess(parsed.data.item);
    setSuccess("Archivo guardado correctamente.");
    formEl.reset();
  }

  return (
    <form className="hf-admin-upload-form" onSubmit={(ev) => void onSubmit(ev)}>
      <p className="hf-admin-upload-form-title">{label}</p>
      <p className="hf-admin-upload-form-hint">{hint}</p>
      {error !== null ? <AdminInlineAlert tone="error" text={error} /> : null}
      {success !== null ? <AdminInlineAlert tone="success" text={success} /> : null}
      <div className="hf-admin-upload-form-row">
        <input
          accept={accepted}
          name="file"
          className="hf-admin-input hf-admin-upload-form-input"
          type="file"
        />
        <FileReplaceButton busy={busy} />
      </div>
    </form>
  );
}

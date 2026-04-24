"use client";

import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import type { AdminContentMediaSummaryDto } from "../../lib/family/admin-contracts";
import { adminParseJson } from "../../lib/family/admin-json";
import { postFormDataWithUploadProgress } from "../../lib/admin/upload-form-data-with-progress";
import { initialUploadState, type UploadState } from "../../lib/admin/upload-state";
import { AdminInlineAlert } from "./admin-inline-alert";
import { FileReplaceButton } from "./file-replace-button";
import { UploadProgressCard } from "./upload-progress-card";

export function UploadFieldBase({
  accepted,
  endpoint,
  hint,
  label,
  onSuccess,
  detailedUploadProgress = false
}: Readonly<{
  label: string;
  hint: string;
  endpoint: string;
  accepted: string;
  onSuccess: (next: AdminContentMediaSummaryDto) => void;
  /** Video y archivos grandes: XHR + barra de progreso real (poster/thumbnail siguen con fetch). */
  detailedUploadProgress?: boolean;
}>) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>(() => initialUploadState());
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  useEffect(() => {
    return () => {
      xhrRef.current?.abort();
    };
  }, []);

  function resetProgress() {
    setUploadState(initialUploadState());
  }

  function onRetry() {
    setError(null);
    resetProgress();
  }

  async function onSubmit(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    setError(null);
    setSuccess(null);
    resetProgress();

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

    if (detailedUploadProgress) {
      setUploadState({
        status: "uploading",
        progress: 0,
        loadedBytes: 0,
        totalBytes: selected.size,
        fileName: selected.name
      });
      setBusy(true);

      const parsed = await postFormDataWithUploadProgress<{ item: AdminContentMediaSummaryDto }>(
        endpoint,
        payload,
        selected.size,
        ({ progress, loadedBytes, totalBytes }) => {
          setUploadState({
            status: "uploading",
            progress,
            loadedBytes,
            totalBytes,
            fileName: selected.name
          });
        },
        xhrRef
      );

      setBusy(false);

      if (!parsed.ok) {
        setUploadState({
          status: "error",
          progress: 0,
          loadedBytes: 0,
          totalBytes: selected.size,
          fileName: selected.name,
          error: parsed.message
        });
        return;
      }

      onSuccess(parsed.data.item);
      setUploadState({
        status: "success",
        progress: 100,
        loadedBytes: selected.size,
        totalBytes: selected.size,
        fileName: selected.name
      });
      setSuccess("Archivo guardado correctamente.");
      formEl.reset();

      window.setTimeout(() => {
        resetProgress();
      }, 2800);
      return;
    }

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

  const fileInputLocked =
    busy || (detailedUploadProgress && (uploadState.status === "uploading" || uploadState.status === "success"));
  const submitLocked = detailedUploadProgress && uploadState.status === "success";

  return (
    <form
      className={[
        "hf-admin-upload-form",
        detailedUploadProgress ? "hf-admin-upload-form--premium-upload" : ""
      ]
        .filter(Boolean)
        .join(" ")}
      onSubmit={(e) => {
        void onSubmit(e);
      }}
    >
      <p className="hf-admin-upload-form-title">{label}</p>
      <p className="hf-admin-upload-form-hint">{hint}</p>
      {error !== null ? <AdminInlineAlert tone="error" text={error} /> : null}
      {success !== null ? <AdminInlineAlert tone="success" text={success} /> : null}

      {detailedUploadProgress && uploadState.status !== "idle" ? (
        <UploadProgressCard
          {...(uploadState.error !== undefined ? { error: uploadState.error } : {})}
          fileName={uploadState.fileName ?? "Archivo"}
          loadedBytes={uploadState.loadedBytes}
          onRetry={onRetry}
          progress={uploadState.status === "success" ? 100 : uploadState.progress}
          status={uploadState.status}
          totalBytes={uploadState.totalBytes > 0 ? uploadState.totalBytes : 1}
        />
      ) : null}

      <div className="hf-admin-upload-form-row">
        <input
          accept={accepted}
          className="hf-admin-input hf-admin-upload-form-input"
          disabled={fileInputLocked}
          name="file"
          type="file"
        />
        <FileReplaceButton
          busy={busy}
          {...(detailedUploadProgress ? { busyLabel: "Enviando…" } : {})}
          disabled={submitLocked}
        />
      </div>
    </form>
  );
}

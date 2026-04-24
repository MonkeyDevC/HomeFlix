"use client";

import { formatBytes, formatRemainingBytes } from "../../lib/admin/format-bytes";
import { ProgressBar } from "./progress-bar";

export type UploadProgressCardStatus = "uploading" | "success" | "error";

export type UploadProgressCardProps = Readonly<{
  fileName: string;
  progress: number;
  loadedBytes: number;
  totalBytes: number;
  status: UploadProgressCardStatus;
  error?: string;
  onRetry?: () => void;
}>;

function headline(status: UploadProgressCardStatus): string {
  if (status === "uploading") return "Subiendo video";
  if (status === "success") return "";
  return "Error al subir";
}

export function UploadProgressCard({
  fileName,
  progress,
  loadedBytes,
  totalBytes,
  status,
  error,
  onRetry
}: UploadProgressCardProps) {
  const safeTotal = totalBytes > 0 ? totalBytes : 1;
  const pct = status === "success" ? 100 : Math.max(0, Math.min(100, progress));
  const remaining =
    status === "uploading" ? Math.max(0, safeTotal - Math.min(loadedBytes, safeTotal)) : 0;

  return (
    <div
      className={[
        "hf-admin-upload-progress-card",
        "hf-admin-upload-progress-card--premium",
        status === "error" ? "hf-admin-upload-progress-card--error" : "",
        status === "success" ? "hf-admin-upload-progress-card--success" : ""
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {headline(status) !== "" ? (
        <p className="hf-admin-upload-progress-card__eyebrow">{headline(status)}</p>
      ) : null}

      <h3 className="hf-admin-upload-progress-card__filename" title={fileName}>
        {fileName}
      </h3>

      {status === "uploading" ? (
        <>
          <div aria-live="polite" className="hf-admin-upload-progress-card__pct-big">
            {pct}
            <span className="hf-admin-upload-progress-card__pct-suffix">%</span>
          </div>

          <ProgressBar progress={pct} variant="neon" />

          <p className="hf-admin-upload-progress-card__bytes-main">
            {formatBytes(Math.min(loadedBytes, safeTotal))} / {formatBytes(safeTotal)}
          </p>
          {remaining > 0 ? (
            <p className="hf-admin-upload-progress-card__bytes-remaining">
              faltan {formatRemainingBytes(loadedBytes, safeTotal)}
            </p>
          ) : null}

          <p className="hf-admin-upload-progress-card__window-hint">
            Mantén esta ventana abierta hasta completar.
          </p>
        </>
      ) : null}

      {status === "success" ? (
        <>
          <div className="hf-admin-upload-progress-card__pct-big hf-admin-upload-progress-card__pct-big--success">
            100<span className="hf-admin-upload-progress-card__pct-suffix">%</span>
          </div>
          <ProgressBar progress={100} variant="neon" />
          <p className="hf-admin-upload-progress-card__status-ok">Upload completado</p>
        </>
      ) : null}

      {status === "error" ? (
        <>
          {pct > 0 ? (
            <>
              <div className="hf-admin-upload-progress-card__pct-big hf-admin-upload-progress-card__pct-big--warn">
                {pct}
                <span className="hf-admin-upload-progress-card__pct-suffix">%</span>
              </div>
              <ProgressBar progress={pct} variant="neon" />
              <p className="hf-admin-upload-progress-card__bytes-main">
                {formatBytes(Math.min(loadedBytes, safeTotal))} / {formatBytes(safeTotal)}
              </p>
            </>
          ) : null}
          <p className="hf-admin-upload-progress-card__status-err" role="alert">
            {error ?? "No se pudo completar la subida."}
          </p>
        </>
      ) : null}

      {status === "error" && onRetry !== undefined ? (
        <button className="hf-admin-upload-progress-card__retry" onClick={onRetry} type="button">
          Reintentar
        </button>
      ) : null}
    </div>
  );
}

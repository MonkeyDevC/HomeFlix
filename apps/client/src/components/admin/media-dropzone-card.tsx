"use client";

import { useRef, useState, type DragEvent } from "react";
import type { AdminContentMediaSummaryDto } from "../../lib/family/admin-contracts";
import { adminParseJson } from "../../lib/family/admin-json";
import { IconFilm, IconSpinner } from "./admin-nav-icons";

type DropzoneKind = "video" | "poster" | "thumbnail";

type DropzoneVariant = "large" | "compact";

type Props = Readonly<{
  contentId: string | null;
  kind: DropzoneKind;
  variant: DropzoneVariant;
  currentPath: string | null;
  qualityLabel?: string | null;
  /** Códec detectado del asset actual (para sugerir reparación si es AV1/HEVC). */
  codec?: string | null;
  onUploaded: (summary: AdminContentMediaSummaryDto) => void;
  disabledReason?: string | null;
}>;

/** Códecs que el navegador decodifica de forma confiable. Fuera de aquí:
 * conviene pasar por el botón "Reparar reproducción". */
const BROWSER_FRIENDLY_CODECS = new Set(["h264", "avc1", "vp8", "vp9"]);

const ACCEPT_MAP: Record<DropzoneKind, string> = {
  video: "video/mp4,.mp4",
  poster: "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp",
  thumbnail: "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
};

const LABEL_MAP: Record<DropzoneKind, string> = {
  video: "DROP VIDEO HERE",
  poster: "Poster",
  thumbnail: "Thumbnail"
};

const HINT_MAP: Record<DropzoneKind, string> = {
  video: "MP4 hasta 300 MiB · se convierte a H.264 en el servidor si hace falta (sin pérdida visible)",
  poster: "JPG / PNG / WebP · máx. 10 MiB",
  thumbnail: "JPG / PNG / WebP · máx. 10 MiB"
};

function filenameFromPath(p: string | null): string | null {
  if (p === null) return null;
  const parts = p.split("/");
  return parts[parts.length - 1] ?? p;
}

export function MediaDropzoneCard({
  contentId,
  kind,
  variant,
  currentPath,
  qualityLabel,
  codec,
  onUploaded,
  disabledReason
}: Props) {
  const [busy, setBusy] = useState(false);
  const [repairing, setRepairing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const disabled = contentId === null || busy || repairing;

  const normalizedCodec = codec?.trim().toLowerCase() ?? null;
  const needsRepair =
    kind === "video" &&
    currentPath !== null &&
    normalizedCodec !== null &&
    normalizedCodec !== "" &&
    !BROWSER_FRIENDLY_CODECS.has(normalizedCodec);

  async function repairPlayback() {
    if (contentId === null) return;
    setRepairing(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/family/admin/content/${contentId}/media/video/transcode`,
        {
          method: "POST",
          credentials: "include"
        }
      );
      const parsed = await adminParseJson<{ item: AdminContentMediaSummaryDto }>(res);
      if (!parsed.ok) {
        setError(parsed.message);
        return;
      }
      onUploaded(parsed.data.item);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo reparar el video.");
    } finally {
      setRepairing(false);
    }
  }

  async function uploadFile(file: File) {
    if (contentId === null) {
      setError(disabledReason ?? "Guarda primero el borrador para subir archivos.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const endpoint = `/api/family/admin/content/${contentId}/media/${kind}`;
      const payload = new FormData();
      payload.append("file", file);
      const res = await fetch(endpoint, {
        method: "POST",
        credentials: "include",
        body: payload
      });
      const parsed = await adminParseJson<{ item: AdminContentMediaSummaryDto }>(res);
      if (!parsed.ok) {
        setError(parsed.message);
        return;
      }
      onUploaded(parsed.data.item);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fallo inesperado al subir.");
    } finally {
      setBusy(false);
    }
  }

  function onPick() {
    if (disabled) return;
    inputRef.current?.click();
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file !== undefined) {
      void uploadFile(file);
    }
    e.target.value = "";
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    if (file !== undefined) {
      void uploadFile(file);
    }
  }

  function onDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setDragActive(true);
  }

  function onDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }

  const hasFile = currentPath !== null;
  const filename = filenameFromPath(currentPath);

  return (
    <div
      className={[
        "hf-admin-dropzone",
        `hf-admin-dropzone--${variant}`,
        `hf-admin-dropzone--${kind}`,
        dragActive ? "is-drag" : "",
        hasFile ? "is-filled" : "",
        disabled ? "is-disabled" : "",
        busy ? "is-busy" : ""
      ]
        .filter(Boolean)
        .join(" ")}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      onClick={onPick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onPick();
        }
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_MAP[kind]}
        onChange={onInputChange}
        hidden
      />
      <div className="hf-admin-dropzone__inner">
        {busy ? (
          <div className="hf-admin-dropzone__status">
            <IconSpinner className="hf-admin-dropzone__spinner" width={28} height={28} />
            <span>Subiendo…</span>
          </div>
        ) : hasFile ? (
          <div className="hf-admin-dropzone__filled">
            <IconFilm className="hf-admin-dropzone__icon-small" width={24} height={24} />
            <div className="hf-admin-dropzone__filled-copy">
              <span className="hf-admin-dropzone__filled-title">{filename}</span>
              {qualityLabel !== undefined && qualityLabel !== null && qualityLabel !== "" ? (
                <span className="hf-admin-dropzone__filled-meta">{qualityLabel}</span>
              ) : null}
              {needsRepair ? (
                <span className="hf-admin-dropzone__filled-warn">
                  Códec {normalizedCodec} — puede no reproducir en todos los navegadores.
                </span>
              ) : null}
              <span className="hf-admin-dropzone__filled-hint">Click para reemplazar</span>
              {needsRepair ? (
                <button
                  type="button"
                  className="hf-admin-dropzone__repair"
                  onClick={(e) => {
                    e.stopPropagation();
                    void repairPlayback();
                  }}
                  disabled={repairing}
                >
                  {repairing ? (
                    <>
                      <IconSpinner width={14} height={14} />
                      Reparando…
                    </>
                  ) : (
                    "Reparar reproducción (convertir a H.264)"
                  )}
                </button>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="hf-admin-dropzone__empty">
            <DropzoneIcon kind={kind} variant={variant} />
            <p className="hf-admin-dropzone__label">
              {variant === "large" ? LABEL_MAP[kind] : `${LABEL_MAP[kind]} (upload)`}
            </p>
            {variant === "large" ? (
              <button
                type="button"
                className="hf-admin-dropzone__cta"
                onClick={(e) => {
                  e.stopPropagation();
                  onPick();
                }}
                disabled={disabled}
              >
                o seleccionar archivo
              </button>
            ) : null}
            <p className="hf-admin-dropzone__hint">{HINT_MAP[kind]}</p>
          </div>
        )}
      </div>
      {error !== null ? (
        <p className="hf-admin-dropzone__error" role="alert">
          {error}
        </p>
      ) : null}
      {disabled && !busy && contentId === null && disabledReason !== null && disabledReason !== undefined ? (
        <p className="hf-admin-dropzone__disabled-hint">{disabledReason}</p>
      ) : null}
    </div>
  );
}

function DropzoneIcon({ kind, variant }: Readonly<{ kind: DropzoneKind; variant: DropzoneVariant }>) {
  const size = variant === "large" ? 40 : 28;
  if (kind === "video") {
    return (
      <svg
        className="hf-admin-dropzone__icon"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
        <path d="M14 3v5h5" />
        <path d="M12 18v-6" />
        <path d="M9 15l3-3 3 3" />
      </svg>
    );
  }
  return (
    <svg
      className="hf-admin-dropzone__icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="M21 15l-4.5-4.5a2 2 0 0 0-2.83 0L3 21" />
    </svg>
  );
}

"use client";

import { useEffect, useRef, useState, type DragEvent, type MutableRefObject } from "react";
import type { AdminContentMediaSummaryDto } from "../../lib/family/admin-contracts";
import { FAMILY_VIDEO_FILE_ACCEPT, FAMILY_VIDEO_FORMAT_LABEL } from "../../lib/family/allowed-video-upload";
import { validateClientImageUploadRules, validateImageFileForIntent } from "../../lib/admin/image-validation";
import { adminParseJson } from "../../lib/family/admin-json";
import { IconFilm, IconSpinner } from "./admin-nav-icons";
import { ImageReviewCard } from "./image-review-card";

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
  /** Solo poster/thumbnail: aviso de revisión para el paso Media del asistente. */
  onImageReviewGate?: (canProceed: boolean) => void;
}>;

/** Códecs que el navegador decodifica de forma confiable. Fuera de aquí:
 * conviene pasar por el botón "Reparar reproducción". */
const BROWSER_FRIENDLY_CODECS = new Set(["h264", "avc1", "vp8", "vp9"]);

const ACCEPT_MAP: Record<DropzoneKind, string> = {
  video: FAMILY_VIDEO_FILE_ACCEPT,
  poster: "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp",
  thumbnail: "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
};

const LABEL_MAP: Record<DropzoneKind, string> = {
  video: "DROP VIDEO HERE",
  poster: "Poster",
  thumbnail: "Thumbnail"
};

const HINT_MAP: Record<DropzoneKind, string> = {
  video: `${FAMILY_VIDEO_FORMAT_LABEL} · máx. 5 GiB · H.264 en servidor si hace falta (sin pérdida visible)`,
  poster: "JPG / PNG / WebP · máx. 10 MiB",
  thumbnail: "JPG / PNG / WebP · máx. 10 MiB"
};

function filenameFromPath(p: string | null): string | null {
  if (p === null) return null;
  const parts = p.split("/");
  return parts[parts.length - 1] ?? p;
}

type UploadJsonResult =
  | { ok: true; item: AdminContentMediaSummaryDto }
  | { ok: false; message: string };

function readErrorFromJsonText(text: string): string | null {
  try {
    const j = JSON.parse(text) as { message?: string; error?: string };
    if (typeof j.message === "string" && j.message.length > 0) return j.message;
    if (typeof j.error === "string" && j.error.length > 0) return j.error;
  } catch {
    /* ignore */
  }
  return null;
}

function parseMediaUploadResponse(status: number, text: string): UploadJsonResult {
  if (status < 200 || status >= 300) {
    const fromBody = readErrorFromJsonText(text);
    return {
      ok: false,
      message: fromBody ?? `Error ${status}`
    };
  }
  try {
    const data = JSON.parse(text) as { item?: AdminContentMediaSummaryDto };
    if (data?.item !== undefined) {
      return { ok: true, item: data.item };
    }
    return { ok: false, message: "Respuesta inesperada del servidor." };
  } catch {
    return { ok: false, message: "No se pudo leer la respuesta del servidor." };
  }
}

/**
 * POST multipart con cookies; progreso real del body (XHR upload).
 * El 100 % indica bytes enviados; el servidor puede tardar un poco más en responder.
 */
function postFormDataWithUploadProgress(
  url: string,
  formData: FormData,
  xhrRef: MutableRefObject<XMLHttpRequest | null>,
  onProgress: (info: { percent: number | null }) => void
): Promise<UploadJsonResult> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;
    xhr.open("POST", url);
    xhr.withCredentials = true;
    xhr.responseType = "text";

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && e.total > 0) {
        const pct = Math.min(100, Math.round((100 * e.loaded) / e.total));
        onProgress({ percent: pct });
      } else {
        onProgress({ percent: null });
      }
    });

    xhr.addEventListener("load", () => {
      xhrRef.current = null;
      onProgress({ percent: 100 });
      resolve(parseMediaUploadResponse(xhr.status, xhr.responseText));
    });

    xhr.addEventListener("error", () => {
      xhrRef.current = null;
      resolve({ ok: false, message: "Fallo de red al subir el archivo." });
    });

    xhr.addEventListener("abort", () => {
      xhrRef.current = null;
      resolve({ ok: false, message: "Subida cancelada." });
    });

    xhr.send(formData);
  });
}

export function MediaDropzoneCard({
  contentId,
  kind,
  variant,
  currentPath,
  qualityLabel,
  codec,
  onUploaded,
  disabledReason,
  onImageReviewGate
}: Props) {
  const [busy, setBusy] = useState(false);
  /** 0–100 durante subida; `null` = progreso no computable en este navegador. */
  const [uploadPercent, setUploadPercent] = useState<number | null>(0);
  const [uploadName, setUploadName] = useState<string | null>(null);
  const [repairing, setRepairing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const uploadXhrRef = useRef<XMLHttpRequest | null>(null);

  useEffect(() => {
    return () => {
      uploadXhrRef.current?.abort();
    };
  }, []);

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
    if (kind === "poster" || kind === "thumbnail") {
      const rules = validateClientImageUploadRules(file);
      if (!rules.ok) {
        setError(rules.message);
        return;
      }
      const pre = await validateImageFileForIntent(kind, file);
      if ("error" in pre) {
        setError(pre.error);
        return;
      }
      if (!pre.isValid) {
        setError(pre.warnings[0] ?? "La imagen no cumple el mínimo para este uso.");
        return;
      }
    }
    setBusy(true);
    setError(null);
    setUploadName(file.name);
    setUploadPercent(0);
    try {
      const endpoint = `/api/family/admin/content/${contentId}/media/${kind}`;
      const payload = new FormData();
      payload.append("file", file);
      const parsed = await postFormDataWithUploadProgress(
        endpoint,
        payload,
        uploadXhrRef,
        ({ percent }) => {
          setUploadPercent(percent);
        }
      );
      if (!parsed.ok) {
        setError(parsed.message);
        return;
      }
      onUploaded(parsed.item);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fallo inesperado al subir.");
    } finally {
      setBusy(false);
      setUploadName(null);
      setUploadPercent(0);
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

  const showImageReview =
    kind !== "video" && currentPath !== null && onImageReviewGate !== undefined;

  return (
    <div className="hf-admin-dropzone-stack">
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
          <div className="hf-admin-dropzone__status hf-admin-dropzone__status--progress">
            <div
              className="hf-admin-dropzone__progress-track"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={uploadPercent ?? undefined}
              aria-valuetext={
                uploadPercent === null
                  ? "Subiendo, porcentaje desconocido"
                  : uploadPercent >= 100
                    ? "Finalizando en el servidor"
                    : `Subiendo, ${uploadPercent} por ciento`
              }
            >
              <div
                className={[
                  "hf-admin-dropzone__progress-fill",
                  uploadPercent === null ? "is-indeterminate" : ""
                ]
                  .filter(Boolean)
                  .join(" ")}
                style={
                  uploadPercent === null
                    ? undefined
                    : { width: `${Math.max(0, Math.min(100, uploadPercent))}%` }
                }
              />
            </div>
            <div className="hf-admin-dropzone__progress-meta">
              <span className="hf-admin-dropzone__progress-label">
                {uploadPercent === null
                  ? "Subiendo…"
                  : uploadPercent < 100
                    ? `Subiendo… ${uploadPercent} %`
                    : "Finalizando en el servidor…"}
              </span>
              {uploadName !== null && uploadName !== "" ? (
                <span className="hf-admin-dropzone__progress-file" title={uploadName}>
                  {uploadName}
                </span>
              ) : null}
            </div>
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
      {showImageReview ? (
        <ImageReviewCard
          key={`${kind}-${currentPath}`}
          intent={kind === "poster" ? "poster" : "thumbnail"}
          imageUrl={currentPath}
          onReplace={() => {
            inputRef.current?.click();
          }}
          onGateChange={onImageReviewGate}
        />
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

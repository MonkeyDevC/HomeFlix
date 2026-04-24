"use client";

import { useEffect, useState } from "react";
import {
  formatAspectRatioLabel,
  type ImageReviewIntent,
  type ImageValidationResult,
  validateImageUrlForIntent
} from "../../lib/admin/image-validation";

type Props = Readonly<{
  intent: ImageReviewIntent;
  imageUrl: string;
  onReplace: () => void;
  /** `true` cuando se puede avanzar el asistente (válida sin advertencias, o aceptada con advertencias). */
  onGateChange: (canProceed: boolean) => void;
}>;

function statusFromResult(
  intent: ImageReviewIntent,
  result: ImageValidationResult | null,
  loadError: string | null,
  acceptedWarnings: boolean
): { label: string; tone: "pending" | "ok" | "warn" | "bad" } {
  if (loadError !== null) {
    return { label: loadError, tone: "bad" };
  }
  if (result === null) {
    return { label: "Analizando imagen…", tone: "pending" };
  }
  if (!result.isValid) {
    const first = result.warnings[0];
    return { label: first ?? "Imagen no válida", tone: "bad" };
  }
  if (result.warnings.length === 0) {
    return {
      label: intent === "poster" ? "Lista para móvil y tarjetas" : "Lista para TV y escritorio",
      tone: "ok"
    };
  }
  return {
    label: acceptedWarnings ? "Aceptada con advertencias" : "Revisá las advertencias y confirmá",
    tone: "warn"
  };
}

const COPY: Record<
  ImageReviewIntent,
  { title: string; blurb: string; previewAspectClass: string }
> = {
  poster: {
    title: "Poster",
    blurb: "Esta imagen se usará en tarjetas verticales y pantallas móviles.",
    previewAspectClass: "hf-admin-image-review__preview--poster"
  },
  thumbnail: {
    title: "Thumbnail / Hero",
    blurb: "Esta imagen se usará en hero, carruseles horizontales y pantallas grandes.",
    previewAspectClass: "hf-admin-image-review__preview--thumb"
  }
};

export function ImageReviewCard({ intent, imageUrl, onReplace, onGateChange }: Props) {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [result, setResult] = useState<ImageValidationResult | null>(null);
  const [acceptedWarnings, setAcceptedWarnings] = useState(false);

  useEffect(() => {
    setAcceptedWarnings(false);
    setLoadError(null);
    setResult(null);
    setLoading(true);
    let cancelled = false;

    void (async () => {
      const r = await validateImageUrlForIntent(intent, imageUrl);
      if (cancelled) return;
      setLoading(false);
      if ("error" in r) {
        setLoadError(r.error);
        setResult(null);
        return;
      }
      setLoadError(null);
      setResult(r);
    })();

    return () => {
      cancelled = true;
    };
  }, [intent, imageUrl]);

  useEffect(() => {
    if (loading) {
      onGateChange(false);
      return;
    }
    if (loadError !== null) {
      onGateChange(false);
      return;
    }
    if (result === null) {
      onGateChange(false);
      return;
    }
    if (!result.isValid) {
      onGateChange(false);
      return;
    }
    if (result.warnings.length > 0) {
      onGateChange(acceptedWarnings);
      return;
    }
    onGateChange(true);
  }, [acceptedWarnings, loadError, loading, onGateChange, result]);

  const meta = COPY[intent];
  const status = statusFromResult(intent, result, loadError, acceptedWarnings);
  const showAccept =
    result !== null && result.isValid && result.warnings.length > 0 && !acceptedWarnings;

  return (
    <div className="hf-admin-image-review">
      <div className="hf-admin-image-review__head">
        <span className="hf-admin-image-review__title">{meta.title}</span>
        <span
          className={[
            "hf-admin-image-review__badge",
            `hf-admin-image-review__badge--${status.tone}`
          ].join(" ")}
        >
          {status.tone === "ok" ? "✔ " : status.tone === "warn" ? "⚠ " : status.tone === "bad" ? "✖ " : ""}
          {status.label}
        </span>
      </div>
      <p className="hf-admin-image-review__blurb">{meta.blurb}</p>
      <div className={`hf-admin-image-review__preview ${meta.previewAspectClass}`}>
        <img alt="" className="hf-admin-image-review__img" decoding="async" src={imageUrl} />
      </div>
      {!loading && result !== null && loadError === null ? (
        <dl className="hf-admin-image-review__meta">
          <div className="hf-admin-image-review__meta-row">
            <dt>Resolución</dt>
            <dd>
              {result.width} × {result.height}
            </dd>
          </div>
          <div className="hf-admin-image-review__meta-row">
            <dt>Proporción</dt>
            <dd>{formatAspectRatioLabel(result.width, result.height)}</dd>
          </div>
        </dl>
      ) : loading ? (
        <p className="hf-admin-image-review__hint">Midiendo píxeles y proporción…</p>
      ) : null}

      {result !== null && result.warnings.length > 0 ? (
        <ul className="hf-admin-image-review__warnings">
          {result.warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      ) : null}

      <div className="hf-admin-image-review__actions">
        <button type="button" className="hf-admin-wizard__ghost hf-admin-image-review__action" onClick={onReplace}>
          Reemplazar
        </button>
        {showAccept ? (
          <button
            type="button"
            className="hf-admin-wizard__primary hf-admin-image-review__action"
            onClick={() => {
              setAcceptedWarnings(true);
            }}
          >
            Aceptar con advertencias
          </button>
        ) : null}
      </div>
    </div>
  );
}

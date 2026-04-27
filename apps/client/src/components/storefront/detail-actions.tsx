"use client";

import { useCallback, useState } from "react";
import { DETAIL_PLAY_EVENT } from "./detail-player";

export function DetailActions({
  canPlay,
  resumeLabel,
  isPhotoGallery
}: Readonly<{
  canPlay: boolean;
  resumeLabel: string | null;
  isPhotoGallery?: boolean;
}>) {
  const [listed, setListed] = useState(false);
  const [liked, setLiked] = useState(false);

  const handlePlay = useCallback(() => {
    if (isPhotoGallery === true) {
      document.getElementById("photo-gallery-viewer")?.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
      return;
    }
    if (!canPlay) {
      const el = document.getElementById("detail-player");
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    window.dispatchEvent(new CustomEvent(DETAIL_PLAY_EVENT));
  }, [canPlay, isPhotoGallery]);

  return (
    <div className="sf-detail-actions" role="group" aria-label="Acciones del contenido">
      <button
        aria-label={
          isPhotoGallery === true
            ? "Ir a la galería de fotos"
            : resumeLabel !== null
              ? `Continuar desde ${resumeLabel}`
              : "Reproducir ahora"
        }
        className="sf-detail-btn sf-detail-btn--primary"
        onClick={handlePlay}
        type="button"
      >
        {isPhotoGallery === true ? (
          <svg aria-hidden="true" height="20" viewBox="0 0 24 24" width="20">
            <path
              d="M4 6h7v7H4V6zm9 0h7v4h-7V6zM4 15h7v3H4v-3zm9 0h7v3h-7v-3z"
              fill="currentColor"
            />
          </svg>
        ) : (
          <svg aria-hidden="true" height="20" viewBox="0 0 24 24" width="20">
            <path d="M8 5v14l11-7z" fill="currentColor" />
          </svg>
        )}
        <span>
          {isPhotoGallery === true
            ? "Ver galería"
            : resumeLabel !== null
              ? "Seguir viendo"
              : "Ver ahora"}
        </span>
      </button>

      <button
        aria-label={listed ? "Quitar de Mi lista" : "Añadir a Mi lista"}
        aria-pressed={listed}
        className={`sf-detail-btn sf-detail-btn--ghost${listed ? " is-active" : ""}`}
        onClick={() => setListed((v) => !v)}
        type="button"
      >
        <svg aria-hidden="true" height="20" viewBox="0 0 24 24" width="20">
          {listed ? (
            <path
              d="M9.5 17.5 4 12l1.4-1.4 4.1 4.1 9.1-9.1L20 7z"
              fill="currentColor"
            />
          ) : (
            <path
              d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z"
              fill="currentColor"
            />
          )}
        </svg>
        <span>{listed ? "En mi lista" : "Mi lista"}</span>
      </button>

      <button
        aria-label={liked ? "Quitar me gusta" : "Me gusta"}
        aria-pressed={liked}
        className={`sf-detail-btn sf-detail-btn--round${liked ? " is-active" : ""}`}
        onClick={() => setLiked((v) => !v)}
        type="button"
      >
        <svg aria-hidden="true" height="20" viewBox="0 0 24 24" width="20">
          <path
            d="M2 20h3V9H2v11zm19-10c0-1.1-.9-2-2-2h-5.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L13.17 1 7.59 6.59C7.22 6.95 7 7.45 7 8v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-1z"
            fill="currentColor"
          />
        </svg>
      </button>
    </div>
  );
}

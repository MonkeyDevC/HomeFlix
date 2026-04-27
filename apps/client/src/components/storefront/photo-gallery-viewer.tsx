"use client";

import { useCallback, useEffect, useState } from "react";
import type { PhotoAssetPublicDto } from "../../lib/family/domain-shapes";

type ViewerProps = Readonly<{
  title: string;
  photos: readonly PhotoAssetPublicDto[];
}>;

/**
 * Visor sencillo: imagen central, tira de miniaturas, anterior/siguiente, pantalla completa opcional.
 */
export function PhotoGalleryViewer({ title, photos }: ViewerProps) {
  const [index, setIndex] = useState(0);
  const n = photos.length;
  const current = photos[index] ?? null;

  const go = useCallback(
    (delta: number) => {
      if (n === 0) return;
      setIndex((i) => {
        const next = (i + delta + n) % n;
        return next;
      });
    },
    [n]
  );

  useEffect(() => {
    if (index >= n) {
      setIndex(0);
    }
  }, [index, n]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        go(1);
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(-1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  if (n === 0 || current === null) {
    return null;
  }

  return (
    <div className="sf-photo-viewer" aria-label={`Galería: ${title}`}>
      <div className="sf-photo-viewer__head">
        <p className="sf-photo-viewer__counter" aria-live="polite">
          {index + 1} de {n}
        </p>
        <div className="sf-photo-viewer__controls">
          <button
            type="button"
            className="sf-photo-viewer__nav"
            onClick={() => go(-1)}
            aria-label="Foto anterior"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
            </svg>
          </button>
          <button
            type="button"
            className="sf-photo-viewer__nav"
            onClick={() => go(1)}
            aria-label="Foto siguiente"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M8.59 16.59 10 18l6-6-6-6-1.41 1.41L13.17 12z" />
            </svg>
          </button>
        </div>
      </div>

      <button
        type="button"
        className="sf-photo-viewer__main"
        onClick={() => go(1)}
        aria-label="Avanzar a la siguiente imagen"
      >
        <img
          alt={title}
          className="sf-photo-viewer__img"
          height={current.height ?? 800}
          width={current.width ?? 1200}
          src={current.url}
          sizes="(max-width: 900px) 100vw, min(1000px, 96vw)"
        />
      </button>

      <div className="sf-photo-viewer__strip" role="tablist" aria-label="Miniaturas">
        {photos.map((p, i) => {
          const active = i === index;
          return (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={active}
              className={`sf-photo-viewer__thumb${active ? " is-active" : ""}`}
              onClick={() => setIndex(i)}
            >
              <img alt="" className="sf-photo-viewer__thumb-img" height={64} width={64} src={p.url} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

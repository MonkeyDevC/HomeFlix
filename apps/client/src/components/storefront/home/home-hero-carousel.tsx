"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatRuntimeMinutes } from "../../../lib/family/playback-time";
import type { FamilyHomeCardDto } from "../../../lib/family/storefront-contracts";
import { useWatchlist } from "./watchlist-context";

const ROTATION_INTERVAL_MS = 7500;
const EXCERPT_MAX = 220;

function excerpt(text: string | null): string {
  if (text === null || text.trim() === "") {
    return "Contenido disponible para este perfil. Disfruta de esta seleccion especialmente para ti.";
  }
  const clean = text.trim();
  return clean.length <= EXCERPT_MAX ? clean : `${clean.slice(0, EXCERPT_MAX).trim()}...`;
}

function heroGradient(seed: string): string {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(index);
    hash |= 0;
  }
  const hue = Math.abs(hash) % 360;
  return `linear-gradient(135deg, hsl(${hue}, 58%, 18%) 0%, rgba(10, 10, 14, 0.92) 55%, #040404 100%)`;
}

function formatTypeLabel(item: FamilyHomeCardDto): string | null {
  if (item.kind === "series") {
    return item.episodeCount > 1 ? `Serie · ${item.episodeCount} episodios` : "Serie";
  }
  switch (item.type) {
    case "movie":
      return "Pelicula";
    case "episode":
      return "Episodio";
    case "clip":
      return "Clip";
    default:
      return item.type;
  }
}

function featuredHref(item: FamilyHomeCardDto): string {
  return item.kind === "series"
    ? `/series/${encodeURIComponent(item.slug)}`
    : `/c/${encodeURIComponent(item.slug)}`;
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function HomeHeroCarousel({
  items,
  profileName
}: Readonly<{
  items: readonly FamilyHomeCardDto[];
  profileName: string;
}>) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const watchlist = useWatchlist();

  const clampIndex = useCallback(
    (value: number): number => {
      const length = items.length;
      if (length === 0) return 0;
      const modulo = ((value % length) + length) % length;
      return modulo;
    },
    [items.length]
  );

  useEffect(() => {
    if (items.length <= 1) return undefined;
    if (isPaused) return undefined;
    if (prefersReducedMotion()) return undefined;

    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => clampIndex(prev + 1));
    }, ROTATION_INTERVAL_MS);

    return () => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [clampIndex, isPaused, items.length]);

  const go = useCallback(
    (direction: 1 | -1) => {
      setActiveIndex((prev) => clampIndex(prev + direction));
    },
    [clampIndex]
  );

  const featured = items[activeIndex] ?? items[0] ?? null;
  const isFallback = featured === null;

  const heroImage = featured?.thumbnailPath ?? featured?.posterPath ?? null;
  const heroVideoUrl =
    featured === null || featured.previewVideoAssetId === null
      ? null
      : `/api/family/media/${encodeURIComponent(featured.previewVideoAssetId)}`;

  const metadata = useMemo<readonly string[]>(() => {
    if (featured === null) return [];
    return [
      formatRuntimeMinutes(featured.durationSeconds ?? null),
      formatTypeLabel(featured),
      featured.category?.name ?? null
    ].filter((value): value is string => value !== null && value.trim() !== "");
  }, [featured]);

  const detailHref = featured === null ? null : featuredHref(featured);
  const isSaved = featured === null ? false : watchlist.isInWatchlist({ kind: featured.kind, id: featured.id });
  const isBusy = featured === null ? false : watchlist.isPending({ kind: featured.kind, id: featured.id });

  const handleToggleWatchlist = useCallback(() => {
    if (featured === null) return;
    void watchlist.toggle({ kind: featured.kind, id: featured.id });
  }, [featured, watchlist]);

  return (
    <section
      aria-labelledby="sf-home-hero-title"
      className={`sf-home-hero${isFallback ? " is-fallback" : ""}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
      style={{ backgroundImage: heroGradient(featured?.id ?? profileName) }}
    >
      <div aria-hidden="true" className="sf-home-hero-media">
        {heroImage ? (
          <img
            alt=""
            className="sf-home-hero-image"
            key={`${featured?.id ?? "empty"}-img`}
            src={heroImage}
          />
        ) : null}
        {heroVideoUrl ? (
          <video
            autoPlay
            className="sf-home-hero-video"
            key={`${featured?.id ?? "empty"}-video`}
            loop
            muted
            playsInline
            poster={heroImage ?? undefined}
            preload="metadata"
            src={heroVideoUrl}
          />
        ) : null}
      </div>

      <div aria-hidden="true" className="sf-home-hero-overlay" />

      <div className="sf-home-hero-inner">
        <div className="sf-home-hero-copy">
          <p className="sf-home-hero-eyebrow">
            {featured ? "Recomendado para ti" : "Perfil activo"}
          </p>
          <h1 className="sf-home-hero-title" id="sf-home-hero-title">
            {featured?.title ?? `Bienvenido, ${profileName}`}
          </h1>
          {metadata.length > 0 ? (
            <div aria-label="Metadata del contenido destacado" className="sf-home-hero-meta">
              {metadata.map((item, index) => (
                <span className="sf-home-hero-meta-item" key={`${item}-${index}`}>
                  {item}
                </span>
              ))}
              <span className="sf-home-hero-rating">APTA</span>
            </div>
          ) : null}
          <p className="sf-home-hero-synopsis">{excerpt(featured?.synopsis ?? null)}</p>

          <div className="sf-home-hero-actions">
            {featured !== null && detailHref !== null ? (
              <>
                <Link className="sf-btn sf-btn-hero-play" href={detailHref}>
                  <span aria-hidden="true" className="sf-home-hero-action-icon">
                    ▶
                  </span>
                  {featured.kind === "series" ? "Ver serie" : "Ver ahora"}
                </Link>
                <Link className="sf-btn sf-btn-hero-info" href={detailHref}>
                  <span aria-hidden="true" className="sf-hero-info-glyph">
                    i
                  </span>
                  Ver detalle
                </Link>
                <button
                  aria-label={isSaved ? "Quitar de Mi lista" : "Agregar a Mi lista"}
                  aria-pressed={isSaved}
                  className={`sf-btn-hero-icon${isSaved ? " is-active" : ""}`}
                  disabled={isBusy}
                  onClick={handleToggleWatchlist}
                  title={isSaved ? "Quitar de Mi lista" : "Agregar a Mi lista"}
                  type="button"
                >
                  {isSaved ? "✓" : "+"}
                </button>
              </>
            ) : (
              <span className="sf-home-hero-empty-cta">
                El Home ya esta listo; aparecera contenido cuando este perfil tenga titulos publicados con acceso.
              </span>
            )}
          </div>

          {items.length > 1 ? (
            <div className="sf-home-hero-dots" role="tablist" aria-label="Recomendaciones destacadas">
              {items.map((item, index) => (
                <button
                  aria-label={`Ir al destacado ${index + 1}: ${item.title}`}
                  aria-selected={index === activeIndex}
                  className={`sf-home-hero-dot${index === activeIndex ? " is-active" : ""}`}
                  key={item.id}
                  onClick={() => setActiveIndex(index)}
                  role="tab"
                  type="button"
                />
              ))}
            </div>
          ) : null}
        </div>

        {featured ? (
          <div aria-hidden="true" className="sf-home-hero-rating-pill">
            <span className="sf-home-hero-rating-pill-icon">◉</span>
            APTA PARA TODO PÚBLICO
          </div>
        ) : null}
      </div>

      {items.length > 1 ? (
        <>
          <button
            aria-label="Destacado anterior"
            className="sf-home-hero-nav sf-home-hero-nav--prev"
            onClick={() => go(-1)}
            type="button"
          >
            ‹
          </button>
          <button
            aria-label="Destacado siguiente"
            className="sf-home-hero-nav sf-home-hero-nav--next"
            onClick={() => go(1)}
            type="button"
          >
            ›
          </button>
        </>
      ) : null}
    </section>
  );
}

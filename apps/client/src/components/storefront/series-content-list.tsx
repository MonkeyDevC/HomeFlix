"use client";

import { useEffect, useMemo, useState } from "react";
import type { DetailEpisodeDto } from "../../lib/server/catalog/content-detail-related";
import { SeriesContentCard } from "./series-content-card";

type SeasonKey = "__all__" | `${number}`;

type SeriesContentListProps = Readonly<{
  episodes: readonly DetailEpisodeDto[];
  /** Etiqueta cuando no hay temporadas numéricas (opción única del desplegable). */
  fallbackLabel: string;
  /** Título de la sección (p. ej. "Episodios y álbumes"). */
  sectionTitle?: string;
}>;

/**
 * Lista de entradas de una serie: episodios, clips y galerías, con selector de
 * temporadas (siempre desplegable: una o más temporadas, o una sola opción si no hay número).
 */
export function SeriesContentList({
  episodes,
  fallbackLabel,
  sectionTitle = "Episodios y álbumes"
}: SeriesContentListProps) {
  const numericSeasons = useMemo(() => {
    const set = new Set<number>();
    for (const ep of episodes) {
      if (ep.seasonNumber !== null && ep.seasonNumber > 0) {
        set.add(ep.seasonNumber);
      }
    }
    return Array.from(set).sort((a, b) => a - b);
  }, [episodes]);

  const initialSeasonKey = useMemo((): SeasonKey => {
    if (numericSeasons.length === 0) {
      return "__all__";
    }
    const current = episodes.find((ep) => ep.isCurrent);
    if (
      current !== undefined &&
      current.seasonNumber !== null &&
      numericSeasons.includes(current.seasonNumber)
    ) {
      return `${current.seasonNumber}`;
    }
    const first = numericSeasons[0];
    return first !== undefined ? `${first}` : "__all__";
  }, [episodes, numericSeasons]);

  const [selectedSeasonKey, setSelectedSeasonKey] = useState<SeasonKey>(initialSeasonKey);

  useEffect(() => {
    setSelectedSeasonKey(initialSeasonKey);
  }, [initialSeasonKey]);

  const visibleEpisodes = useMemo(() => {
    if (selectedSeasonKey === "__all__" || numericSeasons.length === 0) {
      return episodes;
    }
    const n = Number.parseInt(selectedSeasonKey, 10);
    if (!Number.isFinite(n)) return episodes;
    return episodes.filter((ep) => ep.seasonNumber === n);
  }, [episodes, numericSeasons.length, selectedSeasonKey]);

  const count = visibleEpisodes.length;

  const selectLabel =
    selectedSeasonKey === "__all__"
      ? fallbackLabel
      : `Temporada ${selectedSeasonKey}`;

  return (
    <section
      aria-label={sectionTitle}
      className="sf-detail-episodes sf-detail-episodes--mixed"
    >
      <header className="sf-detail-episodes-head">
        <div className="sf-detail-episodes-title-wrap">
          <h2 className="sf-detail-episodes-title">{sectionTitle}</h2>
          <label className="sf-detail-season-select">
            <span className="sf-detail-season-select-label">{selectLabel}</span>
            <select
              aria-label="Seleccionar temporada"
              className="sf-detail-season-select-control"
              onChange={(e) => {
                const v = e.target.value;
                if (v === "__all__") {
                  setSelectedSeasonKey("__all__");
                  return;
                }
                const next = Number.parseInt(v, 10);
                setSelectedSeasonKey(Number.isFinite(next) ? `${next}` : "__all__");
              }}
              value={selectedSeasonKey}
            >
              {numericSeasons.length === 0 ? (
                <option value="__all__">{fallbackLabel}</option>
              ) : (
                numericSeasons.map((s) => (
                  <option key={s} value={s}>
                    Temporada {s}
                  </option>
                ))
              )}
            </select>
            <svg aria-hidden="true" height="14" viewBox="0 0 24 24" width="14">
              <path d="M7 10l5 5 5-5z" fill="currentColor" />
            </svg>
          </label>
        </div>
        <span className="sf-detail-episodes-count">
          {count} {count === 1 ? "entrada" : "entradas"}
        </span>
      </header>

      <ol className="sf-detail-episodes-list">
        {visibleEpisodes.map((ep, idx) => (
          <li key={ep.id}>
            <SeriesContentCard episode={ep} index={idx + 1} />
          </li>
        ))}
      </ol>
    </section>
  );
}

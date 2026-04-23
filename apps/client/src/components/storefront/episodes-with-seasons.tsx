"use client";

import { useMemo, useState } from "react";
import type { DetailEpisodeDto } from "../../lib/server/catalog/content-detail-related";
import { EpisodeCard } from "./episode-card";

/**
 * Lista de episodios con **selector de temporadas funcional**.
 *
 * Reglas:
 *   - Si hay más de una `seasonNumber` declarada, se muestra un `<select>` que
 *     filtra los episodios por temporada.
 *   - Si todos los episodios comparten temporada (o ninguno declara una), se
 *     muestra el `fallbackLabel` (típicamente el nombre de la serie/colección)
 *     y no hay selector.
 *   - Si hay episodio "actual" (`isCurrent`), la temporada inicial se alinea
 *     a la suya para que no desaparezca de la vista al entrar.
 *   - Si no, se parte por la temporada más baja disponible.
 *
 * El componente es cliente para mantener estado local del selector; no lee
 * nada del servidor ni realiza fetches.
 */
export function EpisodesWithSeasons({
  episodes,
  fallbackLabel
}: Readonly<{
  episodes: readonly DetailEpisodeDto[];
  fallbackLabel: string;
}>) {
  const seasons = useMemo(() => {
    const set = new Set<number>();
    for (const ep of episodes) {
      if (ep.seasonNumber !== null && ep.seasonNumber > 0) {
        set.add(ep.seasonNumber);
      }
    }
    return Array.from(set).sort((a, b) => a - b);
  }, [episodes]);

  const hasSeasons = seasons.length >= 2;

  const initialSeason = useMemo<number | null>(() => {
    if (!hasSeasons) return null;
    const current = episodes.find((ep) => ep.isCurrent);
    if (
      current !== undefined &&
      current.seasonNumber !== null &&
      seasons.includes(current.seasonNumber)
    ) {
      return current.seasonNumber;
    }
    return seasons[0] ?? null;
  }, [episodes, hasSeasons, seasons]);

  const [selectedSeason, setSelectedSeason] = useState<number | null>(initialSeason);

  const visibleEpisodes = useMemo(() => {
    if (!hasSeasons || selectedSeason === null) return episodes;
    return episodes.filter((ep) => ep.seasonNumber === selectedSeason);
  }, [episodes, hasSeasons, selectedSeason]);

  const count = visibleEpisodes.length;

  return (
    <section aria-label="Episodios" className="sf-detail-episodes">
      <header className="sf-detail-episodes-head">
        <div className="sf-detail-episodes-title-wrap">
          <h2 className="sf-detail-episodes-title">Episodios</h2>
          {hasSeasons ? (
            <label className="sf-detail-season-select">
              <span className="sf-detail-season-select-label">
                Temporada {selectedSeason ?? ""}
              </span>
              <select
                aria-label="Seleccionar temporada"
                className="sf-detail-season-select-control"
                onChange={(e) => {
                  const next = Number.parseInt(e.target.value, 10);
                  setSelectedSeason(Number.isFinite(next) ? next : null);
                }}
                value={selectedSeason ?? ""}
              >
                {seasons.map((s) => (
                  <option key={s} value={s}>
                    Temporada {s}
                  </option>
                ))}
              </select>
              <svg aria-hidden="true" height="14" viewBox="0 0 24 24" width="14">
                <path d="M7 10l5 5 5-5z" fill="currentColor" />
              </svg>
            </label>
          ) : (
            <span className="sf-detail-episodes-season">{fallbackLabel}</span>
          )}
        </div>
        <span className="sf-detail-episodes-count">
          {count} {count === 1 ? "episodio" : "episodios"}
        </span>
      </header>

      <ol className="sf-detail-episodes-list">
        {visibleEpisodes.map((ep, idx) => (
          <li key={ep.id}>
            <EpisodeCard episode={ep} index={idx + 1} />
          </li>
        ))}
      </ol>
    </section>
  );
}

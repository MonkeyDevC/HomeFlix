import Link from "next/link";
import type { SeriesDetailDto, SeriesEpisodeDto } from "../../lib/server/catalog/series-detail-for-profile";
import { formatRuntimeMinutes } from "../../lib/family/playback-time";
import type { DetailEpisodeDto } from "../../lib/server/catalog/content-detail-related";
import { EpisodesWithSeasons } from "./episodes-with-seasons";

function formatEpisodeCount(count: number): string {
  return count === 1 ? "1 episodio" : `${count} episodios`;
}

/**
 * Elige el episodio "reanudable": primero el que tenga progreso intermedio,
 * si no el primero con media, fallback al primero por posición.
 */
function pickPlayableEpisode(episodes: readonly SeriesEpisodeDto[]): {
  episode: SeriesEpisodeDto;
  isResume: boolean;
} | null {
  if (episodes.length === 0) return null;

  const inProgress = episodes.find((ep) => {
    if (!ep.hasMedia) return false;
    const progress = ep.progressSeconds;
    const duration = ep.durationSeconds;
    if (progress === null || duration === null || duration <= 0) return false;
    const pct = progress / duration;
    return pct > 0.02 && pct < 0.95;
  });
  if (inProgress !== undefined) {
    return { episode: inProgress, isResume: true };
  }

  const firstWithMedia = episodes.find((ep) => ep.hasMedia);
  if (firstWithMedia !== undefined) {
    return { episode: firstWithMedia, isResume: false };
  }

  return { episode: episodes[0]!, isResume: false };
}

function toDetailEpisode(ep: SeriesEpisodeDto): DetailEpisodeDto {
  return {
    id: ep.id,
    slug: ep.slug,
    title: ep.title,
    synopsis: ep.synopsis,
    type: ep.type,
    thumbnailPath: ep.thumbnailPath,
    posterPath: ep.posterPath,
    position: ep.position,
    seasonNumber: ep.seasonNumber,
    episodeNumber: ep.episodeNumber,
    durationSeconds: ep.durationSeconds,
    progressSeconds: ep.progressSeconds,
    hasMedia: ep.hasMedia,
    isCurrent: false
  };
}

export function FamilySeriesDetail({
  detail
}: Readonly<{ detail: SeriesDetailDto }>) {
  const { collection, episodes, category } = detail;
  const background = detail.thumbnailPath ?? detail.posterPath;
  const totalRuntime = formatRuntimeMinutes(detail.totalDurationSeconds);
  const episodeCountLabel = formatEpisodeCount(episodes.length);
  const playable = pickPlayableEpisode(episodes);
  const synopsis =
    collection.description !== null && collection.description.trim() !== ""
      ? collection.description.trim()
      : "Serie disponible para este perfil. Explora y elige un episodio.";

  return (
    <article className="sf-detail-page">
      <section className="sf-detail-hero" aria-label={`Detalle de la serie ${collection.name}`}>
        <div className="sf-detail-hero-art" aria-hidden="true">
          {background !== null ? (
            <img alt="" className="sf-detail-hero-img" loading="eager" src={background} />
          ) : (
            <div className="sf-detail-hero-placeholder" />
          )}
          <div className="sf-detail-hero-scrim sf-detail-hero-scrim--top" />
          <div className="sf-detail-hero-scrim sf-detail-hero-scrim--left" />
          <div className="sf-detail-hero-scrim sf-detail-hero-scrim--bottom" />
        </div>

        <div className="sf-detail-hero-body">
          <Link className="sf-detail-hero-back" href="/">
            <svg aria-hidden="true" height="16" viewBox="0 0 24 24" width="16">
              <path d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z" fill="currentColor" />
            </svg>
            <span>Volver al catálogo</span>
          </Link>

          <p className="sf-detail-hero-eyebrow">Serie</p>
          <h1 className="sf-detail-hero-title">{collection.name}</h1>

          <div className="sf-detail-hero-meta">
            <span className="sf-detail-hero-match">98% Match</span>
            {category !== null ? (
              <span className="sf-detail-hero-meta-text">{category.name}</span>
            ) : null}
            <span className="sf-detail-hero-meta-text">{episodeCountLabel}</span>
            {totalRuntime !== null ? (
              <span className="sf-detail-hero-meta-text">{totalRuntime}</span>
            ) : null}
            <span className="sf-detail-hero-badge">HD</span>
          </div>

          <p className="sf-detail-hero-synopsis">{synopsis}</p>

          <div className="sf-detail-actions" role="group" aria-label="Acciones de la serie">
            {playable !== null ? (
              <Link
                className="sf-detail-btn sf-detail-btn--primary"
                href={`/c/${encodeURIComponent(playable.episode.slug)}`}
              >
                <svg aria-hidden="true" height="20" viewBox="0 0 24 24" width="20">
                  <path d="M8 5v14l11-7z" fill="currentColor" />
                </svg>
                <span>
                  {playable.isResume
                    ? `Seguir viendo · ${playable.episode.title}`
                    : "Ver primer episodio"}
                </span>
              </Link>
            ) : (
              <span className="sf-detail-btn sf-detail-btn--primary is-disabled" aria-disabled="true">
                Sin episodios disponibles
              </span>
            )}
          </div>
        </div>
      </section>

      <div className="sf-detail-grid sf-detail-grid--series">
        <div className="sf-detail-main">
          <EpisodesWithSeasons
            episodes={episodes.map(toDetailEpisode)}
            fallbackLabel={collection.name}
          />
        </div>
      </div>
    </article>
  );
}

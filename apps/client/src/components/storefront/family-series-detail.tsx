import Link from "next/link";
import type { SeriesDetailDto, SeriesEpisodeDto } from "../../lib/server/catalog/series-detail-for-profile";
import { formatRuntimeMinutes } from "../../lib/family/playback-time";
import type { DetailEpisodeDto } from "../../lib/server/catalog/content-detail-related";
import { SeriesContentList } from "./series-content-list";

function formatEntryCount(count: number): string {
  return count === 1 ? "1 entrada" : `${count} entradas`;
}

type PlayPick =
  | { mode: "video"; episode: SeriesEpisodeDto; isResume: boolean }
  | { mode: "gallery"; episode: SeriesEpisodeDto }
  | null;

/**
 * Prioriza reanudar un video; si no hay, el primer video con media; si la serie
 * solo tiene galerías, el primer álbum con fotos.
 */
function pickPlayableEpisode(episodes: readonly SeriesEpisodeDto[]): PlayPick {
  if (episodes.length === 0) return null;

  const inProgress = episodes.find((ep) => {
    if (ep.type === "photo_gallery") return false;
    if (!ep.hasMedia) return false;
    const progress = ep.progressSeconds;
    const duration = ep.durationSeconds;
    if (progress === null || duration === null || duration <= 0) return false;
    const pct = progress / duration;
    return pct > 0.02 && pct < 0.95;
  });
  if (inProgress !== undefined) {
    return { mode: "video", episode: inProgress, isResume: true };
  }

  const firstVideo = episodes.find((ep) => ep.type !== "photo_gallery" && ep.hasMedia);
  if (firstVideo !== undefined) {
    return { mode: "video", episode: firstVideo, isResume: false };
  }

  const firstGallery = episodes.find((ep) => ep.type === "photo_gallery" && ep.hasMedia);
  if (firstGallery !== undefined) {
    return { mode: "gallery", episode: firstGallery };
  }

  const first = episodes[0]!;
  if (first.type === "photo_gallery") {
    return { mode: "gallery", episode: first };
  }
  return { mode: "video", episode: first, isResume: false };
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
    photoCount: ep.photoCount,
    isCurrent: false
  };
}

export function FamilySeriesDetail({
  detail
}: Readonly<{ detail: SeriesDetailDto }>) {
  const { collection, episodes, category } = detail;
  const background = detail.thumbnailPath ?? detail.posterPath;
  const totalRuntime = formatRuntimeMinutes(detail.totalDurationSeconds);
  const entryCountLabel = formatEntryCount(episodes.length);
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
            <span className="sf-detail-hero-meta-text">{entryCountLabel}</span>
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
                {playable.mode === "gallery" ? (
                  <svg aria-hidden="true" height="20" viewBox="0 0 24 24" width="20" fill="currentColor">
                    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                  </svg>
                ) : (
                  <svg aria-hidden="true" height="20" viewBox="0 0 24 24" width="20">
                    <path d="M8 5v14l11-7z" fill="currentColor" />
                  </svg>
                )}
                <span>
                  {playable.mode === "gallery"
                    ? `Abrir álbum · ${playable.episode.title}`
                    : playable.isResume
                      ? `Seguir viendo · ${playable.episode.title}`
                      : "Ver primer episodio"}
                </span>
              </Link>
            ) : (
              <span className="sf-detail-btn sf-detail-btn--primary is-disabled" aria-disabled="true">
                Sin contenido disponible
              </span>
            )}
          </div>
        </div>
      </section>

      <div className="sf-detail-grid sf-detail-grid--series">
        <div className="sf-detail-main">
          <SeriesContentList
            episodes={episodes.map(toDetailEpisode)}
            fallbackLabel={collection.name}
            sectionTitle="Episodios y álbumes"
          />
        </div>
      </div>
    </article>
  );
}

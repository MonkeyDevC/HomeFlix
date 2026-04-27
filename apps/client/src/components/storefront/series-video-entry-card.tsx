import Link from "next/link";
import type { DetailEpisodeDto } from "../../lib/server/catalog/content-detail-related";
import { formatRuntimeMinutes } from "../../lib/family/playback-time";

/**
 * Fila de episodio, clip o película en la lista de una serie (reproducible en `/c/{slug}`).
 */
export function SeriesVideoEntryCard({
  episode,
  index
}: Readonly<{
  episode: DetailEpisodeDto;
  index: number;
}>) {
  const thumb = episode.thumbnailPath ?? episode.posterPath;
  const duration = formatRuntimeMinutes(episode.durationSeconds);
  const progressPct =
    episode.progressSeconds !== null &&
    episode.durationSeconds !== null &&
    episode.durationSeconds > 0
      ? Math.min(
          100,
          Math.max(0, (episode.progressSeconds / episode.durationSeconds) * 100)
        )
      : null;

  const body = (
    <>
      <div className="sf-detail-episode-thumb">
        {thumb !== null ? (
          <img alt="" className="sf-detail-episode-img" loading="lazy" src={thumb} />
        ) : (
          <div className="sf-detail-episode-placeholder" aria-hidden="true" />
        )}
        <span className="sf-detail-episode-index" aria-hidden="true">
          {index}
        </span>
        {episode.hasMedia ? (
          <span className="sf-detail-episode-play" aria-hidden="true">
            <svg height="28" viewBox="0 0 24 24" width="28">
              <path d="M8 5v14l11-7z" fill="currentColor" />
            </svg>
          </span>
        ) : null}
        {progressPct !== null ? (
          <span
            aria-hidden="true"
            className="sf-detail-episode-progress"
            style={{ width: `${progressPct}%` }}
          />
        ) : null}
      </div>
      <div className="sf-detail-episode-info">
        <div className="sf-detail-episode-head">
          <h4 className="sf-detail-episode-title">
            <span className="sf-detail-episode-num">{index}.</span> {episode.title}
          </h4>
          {duration !== null ? (
            <span className="sf-detail-episode-duration">{duration}</span>
          ) : null}
        </div>
        {episode.synopsis !== null && episode.synopsis.trim() !== "" ? (
          <p className="sf-detail-episode-synopsis">{episode.synopsis}</p>
        ) : null}
        {!episode.hasMedia ? (
          <span className="sf-detail-episode-flag">Sin video aún</span>
        ) : null}
      </div>
    </>
  );

  if (episode.isCurrent) {
    return (
      <div
        aria-current="true"
        className="sf-detail-episode sf-detail-episode--active"
      >
        {body}
      </div>
    );
  }

  return (
    <Link
      className="sf-detail-episode"
      href={`/c/${episode.slug}`}
      prefetch={false}
    >
      {body}
    </Link>
  );
}

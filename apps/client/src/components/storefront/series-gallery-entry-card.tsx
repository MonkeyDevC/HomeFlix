import Link from "next/link";
import type { DetailEpisodeDto } from "../../lib/server/catalog/content-detail-related";

/**
 * Fila de galería de fotos dentro del listado de una serie: abre el visor en `/c/{slug}`.
 */
export function SeriesGalleryEntryCard({
  episode,
  index
}: Readonly<{
  episode: DetailEpisodeDto;
  index: number;
}>) {
  const thumb = episode.thumbnailPath ?? episode.posterPath;
  const n = episode.photoCount;
  const photosLabel = n === 1 ? "1 foto" : `${n} fotos`;

  const body = (
    <>
      <div className="sf-detail-episode-thumb sf-detail-episode-thumb--gallery">
        {thumb !== null ? (
          <img alt="" className="sf-detail-episode-img" loading="lazy" src={thumb} />
        ) : (
          <div className="sf-detail-episode-placeholder" aria-hidden="true" />
        )}
        <span className="sf-detail-episode-index" aria-hidden="true">
          {index}
        </span>
        <span className="sf-detail-episode-gallery-icon" aria-hidden="true" title="Galería de fotos">
          <svg height="26" viewBox="0 0 24 24" width="26" fill="currentColor">
            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
          </svg>
        </span>
        <span className="sf-detail-episode-badge sf-detail-episode-badge--gallery">Galería</span>
      </div>
      <div className="sf-detail-episode-info">
        <div className="sf-detail-episode-head">
          <h4 className="sf-detail-episode-title">
            <span className="sf-detail-episode-num">{index}.</span> {episode.title}
          </h4>
          {n > 0 ? <span className="sf-detail-episode-duration">{photosLabel}</span> : null}
        </div>
        {episode.synopsis !== null && episode.synopsis.trim() !== "" ? (
          <p className="sf-detail-episode-synopsis">{episode.synopsis}</p>
        ) : null}
        {!episode.hasMedia ? (
          <span className="sf-detail-episode-flag">Sin fotos aún</span>
        ) : null}
      </div>
    </>
  );

  if (episode.isCurrent) {
    return (
      <div
        aria-current="true"
        className="sf-detail-episode sf-detail-episode--active sf-detail-episode--gallery"
      >
        {body}
      </div>
    );
  }

  return (
    <Link
      className="sf-detail-episode sf-detail-episode--gallery"
      href={`/c/${episode.slug}`}
      prefetch={false}
    >
      {body}
    </Link>
  );
}

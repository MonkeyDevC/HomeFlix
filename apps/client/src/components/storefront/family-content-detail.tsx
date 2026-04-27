import type { ContentDetailForProfileFamily } from "../../lib/family/domain-shapes";
import type {
  DetailEpisodeDto,
  DetailRelatedDataDto
} from "../../lib/server/catalog/content-detail-related";
import { DetailEpisodes } from "./detail-episodes";
import { DetailHero } from "./detail-hero";
import { DetailMetaPanel } from "./detail-meta-panel";
import type { NextEpisodeInfo } from "./detail-player";
import { DetailPlayer, DetailPlayerFallback } from "./detail-player";
import { PhotoGalleryViewer } from "./photo-gallery-viewer";

/**
 * Ordena los episodios de la serie respetando `(seasonNumber, episodeNumber,
 * position)` para que "siguiente" coincida con la expectativa del usuario.
 * Si los números de temporada/episodio faltan, cae al `position` del link.
 */
function sortEpisodesForPlayback(
  episodes: readonly DetailEpisodeDto[]
): readonly DetailEpisodeDto[] {
  return [...episodes].sort((a, b) => {
    if (a.position !== b.position) {
      return a.position - b.position;
    }
    const seasonA = a.seasonNumber ?? Number.POSITIVE_INFINITY;
    const seasonB = b.seasonNumber ?? Number.POSITIVE_INFINITY;
    if (seasonA !== seasonB) return seasonA - seasonB;
    const epA = a.episodeNumber ?? Number.POSITIVE_INFINITY;
    const epB = b.episodeNumber ?? Number.POSITIVE_INFINITY;
    if (epA !== epB) return epA - epB;
    return a.title.localeCompare(b.title);
  });
}

function pickNextEpisode(
  currentId: string,
  episodes: readonly DetailEpisodeDto[]
): NextEpisodeInfo | null {
  const ordered = sortEpisodesForPlayback(episodes);
  const idx = ordered.findIndex((ep) => ep.id === currentId);
  if (idx < 0) return null;
  for (let i = idx + 1; i < ordered.length; i++) {
    const candidate = ordered[i];
    if (candidate === undefined) continue;
    if (candidate.type === "photo_gallery") continue;
    if (!candidate.hasMedia) continue;
    return {
      slug: candidate.slug,
      title: candidate.title,
      thumbnailPath: candidate.thumbnailPath ?? candidate.posterPath,
      seasonNumber: candidate.seasonNumber,
      episodeNumber: candidate.episodeNumber
    };
  }
  return null;
}

export function FamilyContentDetail({
  detail,
  related,
  resumeProgressSeconds
}: Readonly<{
  detail: ContentDetailForProfileFamily;
  related: DetailRelatedDataDto;
  activeProfileName: string;
  resumeProgressSeconds: number | null;
}>) {
  const { item, playback, photoGallery } = detail;
  const isPhotoGallery = item.type === "photo_gallery";
  const canPlay = !isPhotoGallery && playback.state === "ready";
  const durationSeconds =
    playback.state === "ready"
      ? playback.playback.durationSeconds
      : playback.state === "file_missing"
        ? playback.playback.durationSeconds
        : null;

  const firstPhotoUrl =
    photoGallery !== null && photoGallery.state === "ready" && photoGallery.photos[0] !== undefined
      ? photoGallery.photos[0].url
      : null;
  const heroBackdropUrl = isPhotoGallery
    ? (item.thumbnailPath ?? item.posterPath ?? firstPhotoUrl)
    : (item.thumbnailPath ?? item.posterPath);

  const series = related.series;
  const showEpisodes = series !== null && series.episodes.length > 0;
  const seriesLabel = showEpisodes ? series.collectionName : null;
  const episodesCount = showEpisodes ? series.episodes.length : null;
  const nextEpisode = showEpisodes ? pickNextEpisode(item.id, series.episodes) : null;

  return (
    <article className="sf-detail-page">
      <DetailHero
        canPlay={canPlay}
        durationSeconds={durationSeconds}
        episodesCount={episodesCount}
        heroBackdropUrl={heroBackdropUrl}
        item={item}
        resumeProgressSeconds={resumeProgressSeconds}
        seriesLabel={seriesLabel}
      />

      <div className="sf-detail-grid">
        <div className="sf-detail-main">
          {isPhotoGallery ? (
            photoGallery !== null && photoGallery.state === "ready" ? (
              <div
                className="sf-detail-player-slot"
                id="photo-gallery-viewer"
                tabIndex={-1}
              >
                <PhotoGalleryViewer title={item.title} photos={photoGallery.photos} />
              </div>
            ) : (
              <div
                className="sf-detail-player-slot sf-detail-player-slot--empty"
                id="photo-gallery-viewer"
                tabIndex={-1}
              >
                <p className="sf-detail-empty-hint">Esta galería aún no tiene fotos visibles.</p>
              </div>
            )
          ) : playback.state === "ready" ? (
            <DetailPlayer
              contentItemId={item.id}
              initialProgressSeconds={resumeProgressSeconds}
              nextEpisode={nextEpisode}
              playback={playback.playback}
              posterPath={item.thumbnailPath ?? item.posterPath}
              title={item.title}
            />
          ) : playback.state === "missing_media" ? (
            <DetailPlayerFallback
              message={playback.reason}
              posterPath={item.thumbnailPath ?? item.posterPath}
              title="Sin video disponible"
            />
          ) : playback.state === "file_missing" ? (
            <DetailPlayerFallback
              message={`${playback.reason} (ruta: ${playback.playback.filePath})`}
              posterPath={item.thumbnailPath ?? item.posterPath}
              title="Archivo de video no encontrado"
            />
          ) : (
            <DetailPlayerFallback
              message={playback.reason}
              posterPath={item.thumbnailPath ?? item.posterPath}
              title="Asset no reproducible"
            />
          )}

          {showEpisodes ? <DetailEpisodes series={series} /> : null}
        </div>

        <div className="sf-detail-side">
          <DetailMetaPanel
            durationSeconds={durationSeconds}
            item={item}
            moreLikeThis={related.moreLikeThis}
            playback={playback}
            shareUrl={`/c/${item.slug}`}
          />
        </div>
      </div>
    </article>
  );
}

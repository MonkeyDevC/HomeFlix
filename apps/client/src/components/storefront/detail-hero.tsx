import Link from "next/link";
import type { ContentDetailFamilyDto } from "../../lib/family/domain-shapes";
import { formatRuntimeMinutes } from "../../lib/family/playback-time";
import { DetailActions } from "./detail-actions";

function contentTypeLabel(type: ContentDetailFamilyDto["type"]): string {
  switch (type) {
    case "movie":
      return "Película";
    case "episode":
      return "Serie";
    case "clip":
      return "Clip";
    case "photo_gallery":
      return "Galería";
    default:
      return "Contenido";
  }
}

function formatResume(seconds: number | null): string | null {
  if (seconds === null || seconds <= 0) {
    return null;
  }
  const total = Math.round(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  if (m === 0) {
    return `${s}s`;
  }
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

export function DetailHero({
  item,
  canPlay,
  resumeProgressSeconds,
  durationSeconds,
  seriesLabel,
  episodesCount,
  heroBackdropUrl
}: Readonly<{
  item: ContentDetailFamilyDto;
  canPlay: boolean;
  resumeProgressSeconds: number | null;
  durationSeconds: number | null;
  seriesLabel: string | null;
  episodesCount: number | null;
  /** Poster / miniatura / primera foto de galería para el hero. */
  heroBackdropUrl?: string | null;
}>) {
  const background = heroBackdropUrl ?? item.thumbnailPath ?? item.posterPath;
  const typeLabel = contentTypeLabel(item.type);
  const runtimeLabel = formatRuntimeMinutes(durationSeconds);
  const resumeLabel = formatResume(resumeProgressSeconds);
  const synopsis = item.synopsis !== null && item.synopsis.trim() !== ""
    ? item.synopsis.trim()
    : "Sinopsis no disponible para este contenido.";

  return (
    <section className="sf-detail-hero" aria-label={`Detalle de ${item.title}`}>
      <div className="sf-detail-hero-art" aria-hidden="true">
        {background !== null ? (
          <img
            alt=""
            className="sf-detail-hero-img"
            loading="eager"
            src={background}
          />
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

        <p className="sf-detail-hero-eyebrow">{typeLabel}</p>
        <h1 className="sf-detail-hero-title">{item.title}</h1>

        <div className="sf-detail-hero-meta">
          <span className="sf-detail-hero-match">98% Match</span>
          {item.category !== null ? (
            <span className="sf-detail-hero-meta-text">{item.category.name}</span>
          ) : null}
          {seriesLabel !== null ? (
            <span className="sf-detail-hero-meta-text">{seriesLabel}</span>
          ) : null}
          {episodesCount !== null ? (
            <span className="sf-detail-hero-meta-text">
              {episodesCount} {episodesCount === 1 ? "episodio" : "episodios"}
            </span>
          ) : runtimeLabel !== null ? (
            <span className="sf-detail-hero-meta-text">{runtimeLabel}</span>
          ) : null}
          <span className="sf-detail-hero-badge">HD</span>
          {item.visibility === "household" ? (
            <span className="sf-detail-hero-badge sf-detail-hero-badge--soft">
              Familia
            </span>
          ) : null}
        </div>

        <p className="sf-detail-hero-synopsis">{synopsis}</p>

        <DetailActions
          canPlay={canPlay}
          isPhotoGallery={item.type === "photo_gallery"}
          resumeLabel={resumeLabel}
        />
      </div>
    </section>
  );
}

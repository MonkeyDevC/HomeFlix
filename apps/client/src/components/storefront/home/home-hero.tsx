import Link from "next/link";
import { formatRuntimeMinutes } from "../../../lib/family/playback-time";
import type { FamilyHomeCardDto } from "../../../lib/family/storefront-contracts";

function excerpt(text: string | null, max = 220): string {
  if (text === null || text.trim() === "") {
    return "Contenido disponible para este perfil. Disfruta de esta seleccion especialmente para ti.";
  }

  const clean = text.trim();
  return clean.length <= max ? clean : `${clean.slice(0, max).trim()}...`;
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

function formatTypeLabel(item: FamilyHomeCardDto | null): string | null {
  if (item === null) return null;

  if (item.kind === "series") {
    return item.episodeCount > 1
      ? `Serie · ${item.episodeCount} episodios`
      : "Serie";
  }

  switch (item.type) {
    case "movie":
      return "Pelicula";
    case "episode":
      return "Episodio";
    case "clip":
      return "Clip";
    case "photo_gallery":
      return "Galería";
    default:
      return item.type;
  }
}

function featuredHref(item: FamilyHomeCardDto): string {
  return item.kind === "series"
    ? `/series/${encodeURIComponent(item.slug)}`
    : `/c/${encodeURIComponent(item.slug)}`;
}

export function HomeHero({
  featured,
  profileName
}: Readonly<{
  featured: FamilyHomeCardDto | null;
  profileName: string;
}>) {
  const heroImage = featured?.thumbnailPath ?? featured?.posterPath ?? null;
  const heroVideoUrl =
    featured === null || featured.previewVideoAssetId === null
      ? null
      : `/api/family/media/${encodeURIComponent(featured.previewVideoAssetId)}`;

  const categoryName =
    featured === null
      ? null
      : featured.kind === "series"
        ? featured.category?.name ?? null
        : featured.category?.name ?? null;

  const metadata = [
    formatRuntimeMinutes(featured?.durationSeconds ?? null),
    formatTypeLabel(featured),
    categoryName
  ].filter((value): value is string => value !== null && value.trim() !== "");

  const detailHref = featured === null ? null : featuredHref(featured);

  return (
    <section
      aria-labelledby="sf-home-hero-title"
      className={`sf-home-hero${featured === null ? " is-fallback" : ""}`}
      style={{ backgroundImage: heroGradient(featured?.id ?? profileName) }}
    >
      <div aria-hidden="true" className="sf-home-hero-media">
        {heroImage ? <img alt="" className="sf-home-hero-image" src={heroImage} /> : null}
        {heroVideoUrl ? (
          <video
            autoPlay
            className="sf-home-hero-video"
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
            {featured ? "Destacado para ti" : "Perfil activo"}
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
                  aria-label="Mi lista (próximamente)"
                  className="sf-btn-hero-icon"
                  disabled
                  title="Próximamente en Family V1"
                  type="button"
                >
                  +
                </button>
              </>
            ) : (
              <span className="sf-home-hero-empty-cta">
                El Home ya esta listo; aparecera contenido cuando este perfil tenga titulos publicados con acceso.
              </span>
            )}
          </div>

          <p className="sf-home-hero-profile-note">Contenido disponible para {profileName}.</p>
        </div>

        {featured ? (
          <div aria-hidden="true" className="sf-home-hero-rating-pill">
            <span className="sf-home-hero-rating-pill-icon">◉</span>
            APTA PARA TODO PÚBLICO
          </div>
        ) : null}
      </div>
    </section>
  );
}

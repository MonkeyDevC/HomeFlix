import Link from "next/link";
import type { ContentItemReadModel } from "@homeflix/contracts";
import { formatRuntimeMinutes } from "../../lib/family/playback-time";

function heroGradient(seed: string): string {
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(index);
    hash |= 0;
  }

  const hue = Math.abs(hash) % 360;
  return `linear-gradient(135deg, hsl(${hue}, 52%, 16%) 0%, rgba(10, 10, 14, 0.88) 55%, #040404 100%)`;
}

export function HomeHero({
  item
}: Readonly<{
  item: ContentItemReadModel;
}>) {
  const imagePath = item.primaryMedia?.playbackId ?? item.primaryCollection?.slug ?? null;
  const metadata = [formatRuntimeMinutes(item.primaryMedia?.durationSeconds ?? null), item.primaryCollection?.name]
    .filter((value): value is string => value !== null && value !== undefined && value.trim() !== "");

  return (
    <section
      aria-labelledby="sf-legacy-home-hero-title"
      className="sf-home-hero"
      style={{ backgroundImage: heroGradient(item.id) }}
    >
      <div className="sf-home-hero-media" aria-hidden="true">
        {item.primaryMedia === null && imagePath === null ? null : <div className="sf-home-hero-overlay" />}
      </div>
      <div className="sf-home-hero-overlay" />
      <div className="sf-home-hero-inner">
        <div className="sf-home-hero-copy">
          <p className="sf-home-hero-eyebrow">Legado V2</p>
          <h1 className="sf-home-hero-title" id="sf-legacy-home-hero-title">
            {item.title}
          </h1>
          {metadata.length > 0 ? (
            <div className="sf-home-hero-meta">
              {metadata.map((value) => (
                <span className="sf-home-hero-meta-item" key={value}>
                  {value}
                </span>
              ))}
            </div>
          ) : null}
          <p className="sf-home-hero-synopsis">{item.synopsis ?? "Catalogo heredado del flujo V2."}</p>
          <div className="sf-home-hero-actions">
            <Link className="sf-btn sf-btn-primary" href={`/c/${encodeURIComponent(item.slug)}`}>
              Ver detalle
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

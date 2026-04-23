import type { ContentItemReadModel } from "@homeflix/contracts";
import Link from "next/link";
import type { ReactNode } from "react";
import { formatRuntimeMinutes } from "../../lib/family/playback-time";

export function ContentDetailSurface({
  item,
  children
}: Readonly<{
  item: ContentItemReadModel;
  children?: ReactNode;
}>) {
  const runtimeLabel = formatRuntimeMinutes(item.primaryMedia?.durationSeconds ?? null);

  return (
    <article className="sf-detail">
      <div className="sf-detail-back">
        <Link href="/">Volver al inicio</Link>
      </div>
      <header className="sf-detail-head">
        <p className="sf-detail-eyebrow">{item.type}</p>
        <h1 className="sf-detail-title">{item.title}</h1>
        <div className="sf-detail-meta">
          {item.primaryCategory ? <span className="sf-pill">{item.primaryCategory.name}</span> : null}
          {item.primaryCollection ? (
            <span className="sf-pill sf-pill-muted">{item.primaryCollection.name}</span>
          ) : null}
          <span className="sf-pill sf-pill-muted">Editorial: {item.editorialStatus}</span>
          <span className="sf-pill sf-pill-muted">Visibilidad: {item.visibility}</span>
        </div>
      </header>
      {item.synopsis ? (
        <p className="sf-detail-synopsis">{item.synopsis}</p>
      ) : (
        <p className="sf-detail-synopsis sf-muted">Sin sinopsis.</p>
      )}
      {children !== undefined ? <div className="sf-detail-player-slot">{children}</div> : null}
      <section aria-label="Informacion tecnica" className="sf-detail-tech">
        <h2 className="sf-detail-h2">Medios vinculados</h2>
        {item.primaryMedia ? (
          <ul className="sf-detail-list">
            <li>
              Primario: estado {item.primaryMedia.status}
              {runtimeLabel ? ` - ${runtimeLabel}` : ""}
              {item.primaryMedia.playbackId ? ` - playbackId ${item.primaryMedia.playbackId}` : ""}
            </li>
            {item.mediaAssets.length > 1 ? (
              <li>{item.mediaAssets.length} enlaces en total (roles distintos).</li>
            ) : null}
          </ul>
        ) : (
          <p className="sf-muted">Sin media primario vinculado todavia.</p>
        )}
      </section>
      <div className="sf-detail-cta">
        <span className="sf-hero-note">
          Family V1: la reproduccion sera desde archivos locales; el detalle tecnico actual puede seguir viniendo de la
          API legado hasta FASE 2.
        </span>
      </div>
    </article>
  );
}

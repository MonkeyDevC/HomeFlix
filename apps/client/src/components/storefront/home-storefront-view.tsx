"use client";

import type { CatalogHomePreviewPayload } from "@homeflix/contracts";
import { ContentRow } from "./content-row";
import { EmptyStateBlock } from "./empty-state-block";
import { HomeHero } from "./home-hero";

export function HomeStorefrontView({
  initial,
  apiBaseUrl
}: Readonly<{
  initial: CatalogHomePreviewPayload;
  apiBaseUrl: string;
}>) {
  const heroItem = initial.featured[0];
  const hasAnyPublished =
    initial.featured.length > 0 || initial.rows.length > 0;

  return (
    <>
      {heroItem ? (
        <HomeHero item={heroItem} />
      ) : (
        <section className="sf-hero sf-hero-fallback" aria-labelledby="sf-fallback-title">
          <div className="sf-hero-inner">
            <p className="sf-hero-eyebrow">HomeFlix</p>
            <h1 id="sf-fallback-title" className="sf-hero-title">
              Tu catálogo editorial
            </h1>
            <p className="sf-hero-synopsis">
              Aún no hay títulos publicados visibles en el home. Publica
              contenido en Directus (misma base que la API) o usa el fixture de
              catálogo para validar la UI.
            </p>
          </div>
        </section>
      )}

      {initial.rows.map((row) => (
        <ContentRow
          key={row.collection.id}
          title={row.collection.name}
          items={row.items}
        />
      ))}

      {!hasAnyPublished ? (
        <div className="sf-home-empty-wrap">
          <EmptyStateBlock
            title="Catálogo vacío para el consumidor"
            description="La API respondió correctamente, pero no hay ítems con estado editorial «published» en colecciones. Añade datos reales o ejecuta el script de fixture de FASE 3."
          />
        </div>
      ) : null}
    </>
  );
}

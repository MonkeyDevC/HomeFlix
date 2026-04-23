import type { ContentItemReadModel } from "@homeflix/contracts";
import Link from "next/link";
import { ContentCard } from "./content-card";
import { EmptyStateBlock } from "./empty-state-block";

export function SearchResultsSurface({
  query,
  results
}: Readonly<{
  query: string;
  results: readonly ContentItemReadModel[];
}>) {
  return (
    <div className="sf-search-page">
      <h1 className="sf-page-title">Buscar</h1>
      <p className="sf-muted">
        Solo títulos con estado editorial publicado. Consulta:{" "}
        <strong>{query.length > 0 ? query : "(vacío)"}</strong>
      </p>
      {query.trim().length === 0 ? (
        <EmptyStateBlock
          title="Escribe un término"
          description="La búsqueda vacía no consulta el servidor. Usa el campo superior."
        />
      ) : results.length === 0 ? (
        <EmptyStateBlock
          title="Sin resultados"
          description="Prueba con otra palabra o verifica que haya contenido publicado en la base."
        />
      ) : (
        <div className="sf-search-grid">
          {results.map((item) => (
            <ContentCard key={item.id} item={item} />
          ))}
        </div>
      )}
      <p className="sf-detail-back">
        <Link href="/">← Inicio</Link>
      </p>
    </div>
  );
}

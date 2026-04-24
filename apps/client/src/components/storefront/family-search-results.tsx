import Link from "next/link";
import type {
  FamilyHomeCardDto,
  FamilySearchResultDto
} from "../../lib/family/storefront-contracts";
import { FamilyContentCard } from "./family-content-card";
import { FamilyEmptySearchState } from "./family-empty-search-state";

function cardHref(item: FamilyHomeCardDto): string {
  return item.kind === "series"
    ? `/series/${encodeURIComponent(item.slug)}`
    : `/c/${encodeURIComponent(item.slug)}`;
}

export function FamilySearchResults({
  result
}: Readonly<{ result: FamilySearchResultDto }>) {
  const q = result.query.trim();
  const suggestions = result.items.slice(0, 6);
  const popular = result.items.slice(0, 5);

  return (
    <section className="sf-search-sections">
      {q.length > 0 ? (
        <>
          <h2 className="sf-search-section-title">Resultados para "{q}"</h2>
          {result.items.length === 0 ? (
            <FamilyEmptySearchState query={q} />
          ) : (
            <div className="sf-search-grid">
              {result.items.map((item) => (
                <FamilyContentCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </>
      ) : suggestions.length === 0 ? (
        <div className="sf-empty" role="status">
          <h3 className="sf-empty-title">Sin sugerencias aún</h3>
          <p className="sf-empty-desc">Publica contenido para mostrar recomendaciones en esta sección.</p>
        </div>
      ) : (
        <>
          <section aria-label="Sugerencias para ti" className="sf-search-row">
            <h2 className="sf-search-section-title">Sugerencias para ti</h2>
            <div className="sf-search-suggestions">
              {suggestions.map((item) => (
                <FamilyContentCard
                  item={item}
                  key={item.id}
                  restMode="image-first"
                  size="compact"
                />
              ))}
            </div>
          </section>

          <section aria-label="Búsquedas populares" className="sf-search-row">
            <h2 className="sf-search-section-title">Búsquedas populares</h2>
            <ul className="sf-search-popular-list">
              {popular.map((item) => (
                <li key={`popular-${item.id}`}>
                  <Link className="sf-search-popular-item" href={cardHref(item)}>
                    {item.thumbnailPath ?? item.posterPath ? (
                      <img
                        alt=""
                        aria-hidden="true"
                        className="sf-search-popular-thumb"
                        loading="eager"
                        src={item.thumbnailPath ?? item.posterPath ?? undefined}
                      />
                    ) : (
                      <span aria-hidden="true" className="sf-search-popular-thumb sf-search-popular-thumb--fallback">
                        {(item.title.slice(0, 1) || "?").toUpperCase()}
                      </span>
                    )}
                    <span className="sf-search-popular-title">{item.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
      <p className="sf-detail-back">
        <Link href="/">← Inicio</Link>
      </p>
    </section>
  );
}

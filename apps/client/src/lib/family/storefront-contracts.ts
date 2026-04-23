/**
 * Contratos del storefront Family V1.
 *
 * Una fila del Home (o los resultados de búsqueda) puede contener dos tipos
 * visuales de tarjetas, discriminadas por `kind`:
 *
 * - `standalone`  → representa una película o un clip individual.
 * - `series`      → representa una agrupación editorial (`Collection`) que
 *                   contiene varios episodios. El Home muestra UNA sola card
 *                   por serie y los capítulos viven dentro del detalle de la
 *                   serie (`/series/[slug]`).
 *
 * La agrupación se resuelve en servidor; el frontend sólo pinta la entidad
 * ya normalizada. Ver `lib/server/catalog/group-series-for-catalog.ts`.
 */

type CollectionRef = Readonly<{ id: string; slug: string; name: string }>;
type CategoryRef = Readonly<{ id: string; slug: string; name: string }>;

/**
 * Película / clip / episodio suelto (sin serie asociada).
 * Navega a `/c/{slug}` (ContentItem).
 */
export type FamilyStandaloneCardDto = Readonly<{
  kind: "standalone";
  id: string;
  slug: string;
  title: string;
  synopsis: string | null;
  posterPath: string | null;
  thumbnailPath: string | null;
  /** `movie | clip | episode`. Un `episode` sin collection se considera standalone. */
  type: string;
  primaryCollection: CollectionRef | null;
  category: CategoryRef | null;
  previewVideoAssetId: string | null;
  durationSeconds: number | null;
}>;

/**
 * Serie agrupada (una `Collection` con episodios visibles para el perfil).
 * Navega a `/series/{slug}` (Collection).
 */
export type FamilySeriesCardDto = Readonly<{
  kind: "series";
  /** `Collection.id` — único en la fila. */
  id: string;
  /** `Collection.slug`. */
  slug: string;
  /** `Collection.name`. */
  title: string;
  /** `Collection.description` si existe, si no la sinopsis del episodio representativo. */
  synopsis: string | null;
  /** Portada heredada del episodio representativo. */
  posterPath: string | null;
  thumbnailPath: string | null;
  /** Cantidad de episodios visibles para el perfil. */
  episodeCount: number;
  /** Categoría heredada del episodio representativo (si los episodios la comparten). */
  category: CategoryRef | null;
  /** Preview del episodio representativo (primer capítulo disponible). */
  previewVideoAssetId: string | null;
  /** Duración del episodio representativo. */
  durationSeconds: number | null;
}>;

/** Unión discriminada: cualquier card del Home o de resultados de búsqueda. */
export type FamilyHomeCardDto = FamilyStandaloneCardDto | FamilySeriesCardDto;

export type FamilyHomeRowDto = Readonly<{
  categoryId: string;
  categorySlug: string;
  categoryName: string;
  items: readonly FamilyHomeCardDto[];
}>;

export type FamilyHomeDto = Readonly<{
  profile: Readonly<{ id: string; displayName: string }>;
  rows: readonly FamilyHomeRowDto[];
  /** Items guardados por el perfil (Mi lista). Ya agrupados como el Home. */
  myList: readonly FamilyHomeCardDto[];
  /**
   * Conjunto de `ContentItem.id` que el perfil tiene en su watchlist.
   * Nota: para series el id almacenado es el del episodio representativo (ver
   * `lib/server/catalog/watchlist-for-profile.ts`); aun así exponemos la lista
   * completa por si la UI quiere correlacionarla.
   */
  watchlistContentItemIds: readonly string[];
}>;

export type FamilySearchResultDto = Readonly<{
  query: string;
  items: readonly FamilyHomeCardDto[];
}>;

export type FamilyContinueWatchingItemDto = Readonly<{
  contentItemId: string;
  contentItemSlug: string;
  contentItemTitle: string;
  posterPath: string | null;
  thumbnailPath: string | null;
  previewVideoAssetId: string | null;
  type: string | null;
  categoryName: string | null;
  collectionName: string | null;
  progressSeconds: number;
  durationSeconds: number | null;
  updatedAt: string;
}>;

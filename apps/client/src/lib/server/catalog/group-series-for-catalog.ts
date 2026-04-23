/**
 * Agrupación de series para carruseles del storefront.
 *
 * Regla de negocio:
 *   - Un `ContentItem.type === "episode"` con al menos una `Collection` asociada
 *     se colapsa bajo la **primera** collection (`ContentItemCollectionLink.position ASC`).
 *   - Todos los episodios que caen bajo la misma collection producen UNA única
 *     `FamilySeriesCardDto`. La fila ya no repite la serie.
 *   - Movies y clips se emiten como `FamilyStandaloneCardDto` sin tocar.
 *   - Episodios sin collection se emiten como `standalone` (degradación segura).
 *
 * El helper es **determinista**: se respeta el orden de entrada. La primera vez
 * que aparece un episodio de una serie, se inserta la `SeriesCard` en esa
 * posición; episodios posteriores de la misma serie se descartan (ya están
 * representados por la card).
 *
 * El episodio representativo (para título del preview / portada heredada) es
 * el de menor `(seasonNumber, episodeNumber)` entre los visibles; si empatan,
 * el primero que aparece en el input (orden de la fila).
 */
import type {
  FamilyHomeCardDto,
  FamilySeriesCardDto,
  FamilyStandaloneCardDto
} from "../../family/storefront-contracts";

export type CatalogItemRaw = Readonly<{
  id: string;
  slug: string;
  title: string;
  synopsis: string | null;
  posterPath: string | null;
  thumbnailPath: string | null;
  type: string;
  seasonNumber: number | null;
  episodeNumber: number | null;
  primaryCollection: Readonly<{
    id: string;
    slug: string;
    name: string;
    description: string | null;
  }> | null;
  category: Readonly<{ id: string; slug: string; name: string }> | null;
  previewVideoAssetId: string | null;
  durationSeconds: number | null;
}>;

/**
 * Compara dos episodios para decidir cuál es "representativo" de la serie.
 * Menor seasonNumber, luego menor episodeNumber, luego mantener el primero.
 * `null` en season/episode pierde contra valores numéricos.
 */
function isBetterRepresentative(
  candidate: CatalogItemRaw,
  current: CatalogItemRaw
): boolean {
  const aSeason = candidate.seasonNumber ?? Number.POSITIVE_INFINITY;
  const bSeason = current.seasonNumber ?? Number.POSITIVE_INFINITY;
  if (aSeason !== bSeason) return aSeason < bSeason;

  const aEp = candidate.episodeNumber ?? Number.POSITIVE_INFINITY;
  const bEp = current.episodeNumber ?? Number.POSITIVE_INFINITY;
  return aEp < bEp;
}

function toStandalone(row: CatalogItemRaw): FamilyStandaloneCardDto {
  return {
    kind: "standalone",
    id: row.id,
    slug: row.slug,
    title: row.title,
    synopsis: row.synopsis,
    posterPath: row.posterPath,
    thumbnailPath: row.thumbnailPath,
    type: row.type,
    primaryCollection:
      row.primaryCollection === null
        ? null
        : {
            id: row.primaryCollection.id,
            slug: row.primaryCollection.slug,
            name: row.primaryCollection.name
          },
    category: row.category,
    previewVideoAssetId: row.previewVideoAssetId,
    durationSeconds: row.durationSeconds
  };
}

function toSeriesCard(
  collection: NonNullable<CatalogItemRaw["primaryCollection"]>,
  representative: CatalogItemRaw,
  episodeCount: number
): FamilySeriesCardDto {
  return {
    kind: "series",
    id: collection.id,
    slug: collection.slug,
    title: collection.name,
    synopsis: collection.description ?? representative.synopsis,
    posterPath: representative.posterPath,
    thumbnailPath: representative.thumbnailPath,
    episodeCount,
    category: representative.category,
    previewVideoAssetId: representative.previewVideoAssetId,
    durationSeconds: representative.durationSeconds
  };
}

/**
 * Agrupa un listado crudo en cards del storefront preservando el orden
 * de primera aparición.
 */
export function groupSeriesForCatalog(
  items: readonly CatalogItemRaw[]
): readonly FamilyHomeCardDto[] {
  type SeriesBucket = {
    collection: NonNullable<CatalogItemRaw["primaryCollection"]>;
    representative: CatalogItemRaw;
    count: number;
    placeholderIndex: number;
  };

  const buckets = new Map<string, SeriesBucket>();
  const result: (FamilyHomeCardDto | null)[] = [];

  for (const row of items) {
    const isEpisode = row.type === "episode";
    const col = row.primaryCollection;

    if (!isEpisode || col === null) {
      result.push(toStandalone(row));
      continue;
    }

    const existing = buckets.get(col.id);
    if (existing === undefined) {
      buckets.set(col.id, {
        collection: col,
        representative: row,
        count: 1,
        placeholderIndex: result.length
      });
      result.push(null); // placeholder; se rellena al final con la SeriesCard
      continue;
    }

    existing.count += 1;
    if (isBetterRepresentative(row, existing.representative)) {
      existing.representative = row;
    }
  }

  for (const bucket of buckets.values()) {
    result[bucket.placeholderIndex] = toSeriesCard(
      bucket.collection,
      bucket.representative,
      bucket.count
    );
  }

  return result.filter((card): card is FamilyHomeCardDto => card !== null);
}

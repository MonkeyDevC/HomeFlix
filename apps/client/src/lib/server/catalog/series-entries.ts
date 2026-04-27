import type { SeriesEpisodeDto } from "./series-detail-for-profile";
import type { ContentTypeFamily } from "../../family/domain-shapes";

/** Entrada normalizada del listado de serie (discriminante explícito). */
export type SeriesEntryNormalized =
  | {
      kind: "video";
      contentType: Extract<ContentTypeFamily, "episode" | "clip" | "movie">;
      id: string;
      slug: string;
      title: string;
      position: number;
    }
  | {
      kind: "photo_gallery";
      id: string;
      slug: string;
      title: string;
      position: number;
      photoCount: number;
    };

export function countPhotosForGallery(item: { _count: { photoAssets: number } }): number {
  return item._count.photoAssets;
}

/**
 * A partir del DTO de detalle de serie (ya filtrado por acceso y visibilidad).
 */
export function normalizeSeriesEntry(row: SeriesEpisodeDto): SeriesEntryNormalized {
  if (row.type === "photo_gallery") {
    return {
      kind: "photo_gallery",
      id: row.id,
      slug: row.slug,
      title: row.title,
      position: row.position,
      photoCount: row.photoCount
    };
  }
  return {
    kind: "video",
    contentType: row.type as Extract<ContentTypeFamily, "episode" | "clip" | "movie">,
    id: row.id,
    slug: row.slug,
    title: row.title,
    position: row.position
  };
}

/**
 * Nombre alineado con el requisito de spec; hoy el detalle de serie se obtiene con
 * `getSeriesDetailForActiveProfile` (incluye episodios y galerías).
 */
export { getSeriesDetailForActiveProfile as getSeriesEntriesForContent } from "./series-detail-for-profile";

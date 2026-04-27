import type { DetailEpisodeDto } from "../../lib/server/catalog/content-detail-related";
import { SeriesGalleryEntryCard } from "./series-gallery-entry-card";
import { SeriesVideoEntryCard } from "./series-video-entry-card";

/**
 * Despacha a tarjeta de video o galería según el tipo de `ContentItem`.
 */
export function SeriesContentCard({
  episode,
  index
}: Readonly<{
  episode: DetailEpisodeDto;
  index: number;
}>) {
  if (episode.type === "photo_gallery") {
    return <SeriesGalleryEntryCard episode={episode} index={index} />;
  }
  return <SeriesVideoEntryCard episode={episode} index={index} />;
}

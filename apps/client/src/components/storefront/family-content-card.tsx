import type { FamilyHomeCardDto } from "../../lib/family/storefront-contracts";
import { ContentCard } from "./home/content-card";
import type { HomeContentCardRestMode, HomeContentCardSize } from "./home/content-card";

function formatStandaloneTypeLabel(type: string): string {
  switch (type) {
    case "movie":
      return "Pelicula";
    case "episode":
      return "Episodio";
    case "clip":
      return "Clip";
    case "photo_gallery":
      return "Galería";
    default:
      return type;
  }
}

function seriesBadgeLabel(count: number): string {
  if (count <= 1) return "Serie";
  return `Serie · ${count} episodios`;
}

/**
 * Card del storefront. Pinta tanto un ítem standalone (película/clip) como una
 * serie agrupada, derivando `href` y subtítulo del discriminante `kind`.
 */
export function FamilyContentCard({
  item,
  size = "default",
  restMode = "image-first",
  autoPlayPreviewAtRest = false
}: Readonly<{
  item: FamilyHomeCardDto;
  size?: HomeContentCardSize;
  restMode?: HomeContentCardRestMode;
  autoPlayPreviewAtRest?: boolean;
}>) {
  if (item.kind === "series") {
    return (
      <ContentCard
        href={`/series/${encodeURIComponent(item.slug)}`}
        id={item.id}
        layout="portrait"
        previewImagePath={item.posterPath ?? item.thumbnailPath}
        previewVideoAssetId={item.previewVideoAssetId}
        primaryActionLabel="Ver serie"
        autoPlayPreviewAtRest={autoPlayPreviewAtRest}
        restMode={restMode}
        secondaryActionLabel="Ver detalle"
        size={size}
        subtitle={item.category?.name ?? null}
        synopsis={item.synopsis}
        title={item.title}
        typeLabel="Serie"
        badgeLabel={seriesBadgeLabel(item.episodeCount)}
      />
    );
  }

  const subtitle = item.primaryCollection?.name ?? item.category?.name ?? null;

  return (
    <ContentCard
      href={`/c/${encodeURIComponent(item.slug)}`}
      id={item.id}
      layout="portrait"
      previewImagePath={item.posterPath ?? item.thumbnailPath}
      previewVideoAssetId={item.previewVideoAssetId}
      primaryActionLabel="Ver ahora"
      autoPlayPreviewAtRest={autoPlayPreviewAtRest}
      restMode={restMode}
      secondaryActionLabel="Ver detalle"
      size={size}
      subtitle={subtitle}
      synopsis={item.synopsis}
      title={item.title}
      typeLabel={formatStandaloneTypeLabel(item.type)}
      badgeLabel={item.type === "photo_gallery" ? "Galería" : undefined}
    />
  );
}

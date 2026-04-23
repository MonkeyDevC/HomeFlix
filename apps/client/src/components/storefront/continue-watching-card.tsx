import type { FamilyContinueWatchingItemDto } from "../../lib/family/storefront-contracts";
import { formatContinueWatchingProgress } from "../../lib/family/playback-time";
import { ContentCard } from "./home/content-card";

function progressPercent(entry: FamilyContinueWatchingItemDto): number {
  if (
    entry.durationSeconds === null ||
    entry.durationSeconds <= 0 ||
    entry.progressSeconds <= 0
  ) {
    return 4;
  }

  return Math.min(
    100,
    Math.round((entry.progressSeconds / entry.durationSeconds) * 100)
  );
}

export function ContinueWatchingCard({
  entry
}: Readonly<{
  entry: FamilyContinueWatchingItemDto;
}>) {
  const pct = progressPercent(entry);
  const subtitle = entry.collectionName ?? entry.categoryName ?? null;

  return (
    <ContentCard
      href={`/c/${encodeURIComponent(entry.contentItemSlug)}`}
      id={entry.contentItemId}
      layout="portrait"
      previewImagePath={entry.posterPath ?? entry.thumbnailPath}
      previewVideoAssetId={entry.previewVideoAssetId}
      primaryActionLabel="Continuar"
      progressLabel={formatContinueWatchingProgress(entry.progressSeconds, entry.durationSeconds)}
      progressPercent={pct}
      restMode="video-first-when-available"
      secondaryActionLabel="Ver detalle"
      size="compact"
      subtitle={subtitle}
      title={entry.contentItemTitle}
      typeLabel="Seguir viendo"
    />
  );
}

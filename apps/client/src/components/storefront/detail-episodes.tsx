import type { DetailRelatedDataDto } from "../../lib/server/catalog/content-detail-related";
import { EpisodesWithSeasons } from "./episodes-with-seasons";

export function DetailEpisodes({
  series
}: Readonly<{
  series: NonNullable<DetailRelatedDataDto["series"]>;
}>) {
  return (
    <EpisodesWithSeasons
      episodes={series.episodes}
      fallbackLabel={series.collectionName}
    />
  );
}

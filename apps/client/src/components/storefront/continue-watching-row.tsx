import type { FamilyContinueWatchingItemDto } from "../../lib/family/storefront-contracts";
import { ContinueWatchingCard } from "./continue-watching-card";
import { HomeRow } from "./home/home-row";

export function ContinueWatchingRow({
  items
}: Readonly<{
  items: readonly FamilyContinueWatchingItemDto[];
}>) {
  if (items.length === 0) {
    return null;
  }

  return (
    <HomeRow title="Seguir viendo">
      {items.map((entry) => (
        <ContinueWatchingCard entry={entry} key={entry.contentItemId} />
      ))}
    </HomeRow>
  );
}

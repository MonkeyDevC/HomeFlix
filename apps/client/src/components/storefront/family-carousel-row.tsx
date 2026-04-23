import type { FamilyHomeRowDto } from "../../lib/family/storefront-contracts";
import { FamilyContentCard } from "./family-content-card";
import { HomeRow } from "./home/home-row";

export function FamilyCarouselRow({
  row
}: Readonly<{ row: FamilyHomeRowDto }>) {
  if (row.items.length === 0) {
    return null;
  }

  return (
    <HomeRow title={row.categoryName}>
      {row.items.map((item) => (
        <FamilyContentCard item={item} key={item.id} />
      ))}
    </HomeRow>
  );
}

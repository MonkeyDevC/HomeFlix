import type { FamilyHomeRowDto } from "../../lib/family/storefront-contracts";
import { FamilyContentCard } from "./family-content-card";

export function FamilyCollectionRow({
  row
}: Readonly<{ row: FamilyHomeRowDto }>) {
  if (row.items.length === 0) {
    return null;
  }

  return (
    <section className="sf-row" aria-label={row.categoryName}>
      <div className="sf-row-head">
        <h2 className="sf-row-title">{row.categoryName}</h2>
      </div>
      <div className="sf-row-scroll">
        {row.items.map((item) => (
          <FamilyContentCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

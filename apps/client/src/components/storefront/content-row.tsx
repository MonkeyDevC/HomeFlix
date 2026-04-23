import type { ContentItemReadModel } from "@homeflix/contracts";
import Link from "next/link";
import { ContentCard } from "./content-card";

export function ContentRow({
  title,
  items,
  seeAllHref
}: Readonly<{
  title: string;
  items: readonly ContentItemReadModel[];
  seeAllHref?: string;
}>) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="sf-row" aria-label={title}>
      <div className="sf-row-head">
        <h2 className="sf-row-title">{title}</h2>
        {seeAllHref ? (
          <Link className="sf-row-link" href={seeAllHref}>
            Explorar
          </Link>
        ) : null}
      </div>
      <div className="sf-row-scroll">
        {items.map((item) => (
          <ContentCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

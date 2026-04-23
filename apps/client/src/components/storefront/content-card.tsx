import type { ContentItemReadModel } from "@homeflix/contracts";
import Link from "next/link";

function hueFromString(value: string): number {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash) % 360;
}

export function ContentCard({
  item
}: Readonly<{
  item: ContentItemReadModel;
}>) {
  const hue = hueFromString(item.id);
  const subtitle = item.primaryCollection?.name ?? item.primaryCategory?.name;

  return (
    <Link className="sf-card" href={`/c/${encodeURIComponent(item.slug)}`}>
      <div
        className="sf-card-art"
        style={{
          background: `linear-gradient(145deg, hsl(${hue}, 55%, 22%), hsl(${(hue + 40) % 360}, 45%, 12%))`
        }}
      >
        <span className="sf-card-type">{item.type}</span>
      </div>
      <div className="sf-card-body">
        <p className="sf-card-title">{item.title}</p>
        {subtitle ? <p className="sf-card-sub">{subtitle}</p> : null}
      </div>
    </Link>
  );
}

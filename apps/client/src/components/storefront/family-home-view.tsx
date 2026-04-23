import type {
  FamilyContinueWatchingItemDto,
  FamilyHomeCardDto,
  FamilyHomeDto
} from "../../lib/family/storefront-contracts";
import { ContinueWatchingRow } from "./continue-watching-row";
import { FamilyCarouselRow } from "./family-carousel-row";
import { FamilyEmptyCatalogState } from "./family-empty-catalog-state";
import { FamilyContentCard } from "./family-content-card";
import { HomeHeroCarousel } from "./home/home-hero-carousel";
import { HomeRow } from "./home/home-row";
import { WatchlistProvider } from "./home/watchlist-context";

const HERO_MAX_SLIDES = 5;

/**
 * Construye la rotaci\u00f3n del hero tomando el primer item de cada fila poblada
 * (una card por categor\u00eda/secci\u00f3n), sin duplicados. Si hay menos de
 * {@link HERO_MAX_SLIDES} rows con contenido, completamos con el resto de la
 * primera fila hasta llegar al m\u00e1ximo.
 */
function buildHeroSlides(
  rows: readonly FamilyHomeDto["rows"][number][]
): readonly FamilyHomeCardDto[] {
  const slides: FamilyHomeCardDto[] = [];
  const seenIds = new Set<string>();

  for (const row of rows) {
    const first = row.items[0];
    if (first !== undefined && !seenIds.has(first.id)) {
      slides.push(first);
      seenIds.add(first.id);
    }
    if (slides.length >= HERO_MAX_SLIDES) break;
  }

  if (slides.length < HERO_MAX_SLIDES && rows.length > 0) {
    for (const item of rows[0]!.items) {
      if (seenIds.has(item.id)) continue;
      slides.push(item);
      seenIds.add(item.id);
      if (slides.length >= HERO_MAX_SLIDES) break;
    }
  }

  return slides;
}

/** Keys "kind:id" iniciales para hidratar el `WatchlistProvider`. */
function buildInitialWatchlistKeys(
  myList: readonly FamilyHomeCardDto[],
  watchlistIds: readonly string[]
): readonly string[] {
  const fromMyList = myList.map((card) => `${card.kind}:${card.id}`);
  const fromIds = watchlistIds.map((id) => `standalone:${id}`);
  return Array.from(new Set([...fromMyList, ...fromIds]));
}

export function FamilyHomeView({
  home,
  continueWatching
}: Readonly<{
  home: FamilyHomeDto;
  continueWatching: readonly FamilyContinueWatchingItemDto[];
}>) {
  const populatedRows = home.rows.filter((row) => row.items.length > 0);
  const hasAnyContent = populatedRows.length > 0;
  const heroSlides = buildHeroSlides(populatedRows);
  const initialKeys = buildInitialWatchlistKeys(home.myList, home.watchlistContentItemIds);

  return (
    <WatchlistProvider initialKeys={initialKeys}>
      <div className="sf-home sf-home--stitch">
        <HomeHeroCarousel items={heroSlides} profileName={home.profile.displayName} />

        <div className="sf-home-body sf-home-body--stitch">
          <ContinueWatchingRow items={continueWatching} />

          {home.myList.length > 0 ? (
            <HomeRow title="Mi lista">
              {home.myList.map((item) => (
                <FamilyContentCard item={item} key={`mylist-${item.id}`} />
              ))}
            </HomeRow>
          ) : null}

          {hasAnyContent ? (
            populatedRows.map((row) => <FamilyCarouselRow key={row.categoryId} row={row} />)
          ) : (
            <div className="sf-home-empty-wrap">
              <FamilyEmptyCatalogState profileName={home.profile.displayName} />
            </div>
          )}
        </div>
      </div>
    </WatchlistProvider>
  );
}

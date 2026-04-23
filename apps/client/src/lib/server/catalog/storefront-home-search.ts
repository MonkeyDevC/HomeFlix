import type { Prisma } from "../../../generated/prisma-family/client";
import type {
  FamilyHomeDto,
  FamilyHomeRowDto,
  FamilySearchResultDto
} from "../../family/storefront-contracts";
import type { ActiveProfileSummary } from "../auth/active-profile";
import { getFamilyPrisma } from "../db";
import {
  groupSeriesForCatalog,
  type CatalogItemRaw
} from "./group-series-for-catalog";
import {
  getWatchlistContentIdSetForProfile,
  listWatchlistCardsForProfile
} from "./watchlist-for-profile";

const contentCardSelect = {
  id: true,
  slug: true,
  title: true,
  synopsis: true,
  posterPath: true,
  thumbnailPath: true,
  type: true,
  seasonNumber: true,
  episodeNumber: true,
  category: {
    select: {
      id: true,
      slug: true,
      name: true
    }
  },
  collectionLinks: {
    orderBy: { position: "asc" },
    take: 1,
    select: {
      collection: {
        select: {
          id: true,
          slug: true,
          name: true,
          description: true
        }
      }
    }
  },
  mediaAssets: {
    where: { status: "ready" },
    orderBy: { updatedAt: "desc" },
    take: 1,
    select: {
      id: true,
      durationSeconds: true
    }
  }
} satisfies Prisma.ContentItemSelect;

type ContentCardRaw = Prisma.ContentItemGetPayload<{ select: typeof contentCardSelect }>;

/** Normaliza la fila cruda de Prisma al `CatalogItemRaw` que consume el agrupador. */
function toRaw(row: ContentCardRaw): CatalogItemRaw {
  const previewAsset = row.mediaAssets[0] ?? null;
  const primaryCollection = row.collectionLinks[0]?.collection ?? null;

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    synopsis: row.synopsis,
    posterPath: row.posterPath,
    thumbnailPath: row.thumbnailPath,
    type: row.type,
    seasonNumber: row.seasonNumber,
    episodeNumber: row.episodeNumber,
    primaryCollection:
      primaryCollection === null
        ? null
        : {
            id: primaryCollection.id,
            slug: primaryCollection.slug,
            name: primaryCollection.name,
            description: primaryCollection.description
          },
    category: row.category,
    previewVideoAssetId: previewAsset?.id ?? null,
    durationSeconds: previewAsset?.durationSeconds ?? null
  };
}

export async function getFamilyHomeForProfile(
  activeProfile: ActiveProfileSummary
): Promise<FamilyHomeDto> {
  const prisma = getFamilyPrisma();

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      slug: true,
      name: true,
      contentItems: {
        where: {
          editorialStatus: "published",
          accessGrants: { some: { profileId: activeProfile.profileId } }
        },
        orderBy: [
          // Series primero ordenan por season/episode para que el representante sea determinista.
          { seasonNumber: "asc" },
          { episodeNumber: "asc" },
          { updatedAt: "desc" },
          { title: "asc" }
        ],
        select: contentCardSelect
      }
    }
  });

  const rows: FamilyHomeRowDto[] = categories.map((category) => ({
    categoryId: category.id,
    categorySlug: category.slug,
    categoryName: category.name,
    items: groupSeriesForCatalog(category.contentItems.map(toRaw))
  }));

  const [myList, watchlistIdSet] = await Promise.all([
    listWatchlistCardsForProfile(activeProfile.profileId),
    getWatchlistContentIdSetForProfile(activeProfile.profileId)
  ]);

  return {
    profile: {
      id: activeProfile.profileId,
      displayName: activeProfile.displayName
    },
    rows,
    myList,
    watchlistContentItemIds: Array.from(watchlistIdSet)
  };
}

export async function searchFamilyCatalogForProfile(
  profileId: string,
  query: string
): Promise<FamilySearchResultDto> {
  const clean = query.trim();
  const prisma = getFamilyPrisma();

  if (clean.length === 0) {
    const suggested = await prisma.contentItem.findMany({
      where: {
        editorialStatus: "published",
        accessGrants: { some: { profileId } }
      },
      orderBy: [
        { seasonNumber: "asc" },
        { episodeNumber: "asc" },
        { updatedAt: "desc" },
        { title: "asc" }
      ],
      select: contentCardSelect,
      take: 36
    });

    return {
      query: "",
      items: groupSeriesForCatalog(suggested.map(toRaw))
    };
  }

  // En búsqueda por texto también buscamos por el nombre/slug/descripción de la
  // serie: un usuario que teclee el nombre de la colección debería ver la card
  // agrupada aunque los episodios no matchen literalmente.
  const rows = await prisma.contentItem.findMany({
    where: {
      editorialStatus: "published",
      accessGrants: { some: { profileId } },
      OR: [
        { title: { contains: clean, mode: "insensitive" } },
        { slug: { contains: clean, mode: "insensitive" } },
        { synopsis: { contains: clean, mode: "insensitive" } },
        {
          collectionLinks: {
            some: {
              collection: {
                OR: [
                  { name: { contains: clean, mode: "insensitive" } },
                  { slug: { contains: clean, mode: "insensitive" } },
                  { description: { contains: clean, mode: "insensitive" } }
                ]
              }
            }
          }
        }
      ]
    },
    orderBy: [
      { seasonNumber: "asc" },
      { episodeNumber: "asc" },
      { updatedAt: "desc" }
    ],
    select: contentCardSelect,
    take: 120
  });

  return {
    query: clean,
    items: groupSeriesForCatalog(rows.map(toRaw))
  };
}

import type { Prisma } from "../../../generated/prisma-family/client";
import type {
  ContentDetailFamilyDto,
  ContentTypeFamily,
  UserRoleFamily
} from "../../family/domain-shapes";
import { getFamilyPrisma } from "../db";
import { prismaWhereStorefrontVisibleContent } from "./content-storefront-visibility";

export type DetailEpisodeDto = Readonly<{
  id: string;
  slug: string;
  title: string;
  synopsis: string | null;
  type: ContentTypeFamily;
  thumbnailPath: string | null;
  posterPath: string | null;
  position: number;
  seasonNumber: number | null;
  episodeNumber: number | null;
  durationSeconds: number | null;
  progressSeconds: number | null;
  hasMedia: boolean;
  isCurrent: boolean;
}>;

export type DetailRelatedItemDto = Readonly<{
  id: string;
  slug: string;
  title: string;
  posterPath: string | null;
  thumbnailPath: string | null;
  type: ContentTypeFamily;
}>;

export type DetailRelatedDataDto = Readonly<{
  series: Readonly<{
    collectionId: string;
    collectionSlug: string;
    collectionName: string;
    episodes: readonly DetailEpisodeDto[];
  }> | null;
  moreLikeThis: readonly DetailRelatedItemDto[];
}>;

const siblingSelect = {
  id: true,
  slug: true,
  title: true,
  synopsis: true,
  type: true,
  thumbnailPath: true,
  posterPath: true,
  seasonNumber: true,
  episodeNumber: true,
  mediaAssets: {
    where: { status: "ready" },
    orderBy: { updatedAt: "desc" },
    take: 1,
    select: { id: true, durationSeconds: true }
  }
} satisfies Prisma.ContentItemSelect;

type SiblingRaw = Prisma.ContentItemGetPayload<{ select: typeof siblingSelect }>;

function sortDetailEpisodesAsc(
  episodes: readonly DetailEpisodeDto[]
): readonly DetailEpisodeDto[] {
  return [...episodes].sort((a, b) => {
    const seasonA = a.seasonNumber ?? Number.POSITIVE_INFINITY;
    const seasonB = b.seasonNumber ?? Number.POSITIVE_INFINITY;
    if (seasonA !== seasonB) return seasonA - seasonB;

    const epA = a.episodeNumber ?? Number.POSITIVE_INFINITY;
    const epB = b.episodeNumber ?? Number.POSITIVE_INFINITY;
    if (epA !== epB) return epA - epB;

    if (a.position !== b.position) return a.position - b.position;
    return a.title.localeCompare(b.title);
  });
}

function toRelatedItem(row: {
  id: string;
  slug: string;
  title: string;
  type: string;
  thumbnailPath: string | null;
  posterPath: string | null;
}): DetailRelatedItemDto {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    posterPath: row.posterPath,
    thumbnailPath: row.thumbnailPath,
    type: row.type as ContentTypeFamily
  };
}

/**
 * Carga datos "relacionados" al detalle:
 * - Serie/colección: si el item pertenece a una colección, lista los otros items publicados y accesibles por el perfil.
 * - More like this: otros items publicados y accesibles de la misma categoría.
 *
 * No crea endpoints nuevos: todo se resuelve en el mismo server component via Prisma.
 */
export async function getRelatedForContentDetail(
  item: ContentDetailFamilyDto,
  profileId: string,
  viewerRole: UserRoleFamily
): Promise<DetailRelatedDataDto> {
  const prisma = getFamilyPrisma();
  const primaryCollection = item.collections[0] ?? null;
  const visibleWhere = prismaWhereStorefrontVisibleContent(profileId, viewerRole);

  const [collectionLinks, moreRaw] = await Promise.all([
    primaryCollection === null
      ? Promise.resolve(
          [] as Array<{
            position: number;
            contentItem: SiblingRaw;
          }>
        )
      : prisma.contentItemCollectionLink.findMany({
          where: {
            collectionId: primaryCollection.id,
            contentItem: {
              AND: [visibleWhere]
            }
          },
          orderBy: { position: "asc" },
          select: {
            position: true,
            contentItem: { select: siblingSelect }
          }
        }),
    item.category === null
      ? Promise.resolve([] as SiblingRaw[])
      : prisma.contentItem.findMany({
          where: {
            AND: [
              visibleWhere,
              { categoryId: item.category.id },
              { id: { not: item.id } }
            ]
          },
          orderBy: [{ updatedAt: "desc" }, { title: "asc" }],
          take: 6,
          select: siblingSelect
        })
  ]);

  let progressByItemId = new Map<string, number>();
  if (collectionLinks.length > 0) {
    const ids = collectionLinks.map((link) => link.contentItem.id);
    const history = await prisma.watchHistory.findMany({
      where: {
        profileId,
        contentItemId: { in: ids }
      },
      select: { contentItemId: true, progressSeconds: true }
    });
    progressByItemId = new Map(
      history.map((h) => [h.contentItemId, h.progressSeconds] as const)
    );
  }

  const seriesEpisodes =
    primaryCollection === null
      ? []
      : collectionLinks.map<DetailEpisodeDto>((link) => {
          const ep = link.contentItem;
          const media = ep.mediaAssets[0] ?? null;
          return {
            id: ep.id,
            slug: ep.slug,
            title: ep.title,
            synopsis: ep.synopsis,
            type: ep.type as ContentTypeFamily,
            thumbnailPath: ep.thumbnailPath,
            posterPath: ep.posterPath,
            position: link.position,
            seasonNumber: ep.seasonNumber,
            episodeNumber: ep.episodeNumber,
            durationSeconds: media?.durationSeconds ?? null,
            progressSeconds: progressByItemId.get(ep.id) ?? null,
            hasMedia: media !== null,
            isCurrent: ep.id === item.id
          };
        });

  const series =
    primaryCollection === null || collectionLinks.length === 0
      ? null
      : {
          collectionId: primaryCollection.id,
          collectionSlug: primaryCollection.slug,
          collectionName: primaryCollection.name,
          episodes: sortDetailEpisodesAsc(seriesEpisodes)
        };

  return {
    series,
    moreLikeThis: moreRaw.map((row) =>
      toRelatedItem({
        id: row.id,
        slug: row.slug,
        title: row.title,
        type: row.type,
        thumbnailPath: row.thumbnailPath,
        posterPath: row.posterPath
      })
    )
  };
}

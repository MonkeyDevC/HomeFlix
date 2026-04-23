/**
 * Detalle de una serie (Collection) para el perfil activo.
 *
 * Contrato:
 *   - La serie es visible si existe una `Collection` con `slug` dado y al menos
 *     un `ContentItem` publicado + accesible por el perfil.
 *   - Los episodios se ordenan por `ContentItemCollectionLink.position` y
 *     fallback por `(seasonNumber, episodeNumber)`.
 *   - El helper reutiliza las mismas reglas de acceso que el catálogo general
 *     (published + `ProfileContentAccess`).
 *
 * No se crea un nuevo endpoint HTTP: el page `/series/[slug]` llama a este
 * helper server-side directamente.
 */
import type { Prisma } from "../../../generated/prisma-family/client";
import type { ContentTypeFamily } from "../../family/domain-shapes";
import { getFamilyPrisma } from "../db";

export type SeriesEpisodeDto = Readonly<{
  id: string;
  slug: string;
  title: string;
  synopsis: string | null;
  type: ContentTypeFamily;
  posterPath: string | null;
  thumbnailPath: string | null;
  seasonNumber: number | null;
  episodeNumber: number | null;
  position: number;
  durationSeconds: number | null;
  progressSeconds: number | null;
  hasMedia: boolean;
}>;

export type SeriesDetailDto = Readonly<{
  collection: Readonly<{
    id: string;
    slug: string;
    name: string;
    description: string | null;
  }>;
  posterPath: string | null;
  thumbnailPath: string | null;
  previewVideoAssetId: string | null;
  category: Readonly<{ id: string; slug: string; name: string }> | null;
  totalDurationSeconds: number | null;
  episodes: readonly SeriesEpisodeDto[];
}>;

const linkSelect = {
  position: true,
  contentItem: {
    select: {
      id: true,
      slug: true,
      title: true,
      synopsis: true,
      type: true,
      posterPath: true,
      thumbnailPath: true,
      seasonNumber: true,
      episodeNumber: true,
      category: {
        select: { id: true, slug: true, name: true }
      },
      mediaAssets: {
        where: { status: "ready" },
        orderBy: { updatedAt: "desc" },
        take: 1,
        select: { id: true, durationSeconds: true }
      }
    }
  }
} satisfies Prisma.ContentItemCollectionLinkSelect;

type LinkRaw = Prisma.ContentItemCollectionLinkGetPayload<{ select: typeof linkSelect }>;

function pickRepresentative(links: readonly LinkRaw[]): LinkRaw | null {
  if (links.length === 0) return null;
  // Menor (seasonNumber, episodeNumber); fallback al primero por position.
  let best = links[0]!;
  for (const link of links) {
    const bestSeason = best.contentItem.seasonNumber ?? Number.POSITIVE_INFINITY;
    const candSeason = link.contentItem.seasonNumber ?? Number.POSITIVE_INFINITY;
    if (candSeason < bestSeason) {
      best = link;
      continue;
    }
    if (candSeason === bestSeason) {
      const bestEp = best.contentItem.episodeNumber ?? Number.POSITIVE_INFINITY;
      const candEp = link.contentItem.episodeNumber ?? Number.POSITIVE_INFINITY;
      if (candEp < bestEp) {
        best = link;
      }
    }
  }
  return best;
}

export async function getSeriesDetailForActiveProfile(
  collectionSlug: string,
  profileId: string
): Promise<SeriesDetailDto | null> {
  const prisma = getFamilyPrisma();

  const collection = await prisma.collection.findUnique({
    where: { slug: collectionSlug },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true
    }
  });
  if (collection === null) {
    return null;
  }

  const links = await prisma.contentItemCollectionLink.findMany({
    where: {
      collectionId: collection.id,
      contentItem: {
        editorialStatus: "published",
        accessGrants: { some: { profileId } }
      }
    },
    orderBy: [{ position: "asc" }],
    select: linkSelect
  });

  if (links.length === 0) {
    // Una serie sin episodios visibles para el perfil NO es descubrible.
    return null;
  }

  const ids = links.map((l) => l.contentItem.id);
  const history = await prisma.watchHistory.findMany({
    where: {
      profileId,
      contentItemId: { in: ids }
    },
    select: { contentItemId: true, progressSeconds: true }
  });
  const progressById = new Map(
    history.map((h) => [h.contentItemId, h.progressSeconds] as const)
  );

  const representative = pickRepresentative(links);
  const repItem = representative?.contentItem ?? null;
  const repAsset = repItem?.mediaAssets[0] ?? null;

  let total = 0;
  let haveAnyDuration = false;
  const episodes: SeriesEpisodeDto[] = links.map((link) => {
    const item = link.contentItem;
    const asset = item.mediaAssets[0] ?? null;
    if (asset !== null && asset.durationSeconds !== null) {
      total += asset.durationSeconds;
      haveAnyDuration = true;
    }
    return {
      id: item.id,
      slug: item.slug,
      title: item.title,
      synopsis: item.synopsis,
      type: item.type as ContentTypeFamily,
      posterPath: item.posterPath,
      thumbnailPath: item.thumbnailPath,
      seasonNumber: item.seasonNumber,
      episodeNumber: item.episodeNumber,
      position: link.position,
      durationSeconds: asset?.durationSeconds ?? null,
      progressSeconds: progressById.get(item.id) ?? null,
      hasMedia: asset !== null
    };
  });

  return {
    collection,
    posterPath: repItem?.posterPath ?? null,
    thumbnailPath: repItem?.thumbnailPath ?? null,
    previewVideoAssetId: repAsset?.id ?? null,
    category: repItem?.category ?? null,
    totalDurationSeconds: haveAnyDuration ? total : null,
    episodes
  };
}

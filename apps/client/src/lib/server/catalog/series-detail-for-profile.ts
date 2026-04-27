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
import type { ContentTypeFamily, UserRoleFamily } from "../../family/domain-shapes";
import { familyGalleryPublicPhotoUrl } from "../../family/photo-constants";
import { getFamilyPrisma } from "../db";
import { prismaWhereStorefrontVisibleContent } from "./content-storefront-visibility";

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
  /** Solo `photo_gallery`: cantidad de fotos en la galería. */
  photoCount: number;
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
      coverPhotoId: true,
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
      },
      photoAssets: {
        orderBy: { sortOrder: "asc" as const },
        take: 1,
        select: { id: true }
      },
      _count: {
        select: { photoAssets: true }
      }
    }
  }
} satisfies Prisma.ContentItemCollectionLinkSelect;

type LinkRaw = Prisma.ContentItemCollectionLinkGetPayload<{ select: typeof linkSelect }>;

function sortSeriesEpisodesAsc(
  episodes: readonly SeriesEpisodeDto[]
): readonly SeriesEpisodeDto[] {
  return [...episodes].sort((a, b) => {
    if (a.position !== b.position) {
      return a.position - b.position;
    }
    const seasonA = a.seasonNumber ?? Number.POSITIVE_INFINITY;
    const seasonB = b.seasonNumber ?? Number.POSITIVE_INFINITY;
    if (seasonA !== seasonB) return seasonA - seasonB;

    const epA = a.episodeNumber ?? Number.POSITIVE_INFINITY;
    const epB = b.episodeNumber ?? Number.POSITIVE_INFINITY;
    if (epA !== epB) return epA - epB;

    return a.title.localeCompare(b.title);
  });
}

function pickRepresentative(links: readonly LinkRaw[]): LinkRaw | null {
  if (links.length === 0) return null;
  const byPos = [...links].sort((a, b) => a.position - b.position);
  const firstVideo = byPos.find(
    (l) =>
      l.contentItem.type !== "photo_gallery" && l.contentItem.mediaAssets[0] !== undefined
  );
  if (firstVideo !== undefined) {
    return firstVideo;
  }
  const firstWithPhotos = byPos.find(
    (l) => l.contentItem.type === "photo_gallery" && l.contentItem._count.photoAssets > 0
  );
  if (firstWithPhotos !== undefined) {
    return firstWithPhotos;
  }
  return byPos[0] ?? null;
}

function cardArtForSeriesItem(
  item: LinkRaw["contentItem"]
): { poster: string | null; thumb: string | null } {
  if (item.type === "photo_gallery") {
    const n = item._count.photoAssets;
    if (n < 1) {
      return { poster: item.posterPath, thumb: item.thumbnailPath };
    }
    const cover =
      item.coverPhotoId !== null
        ? familyGalleryPublicPhotoUrl(item.coverPhotoId)
        : item.photoAssets[0] !== undefined
          ? familyGalleryPublicPhotoUrl(item.photoAssets[0].id)
          : null;
    return {
      poster: item.posterPath ?? item.thumbnailPath ?? cover,
      thumb: item.thumbnailPath ?? item.posterPath ?? cover
    };
  }
  return { poster: item.posterPath, thumb: item.thumbnailPath };
}

export async function getSeriesDetailForActiveProfile(
  collectionSlug: string,
  profileId: string,
  viewerRole: UserRoleFamily
): Promise<SeriesDetailDto | null> {
  const prisma = getFamilyPrisma();
  const visibleWhere = prismaWhereStorefrontVisibleContent(profileId, viewerRole);

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
        AND: [visibleWhere]
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
  const repAsset = repItem?.type === "photo_gallery" ? null : (repItem?.mediaAssets[0] ?? null);
  const repCardArt = repItem === null ? { poster: null, thumb: null } : cardArtForSeriesItem(repItem);

  let total = 0;
  let haveAnyDuration = false;
  const episodesUnsorted: SeriesEpisodeDto[] = links.map((link) => {
    const item = link.contentItem;
    const asset = item.mediaAssets[0] ?? null;
    const photoCount = item._count.photoAssets;
    if (item.type !== "photo_gallery" && asset !== null && asset.durationSeconds !== null) {
      total += asset.durationSeconds;
      haveAnyDuration = true;
    }
    const isGallery = item.type === "photo_gallery";
    const hasVideo = !isGallery && asset !== null;
    const hasGallery = isGallery && photoCount > 0;
    const art = cardArtForSeriesItem(item);
    return {
      id: item.id,
      slug: item.slug,
      title: item.title,
      synopsis: item.synopsis,
      type: item.type as ContentTypeFamily,
      posterPath: art.poster,
      thumbnailPath: art.thumb,
      seasonNumber: item.seasonNumber,
      episodeNumber: item.episodeNumber,
      position: link.position,
      durationSeconds: asset?.durationSeconds ?? null,
      progressSeconds: progressById.get(item.id) ?? null,
      hasMedia: hasVideo || hasGallery,
      photoCount
    };
  });

  const episodes = sortSeriesEpisodesAsc(episodesUnsorted);

  return {
    collection,
    posterPath: repCardArt.poster,
    thumbnailPath: repCardArt.thumb,
    previewVideoAssetId: repAsset?.id ?? null,
    category: repItem?.category ?? null,
    totalDurationSeconds: haveAnyDuration ? total : null,
    episodes
  };
}

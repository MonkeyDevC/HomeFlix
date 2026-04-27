import type { UserRoleFamily } from "../../family/domain-shapes";
import type { FamilyHomeCardDto } from "../../family/storefront-contracts";
import { familyGalleryPublicPhotoUrl } from "../../family/photo-constants";
import { getFamilyPrisma } from "../db";
import { prismaWhereStorefrontVisibleContent } from "./content-storefront-visibility";
import { groupSeriesForCatalog, type CatalogItemRaw } from "./group-series-for-catalog";

const watchlistCardSelect = {
  id: true,
  slug: true,
  title: true,
  synopsis: true,
  posterPath: true,
  thumbnailPath: true,
  type: true,
  coverPhotoId: true,
  seasonNumber: true,
  episodeNumber: true,
  photoAssets: {
    orderBy: { sortOrder: "asc" as const },
    take: 1,
    select: { id: true }
  },
  category: {
    select: {
      id: true,
      slug: true,
      name: true
    }
  },
  collectionLinks: {
    orderBy: { position: "asc" as const },
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
    orderBy: { updatedAt: "desc" as const },
    take: 1,
    select: {
      id: true,
      durationSeconds: true
    }
  }
};

type WatchlistItemRaw = {
  id: string;
  slug: string;
  title: string;
  synopsis: string | null;
  posterPath: string | null;
  thumbnailPath: string | null;
  type: string;
  coverPhotoId: string | null;
  seasonNumber: number | null;
  episodeNumber: number | null;
  photoAssets: Array<{ id: string }>;
  category: { id: string; slug: string; name: string } | null;
  collectionLinks: Array<{
    collection: {
      id: string;
      slug: string;
      name: string;
      description: string | null;
    };
  }>;
  mediaAssets: Array<{ id: string; durationSeconds: number | null }>;
};

function toCatalogRaw(row: WatchlistItemRaw): CatalogItemRaw {
  const previewAsset = row.mediaAssets[0] ?? null;
  const primaryCollection = row.collectionLinks[0]?.collection ?? null;

  const galleryFallback =
    row.type === "photo_gallery"
      ? row.coverPhotoId !== null
        ? familyGalleryPublicPhotoUrl(row.coverPhotoId)
        : row.photoAssets[0] !== undefined
          ? familyGalleryPublicPhotoUrl(row.photoAssets[0].id)
          : null
      : null;
  const posterPath =
    row.type === "photo_gallery"
      ? (row.posterPath ?? row.thumbnailPath ?? galleryFallback)
      : row.posterPath;
  const thumbnailPath =
    row.type === "photo_gallery" ? (row.thumbnailPath ?? row.posterPath ?? galleryFallback) : row.thumbnailPath;

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    synopsis: row.synopsis,
    posterPath,
    thumbnailPath,
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

/**
 * Resuelve el identificador "watchlistable" para un card del Home o del detalle.
 *
 * En HomeFlix Family V1 el usuario agrega a "Mi lista" cualquier pieza editorial.
 * Para las series, guardamos el ContentItem representativo (primer episodio accesible
 * para el perfil), así la lista siempre apunta a algo reproducible y evitamos
 * duplicar filas por cada capítulo. El agrupador vuelve a unificar la serie al render.
 */
export type WatchlistKey = Readonly<{
  /** ContentItem.id a almacenar. */
  contentItemId: string;
}>;

async function resolveSeriesRepresentativeContentId(
  profileId: string,
  collectionId: string,
  viewerRole: UserRoleFamily
): Promise<string | null> {
  const prisma = getFamilyPrisma();
  const visibleWhere = prismaWhereStorefrontVisibleContent(profileId, viewerRole);
  const episode = await prisma.contentItem.findFirst({
    where: {
      AND: [
        visibleWhere,
        {
          collectionLinks: { some: { collectionId } }
        }
      ]
    },
    orderBy: [
      { seasonNumber: "asc" },
      { episodeNumber: "asc" },
      { title: "asc" }
    ],
    select: { id: true }
  });
  return episode?.id ?? null;
}

/** Devuelve el id de ContentItem que debemos guardar para un card del storefront. */
export async function resolveWatchlistContentItemId(
  profileId: string,
  card: Readonly<{ kind: "series" | "standalone"; id: string }>,
  viewerRole: UserRoleFamily
): Promise<string | null> {
  if (card.kind === "standalone") {
    return card.id;
  }
  return resolveSeriesRepresentativeContentId(profileId, card.id, viewerRole);
}

/** Agrega (si no existe) un ContentItem a la lista personal del perfil. */
export async function addToWatchlist(
  profileId: string,
  contentItemId: string,
  viewerRole: UserRoleFamily
): Promise<{ ok: true } | { ok: false; error: "not_visible" }> {
  const prisma = getFamilyPrisma();
  const visible = await prisma.contentItem.findFirst({
    where: {
      id: contentItemId,
      AND: [prismaWhereStorefrontVisibleContent(profileId, viewerRole)]
    },
    select: { id: true }
  });

  if (visible === null) {
    return { ok: false, error: "not_visible" };
  }

  await prisma.profileWatchlistItem.upsert({
    where: { profileId_contentItemId: { profileId, contentItemId } },
    create: { profileId, contentItemId },
    update: {}
  });

  return { ok: true };
}

/** Retira un ContentItem de la lista personal (idempotente). */
export async function removeFromWatchlist(
  profileId: string,
  contentItemId: string
): Promise<void> {
  const prisma = getFamilyPrisma();
  await prisma.profileWatchlistItem.deleteMany({
    where: { profileId, contentItemId }
  });
}

/** Conjunto de ContentItem.id actualmente en la watchlist del perfil. */
export async function getWatchlistContentIdSetForProfile(
  profileId: string
): Promise<ReadonlySet<string>> {
  const prisma = getFamilyPrisma();
  const rows = await prisma.profileWatchlistItem.findMany({
    where: { profileId },
    select: { contentItemId: true }
  });
  return new Set(rows.map((r) => r.contentItemId));
}

/**
 * Devuelve los items de la watchlist ya normalizados a cards del storefront.
 * Si un ContentItem está en lista pero dejó de ser visible/accesible, lo omitimos
 * (el usuario puede limpiarlo luego desde la UI al reintentarlo).
 */
export async function listWatchlistCardsForProfile(
  profileId: string,
  viewerRole: UserRoleFamily
): Promise<readonly FamilyHomeCardDto[]> {
  const prisma = getFamilyPrisma();
  const visibleWhere = prismaWhereStorefrontVisibleContent(profileId, viewerRole);
  const rows = await prisma.profileWatchlistItem.findMany({
    where: {
      profileId,
      contentItem: {
        AND: [visibleWhere]
      }
    },
    orderBy: { createdAt: "desc" },
    take: 48,
    select: {
      contentItem: { select: watchlistCardSelect }
    }
  });

  const raws: CatalogItemRaw[] = rows.map((row) =>
    toCatalogRaw(row.contentItem as WatchlistItemRaw)
  );
  return groupSeriesForCatalog(raws);
}

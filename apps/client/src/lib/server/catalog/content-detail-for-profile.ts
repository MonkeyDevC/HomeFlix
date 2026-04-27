import { stat } from "node:fs/promises";
import type { Prisma } from "../../../generated/prisma-family/client";
import { familyGalleryPublicPhotoUrl } from "../../family/photo-constants";
import type {
  ContentDetailForProfileFamily,
  LocalPlaybackDto,
  LocalPlaybackStateFamily,
  PhotoGalleryStateFamily,
  UserRoleFamily
} from "../../family/domain-shapes";
import { getFamilyPrisma } from "../db";
import { isManagedStoragePath, resolveStorageDiskPath } from "../storage/family-storage";
import { prismaWhereStorefrontVisibleContent } from "./content-storefront-visibility";

const detailSelect = {
  id: true,
  slug: true,
  title: true,
  synopsis: true,
  editorialStatus: true,
  releaseScope: true,
  type: true,
  visibility: true,
  posterPath: true,
  thumbnailPath: true,
  coverPhotoId: true,
  photoAssets: {
    orderBy: [{ sortOrder: "asc" as const }, { createdAt: "asc" as const }],
    select: {
      id: true,
      filePath: true,
      sortOrder: true,
      width: true,
      height: true,
      mimeType: true
    }
  },
  category: {
    select: {
      id: true,
      slug: true,
      name: true
    }
  },
  collectionLinks: {
    orderBy: { position: "asc" },
    select: {
      position: true,
      collection: {
        select: {
          id: true,
          slug: true,
          name: true
        }
      }
    }
  }
} satisfies Prisma.ContentItemSelect;

type DetailRaw = Prisma.ContentItemGetPayload<{ select: typeof detailSelect }>;

async function fileExistsInPublicStorage(filePath: string): Promise<boolean> {
  const abs = resolveStorageDiskPath(filePath);
  if (abs === null) {
    return false;
  }
  try {
    await stat(abs);
    return true;
  } catch {
    return false;
  }
}

function mapDetail(row: DetailRaw): ContentDetailForProfileFamily["item"] {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    synopsis: row.synopsis,
    editorialStatus: row.editorialStatus as ContentDetailForProfileFamily["item"]["editorialStatus"],
    releaseScope: row.releaseScope as ContentDetailForProfileFamily["item"]["releaseScope"],
    type: row.type as ContentDetailForProfileFamily["item"]["type"],
    visibility: row.visibility as ContentDetailForProfileFamily["item"]["visibility"],
    posterPath: row.posterPath,
    thumbnailPath: row.thumbnailPath,
    category: row.category,
    collections: row.collectionLinks.map((l) => ({
      id: l.collection.id,
      slug: l.collection.slug,
      name: l.collection.name,
      position: l.position
    }))
  };
}

function mapPlayback(asset: {
  id: string;
  filePath: string;
  mimeType: string | null;
  sizeBytes: bigint | null;
  durationSeconds: number | null;
  width: number | null;
  height: number | null;
  frameRate: number | null;
  codec: string | null;
  status: string;
}): LocalPlaybackDto {
  return {
    mediaAssetId: asset.id,
    filePath: `/api/family/media/${asset.id}`,
    mimeType: asset.mimeType,
    sizeBytes: asset.sizeBytes?.toString() ?? null,
    durationSeconds: asset.durationSeconds,
    width: asset.width,
    height: asset.height,
    frameRate: asset.frameRate,
    codec: asset.codec,
    status: asset.status as LocalPlaybackDto["status"]
  };
}

export async function resolveLocalPlaybackForContent(
  contentItemId: string
): Promise<LocalPlaybackStateFamily> {
  const prisma = getFamilyPrisma();
  const itemMeta = await prisma.contentItem.findUnique({
    where: { id: contentItemId },
    select: { type: true }
  });
  if (itemMeta?.type === "photo_gallery") {
    return {
      state: "missing_media",
      reason: "Galería de fotos: abrí el visor más abajo."
    };
  }

  const asset = await prisma.mediaAsset.findFirst({
    where: { contentItemId },
    orderBy: { updatedAt: "desc" }
  });

  if (asset === null) {
    return { state: "missing_media", reason: "Este contenido todavía no tiene video local cargado." };
  }

  if (asset.status !== "ready") {
    return {
      state: "asset_unusable",
      reason: `El asset existe pero su estado es ${asset.status} (se requiere ready).`
    };
  }

  const mime = asset.mimeType?.toLowerCase() ?? "";
  if (!mime.startsWith("video/")) {
    return {
      state: "asset_unusable",
      reason: `El asset no es de video reproducible (${asset.mimeType ?? "mime desconocido"}).`
    };
  }

  if (!isManagedStoragePath(asset.filePath)) {
    return {
      state: "asset_unusable",
      reason: "Ruta de archivo inválida para reproducción local."
    };
  }

  const playback = mapPlayback(asset);
  const exists = await fileExistsInPublicStorage(asset.filePath);
  if (!exists) {
    return {
      state: "file_missing",
      reason: "El archivo físico no existe en disco.",
      playback
    };
  }

  return { state: "ready", playback };
}

/** Detalle Family V1 filtrado por perfil activo y reglas de catálogo (`releaseScope` + editorial + acceso). */
export async function getContentDetailForActiveProfile(
  slug: string,
  profileId: string,
  viewerRole: UserRoleFamily
): Promise<ContentDetailForProfileFamily | null> {
  const prisma = getFamilyPrisma();
  const row = await prisma.contentItem.findFirst({
    where: {
      slug,
      AND: [prismaWhereStorefrontVisibleContent(profileId, viewerRole)]
    },
    select: detailSelect
  });

  if (row === null) {
    return null;
  }

  const playback = await resolveLocalPlaybackForContent(row.id);

  let photoGallery: PhotoGalleryStateFamily = null;
  if (row.type === "photo_gallery") {
    if (row.photoAssets.length === 0) {
      photoGallery = { state: "empty" };
    } else {
      const listed = row.photoAssets.map((p) => ({
        id: p.id,
        url: familyGalleryPublicPhotoUrl(p.id),
        sortOrder: p.sortOrder,
        width: p.width,
        height: p.height,
        mimeType: p.mimeType
      }));
      const ordered = [...listed].sort((a, b) => a.sortOrder - b.sortOrder);
      photoGallery = { state: "ready", photos: ordered };
    }
  }

  return {
    item: mapDetail(row),
    playback,
    photoGallery
  };
}


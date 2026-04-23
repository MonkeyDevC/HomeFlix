import type { FamilyContinueWatchingItemDto } from "../../family/storefront-contracts";
import { getFamilyPrisma } from "../db";
import { resolveLocalPlaybackForContent } from "./content-detail-for-profile";

const MIN_PROGRESS_SECONDS = 2;
const COMPLETED_RATIO = 0.95;

type HistoryVisibilityError = "content_not_visible" | "media_not_playable";

type UpsertInput = Readonly<{
  profileId: string;
  contentItemId: string;
  progressSeconds: number;
  durationSeconds: number | null;
  ended: boolean;
}>;

type UpsertResult =
  | Readonly<{ kind: "ignored"; reason: "too_short" }>
  | Readonly<{
      kind: "saved";
      contentItemId: string;
      progressSeconds: number;
      durationSeconds: number | null;
      completedAt: string | null;
      updatedAt: string;
    }>;

async function assertVisibleAndPlayable(
  profileId: string,
  contentItemId: string
): Promise<HistoryVisibilityError | null> {
  const prisma = getFamilyPrisma();
  const visible = await prisma.contentItem.findFirst({
    where: {
      id: contentItemId,
      editorialStatus: "published",
      accessGrants: { some: { profileId } }
    },
    select: { id: true }
  });
  if (visible === null) {
    return "content_not_visible";
  }

  const playback = await resolveLocalPlaybackForContent(contentItemId);
  if (playback.state !== "ready") {
    return "media_not_playable";
  }

  return null;
}

function sanitizeFinitePositive(input: number): number {
  if (!Number.isFinite(input) || input < 0) {
    return 0;
  }
  return input;
}

export async function upsertWatchHistoryForProfile(input: UpsertInput): Promise<
  | { ok: true; result: UpsertResult }
  | { ok: false; error: HistoryVisibilityError }
> {
  const progressSeconds = sanitizeFinitePositive(input.progressSeconds);
  const durationSeconds = input.durationSeconds === null ? null : sanitizeFinitePositive(input.durationSeconds);

  if (progressSeconds < MIN_PROGRESS_SECONDS) {
    return { ok: true, result: { kind: "ignored", reason: "too_short" } };
  }

  const visibility = await assertVisibleAndPlayable(input.profileId, input.contentItemId);
  if (visibility !== null) {
    return { ok: false, error: visibility };
  }

  const now = new Date();
  const completed =
    input.ended ||
    (durationSeconds !== null &&
      durationSeconds > 0 &&
      progressSeconds / durationSeconds >= COMPLETED_RATIO);

  const prisma = getFamilyPrisma();
  const saved = await prisma.watchHistory.upsert({
    where: {
      profileId_contentItemId: {
        profileId: input.profileId,
        contentItemId: input.contentItemId
      }
    },
    create: {
      profileId: input.profileId,
      contentItemId: input.contentItemId,
      progressSeconds,
      durationSeconds,
      completedAt: completed ? now : null,
      lastWatchedAt: now
    },
    update: {
      progressSeconds,
      durationSeconds,
      completedAt: completed ? now : null,
      lastWatchedAt: now
    }
  });

  return {
    ok: true,
    result: {
      kind: "saved",
      contentItemId: saved.contentItemId,
      progressSeconds: saved.progressSeconds,
      durationSeconds: saved.durationSeconds,
      completedAt: saved.completedAt?.toISOString() ?? null,
      updatedAt: saved.updatedAt.toISOString()
    }
  };
}

export async function listContinueWatchingForProfile(
  profileId: string
): Promise<readonly FamilyContinueWatchingItemDto[]> {
  const prisma = getFamilyPrisma();
  const rows = await prisma.watchHistory.findMany({
    where: {
      profileId,
      completedAt: null,
      progressSeconds: { gte: MIN_PROGRESS_SECONDS },
      contentItem: {
        editorialStatus: "published",
        accessGrants: { some: { profileId } }
      }
    },
    orderBy: { updatedAt: "desc" },
    take: 24,
    select: {
      contentItemId: true,
      progressSeconds: true,
      durationSeconds: true,
      updatedAt: true,
      contentItem: {
        select: {
          slug: true,
          title: true,
          posterPath: true,
          thumbnailPath: true,
          type: true,
          category: {
            select: {
              name: true
            }
          },
          collectionLinks: {
            orderBy: { position: "asc" },
            take: 1,
            select: {
              collection: {
                select: {
                  name: true
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
        }
      }
    }
  });

  const valid: FamilyContinueWatchingItemDto[] = [];
  const invalidContentIds: string[] = [];

  for (const row of rows) {
    const playback = await resolveLocalPlaybackForContent(row.contentItemId);
    if (playback.state !== "ready") {
      invalidContentIds.push(row.contentItemId);
      continue;
    }

    const previewAsset = row.contentItem.mediaAssets[0] ?? null;
    const effectiveDuration =
      row.durationSeconds ?? previewAsset?.durationSeconds ?? playback.playback.durationSeconds ?? null;

    valid.push({
      contentItemId: row.contentItemId,
      contentItemSlug: row.contentItem.slug,
      contentItemTitle: row.contentItem.title,
      posterPath: row.contentItem.posterPath,
      thumbnailPath: row.contentItem.thumbnailPath,
      previewVideoAssetId: previewAsset?.id ?? null,
      type: row.contentItem.type,
      categoryName: row.contentItem.category?.name ?? null,
      collectionName: row.contentItem.collectionLinks[0]?.collection.name ?? null,
      progressSeconds: row.progressSeconds,
      durationSeconds: effectiveDuration,
      updatedAt: row.updatedAt.toISOString()
    });
  }

  if (invalidContentIds.length > 0) {
    await prisma.watchHistory.deleteMany({
      where: {
        profileId,
        contentItemId: { in: invalidContentIds }
      }
    });
  }

  return valid;
}

export async function getWatchProgressForProfileContent(
  profileId: string,
  contentItemId: string
): Promise<{ progressSeconds: number; durationSeconds: number | null } | null> {
  const prisma = getFamilyPrisma();
  const row = await prisma.watchHistory.findUnique({
    where: {
      profileId_contentItemId: {
        profileId,
        contentItemId
      }
    },
    select: {
      progressSeconds: true,
      durationSeconds: true,
      completedAt: true
    }
  });

  if (row === null || row.completedAt !== null || row.progressSeconds < MIN_PROGRESS_SECONDS) {
    return null;
  }

  return {
    progressSeconds: row.progressSeconds,
    durationSeconds: row.durationSeconds
  };
}

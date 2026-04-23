import type { ContentItemMediaAssetRole } from "@homeflix/domain";
import type { UpsertWatchHistoryRequest } from "@homeflix/contracts";
import type { Prisma, PrismaClient } from "../../generated/prisma/client.js";
import type {
  CatalogCategoryRecord,
  CatalogCollectionRecord,
  CatalogContentItemRecord,
  CatalogProfileRecord,
  CatalogWatchHistoryRecord
} from "./catalog.mapper.js";
import { isUuid } from "./catalog.validation.js";

const contentItemInclude = {
  mediaAssetLinks: {
    include: {
      mediaAsset: true
    },
    orderBy: {
      createdAt: "asc" as const
    }
  },
  primaryCategory: true,
  primaryCollection: true
};

const watchHistoryInclude = {
  contentItem: {
    include: contentItemInclude
  }
};

export class CatalogRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listContentItems(): Promise<CatalogContentItemRecord[]> {
    const records = await this.prisma.contentItem.findMany({
      include: contentItemInclude,
      orderBy: {
        createdAt: "desc"
      }
    });

    return records as unknown as CatalogContentItemRecord[];
  }

  async listPublishedContentItems(
    limit: number
  ): Promise<CatalogContentItemRecord[]> {
    const records = await this.prisma.contentItem.findMany({
      include: contentItemInclude,
      orderBy: [
        {
          publishedAt: "desc"
        },
        {
          createdAt: "desc"
        }
      ],
      take: limit,
      where: {
        editorialStatus: "published"
      }
    });

    return records as unknown as CatalogContentItemRecord[];
  }

  async searchPublishedContentItems(
    query: string,
    limit: number
  ): Promise<CatalogContentItemRecord[]> {
    const records = await this.prisma.contentItem.findMany({
      include: contentItemInclude,
      orderBy: {
        title: "asc"
      },
      take: limit,
      where: {
        AND: [
          {
            editorialStatus: "published"
          },
          {
            OR: [
              {
                title: {
                  contains: query,
                  mode: "insensitive"
                }
              },
              {
                slug: {
                  contains: query,
                  mode: "insensitive"
                }
              },
              {
                synopsis: {
                  contains: query,
                  mode: "insensitive"
                }
              }
            ]
          }
        ]
      }
    });

    return records as unknown as CatalogContentItemRecord[];
  }

  async findContentItemByIdOrSlug(
    value: string
  ): Promise<CatalogContentItemRecord | null> {
    const record = await this.prisma.contentItem.findFirst({
      include: contentItemInclude,
      where: isUuid(value)
        ? {
            OR: [
              {
                id: value
              },
              {
                slug: value
              }
            ]
          }
        : {
            slug: value
          }
    });

    return record as unknown as CatalogContentItemRecord | null;
  }

  async listCategories(): Promise<CatalogCategoryRecord[]> {
    const records = await this.prisma.category.findMany({
      orderBy: {
        name: "asc"
      }
    });

    return records;
  }

  async listCollections(): Promise<CatalogCollectionRecord[]> {
    const records = await this.prisma.collection.findMany({
      orderBy: {
        name: "asc"
      }
    });

    return records;
  }

  async findCollectionByIdOrSlug(
    value: string
  ): Promise<CatalogCollectionRecord | null> {
    const record = await this.prisma.collection.findFirst({
      where: isUuid(value)
        ? {
            OR: [
              {
                id: value
              },
              {
                slug: value
              }
            ]
          }
        : {
            slug: value
          }
    });

    return record;
  }

  async listCollectionItems(
    collectionId: string
  ): Promise<
    readonly {
      readonly position: number | null;
      readonly contentItem: CatalogContentItemRecord;
    }[]
  > {
    const records = await this.prisma.contentItemCollectionLink.findMany({
      include: {
        contentItem: {
          include: contentItemInclude
        }
      },
      orderBy: [
        {
          position: "asc"
        },
        {
          createdAt: "asc"
        }
      ],
      where: {
        collectionId
      }
    });

    return records.map((record) => ({
      contentItem: record.contentItem as unknown as CatalogContentItemRecord,
      position: record.position
    }));
  }

  /**
   * Una sola consulta para varias colecciones (evita N+1 en home preview).
   */
  async listCollectionItemsForCollections(
    collectionIds: readonly string[]
  ): Promise<
    Map<
      string,
      readonly {
        readonly position: number | null;
        readonly contentItem: CatalogContentItemRecord;
      }[]
    >
  > {
    const grouped = new Map<
      string,
      {
        linkCreatedAt: Date;
        position: number | null;
        contentItem: CatalogContentItemRecord;
      }[]
    >();

    if (collectionIds.length === 0) {
      return new Map();
    }

    const records = await this.prisma.contentItemCollectionLink.findMany({
      include: {
        contentItem: {
          include: contentItemInclude
        }
      },
      where: {
        collectionId: {
          in: [...collectionIds]
        }
      }
    });

    for (const record of records) {
      const collectionId = record.collectionId;
      const row = {
        contentItem: record.contentItem as unknown as CatalogContentItemRecord,
        linkCreatedAt: record.createdAt,
        position: record.position
      };
      const bucket = grouped.get(collectionId);

      if (bucket === undefined) {
        grouped.set(collectionId, [row]);
      } else {
        bucket.push(row);
      }
    }

    const sorted = new Map<
      string,
      readonly {
        readonly position: number | null;
        readonly contentItem: CatalogContentItemRecord;
      }[]
    >();

    for (const [collectionId, rows] of grouped) {
      const ordered = [...rows]
        .sort((a, b) => {
          const pa = a.position ?? Number.MAX_SAFE_INTEGER;
          const pb = b.position ?? Number.MAX_SAFE_INTEGER;

          if (pa !== pb) {
            return pa - pb;
          }

          return a.linkCreatedAt.getTime() - b.linkCreatedAt.getTime();
        })
        .map(({ contentItem, position }) => ({ contentItem, position }));

      sorted.set(collectionId, ordered);
    }

    return sorted;
  }

  async listProfiles(): Promise<CatalogProfileRecord[]> {
    const records = await this.prisma.profile.findMany({
      orderBy: {
        displayName: "asc"
      }
    });

    return records;
  }

  async findProfileById(id: string): Promise<CatalogProfileRecord | null> {
    if (!isUuid(id)) {
      return null;
    }

    const record = await this.prisma.profile.findUnique({
      where: {
        id
      }
    });

    return record;
  }

  async listWatchHistory(
    profileId: string
  ): Promise<CatalogWatchHistoryRecord[]> {
    const records = await this.prisma.watchHistory.findMany({
      include: watchHistoryInclude,
      orderBy: {
        lastWatchedAt: "desc"
      },
      where: {
        profileId
      }
    });

    return records as unknown as CatalogWatchHistoryRecord[];
  }

  async findWatchHistoryByProfileAndContentItem(
    profileId: string,
    contentItemId: string
  ): Promise<CatalogWatchHistoryRecord | null> {
    const record = await this.prisma.watchHistory.findUnique({
      include: watchHistoryInclude,
      where: {
        profileId_contentItemId: {
          contentItemId,
          profileId
        }
      }
    });

    return record as unknown as CatalogWatchHistoryRecord | null;
  }

  async upsertWatchHistory(
    profileId: string,
    input: UpsertWatchHistoryRequest
  ): Promise<CatalogWatchHistoryRecord> {
    const completedAt =
      input.completedAt === undefined || input.completedAt === null
        ? null
        : new Date(input.completedAt);

    const record = await this.prisma.watchHistory.upsert({
      create: {
        completedAt,
        contentItemId: input.contentItemId,
        lastWatchedAt: new Date(),
        ...(input.mediaAssetId === undefined
          ? {}
          : { mediaAssetId: input.mediaAssetId }),
        profileId,
        progressSeconds: input.progressSeconds
      },
      include: watchHistoryInclude,
      update: {
        completedAt,
        lastWatchedAt: new Date(),
        ...(input.mediaAssetId === undefined
          ? {}
          : { mediaAssetId: input.mediaAssetId }),
        progressSeconds: input.progressSeconds
      },
      where: {
        profileId_contentItemId: {
          contentItemId: input.contentItemId,
          profileId
        }
      }
    });

    return record as unknown as CatalogWatchHistoryRecord;
  }

  async linkMediaAsset(input: {
    readonly contentItemId: string;
    readonly mediaAssetId: string;
    readonly role: ContentItemMediaAssetRole;
  }): Promise<{
    readonly contentItemId: string;
    readonly mediaAssetId: string;
    readonly role: ContentItemMediaAssetRole;
  } | null> {
    const mediaAsset = await this.findMediaAssetById(input.mediaAssetId);

    if (mediaAsset === null) {
      return null;
    }

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      if (input.role === "primary") {
        await tx.contentItemMediaAssetLink.deleteMany({
          where: {
            contentItemId: input.contentItemId,
            role: "primary"
          }
        });

        const link = await tx.contentItemMediaAssetLink.create({
          data: {
            contentItemId: input.contentItemId,
            mediaAssetId: input.mediaAssetId,
            role: "primary"
          }
        });

        await tx.contentItem.update({
          data: {
            primaryMediaAssetId: input.mediaAssetId
          },
          where: {
            id: input.contentItemId
          }
        });

        return {
          contentItemId: link.contentItemId,
          mediaAssetId: link.mediaAssetId,
          role: link.role as ContentItemMediaAssetRole
        };
      }

      const link = await tx.contentItemMediaAssetLink.upsert({
        create: {
          contentItemId: input.contentItemId,
          mediaAssetId: input.mediaAssetId,
          role: input.role
        },
        update: {},
        where: {
          contentItemId_mediaAssetId_role: {
            contentItemId: input.contentItemId,
            mediaAssetId: input.mediaAssetId,
            role: input.role
          }
        }
      });

      return {
        contentItemId: link.contentItemId,
        mediaAssetId: link.mediaAssetId,
        role: link.role as ContentItemMediaAssetRole
      };
    });
  }

  async findMediaAssetById(id: string) {
    if (!isUuid(id)) {
      return null;
    }

    return this.prisma.mediaAsset.findUnique({
      where: {
        id
      }
    });
  }
}

import type { Prisma } from "../../../generated/prisma-family/client";
import type { UserRoleFamily } from "../../family/domain-shapes";
import type { ContentItemCatalogRowFamily } from "../../family/domain-shapes";
import { getFamilyPrisma } from "../db";
import { prismaWhereStorefrontVisibleContent } from "./content-storefront-visibility";

const catalogSelect = {
  id: true,
  slug: true,
  title: true,
  editorialStatus: true,
  visibility: true,
  type: true,
  thumbnailPath: true,
  posterPath: true,
  categoryId: true,
  updatedAt: true
} satisfies Prisma.ContentItemSelect;

type CatalogRowRaw = Prisma.ContentItemGetPayload<{ select: typeof catalogSelect }>;

function toCatalogRow(row: CatalogRowRaw): ContentItemCatalogRowFamily {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    editorialStatus: row.editorialStatus as ContentItemCatalogRowFamily["editorialStatus"],
    visibility: row.visibility as ContentItemCatalogRowFamily["visibility"],
    type: row.type as ContentItemCatalogRowFamily["type"],
    thumbnailPath: row.thumbnailPath,
    posterPath: row.posterPath,
    categoryId: row.categoryId,
    updatedAt: row.updatedAt.toISOString()
  };
}

/**
 * Catálogo visible para un perfil: reglas centralizadas en `prismaWhereStorefrontVisibleContent`
 * (estado editorial + `releaseScope` + `ProfileContentAccess`).
 */
export async function listPublishedCatalogForProfile(
  profileId: string,
  viewerRole: UserRoleFamily
): Promise<readonly ContentItemCatalogRowFamily[]> {
  const prisma = getFamilyPrisma();
  const rows = await prisma.contentItem.findMany({
    where: {
      AND: [prismaWhereStorefrontVisibleContent(profileId, viewerRole)]
    },
    orderBy: { updatedAt: "desc" },
    select: catalogSelect
  });
  return rows.map(toCatalogRow);
}

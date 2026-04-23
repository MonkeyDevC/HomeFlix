import type { Prisma } from "../../../generated/prisma-family/client";
import { getFamilyPrisma } from "../db";
import {
  EDITORIAL_STATUS_PUBLISHED,
  type ContentItemCatalogRowFamily
} from "../../family/domain-shapes";

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
 * Catálogo visible para un perfil: **publicado** y con fila en `ProfileContentAccess`.
 * Sin fila de acceso → no aparece (no hay fallback “ver todo”).
 */
export async function listPublishedCatalogForProfile(
  profileId: string
): Promise<readonly ContentItemCatalogRowFamily[]> {
  const prisma = getFamilyPrisma();
  const rows = await prisma.contentItem.findMany({
    where: {
      editorialStatus: EDITORIAL_STATUS_PUBLISHED,
      accessGrants: { some: { profileId } }
    },
    orderBy: { updatedAt: "desc" },
    select: catalogSelect
  });
  return rows.map(toCatalogRow);
}

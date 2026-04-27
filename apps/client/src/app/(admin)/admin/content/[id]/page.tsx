import { notFound } from "next/navigation";
import type { AdminProfileOptionDto } from "../../../../../lib/family/admin-contracts";
import { AdminPageHeader } from "../../../../../components/admin/admin-page-header";
import { AdminSectionCard } from "../../../../../components/admin/admin-section-card";
import type { ContentItemFormInitial } from "../../../../../components/admin/content-item-form";
import { ContentItemForm } from "../../../../../components/admin/content-item-form";
import { IntegratedMediaSection } from "../../../../../components/admin/integrated-media-section";
import { ProfileAccessEditor } from "../../../../../components/admin/profile-access-editor";
import { ReleaseScopeBadge, StatusBadge, VisibilityBadge } from "../../../../../components/admin/status-badges";
import { buildAdminContentMediaSummaryDto } from "../../../../../lib/server/admin/admin-content-media-summary";
import { getFamilyPrisma } from "../../../../../lib/server/db";

export default async function AdminContentEditPage({
  params
}: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  const prisma = getFamilyPrisma();

  const item = await prisma.contentItem.findUnique({ where: { id } });
  if (item === null) {
    notFound();
  }

  const [categories, collections, profiles, links, grants, initialMedia] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.collection.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.profile.findMany({
      orderBy: { displayName: "asc" },
      select: {
        id: true,
        displayName: true,
        userId: true,
        user: { select: { email: true } }
      }
    }),
    prisma.contentItemCollectionLink.findMany({
      where: { contentItemId: id },
      orderBy: { position: "asc" },
      select: { collectionId: true, position: true }
    }),
    prisma.profileContentAccess.findMany({
      where: { contentItemId: id },
      select: { profileId: true }
    }),
    buildAdminContentMediaSummaryDto(id)
  ]);

  const initial: ContentItemFormInitial = {
    categoryId: item.categoryId ?? "",
    editorialStatus: item.editorialStatus,
    releaseScope: item.releaseScope === "admin_only" ? "admin_only" : "public_catalog",
    posterPath: item.posterPath ?? "",
    slug: item.slug,
    synopsis: item.synopsis ?? "",
    thumbnailPath: item.thumbnailPath ?? "",
    title: item.title,
    type: item.type,
    visibility: item.visibility,
    releaseYear: item.releaseYear === null ? "" : String(item.releaseYear),
    maturityRating: item.maturityRating ?? "",
    seasonNumber: item.seasonNumber === null ? "" : String(item.seasonNumber),
    episodeNumber: item.episodeNumber === null ? "" : String(item.episodeNumber)
  };

  const initialCollectionIds = links.map((l) => l.collectionId);
  const initialGalleryLinkPosition =
    item.type === "photo_gallery" && links.length === 1 ? String(links[0]!.position) : undefined;

  const profileOptions: AdminProfileOptionDto[] = profiles.map((p) => ({
    displayName: p.displayName,
    id: p.id,
    userId: p.userId,
    userEmail: p.user.email
  }));

  const initialProfileIds = grants.map((g) => g.profileId);

  if (initialMedia === null) {
    notFound();
  }

  return (
    <div>
      <AdminPageHeader
        description={`Slug interno · ${item.slug}`}
        title={item.title}
        actions={
          <div className="hf-admin-page-head-badges">
            <StatusBadge status={item.editorialStatus} />
            <ReleaseScopeBadge releaseScope={item.releaseScope} />
            <VisibilityBadge visibility={item.visibility} />
          </div>
        }
      />

      <div className="hf-admin-col-stack">
        <AdminSectionCard
          eyebrow="Ficha editorial"
          title="Datos del contenido"
          description="Título, sinopsis y dónde aparece en el storefront."
        >
          <ContentItemForm
            categories={categories}
            collections={collections}
            contentId={item.id}
            initial={initial}
            initialCollectionIds={initialCollectionIds}
            {...(initialGalleryLinkPosition !== undefined
              ? { initialGalleryLinkPosition }
              : {})}
            mode="edit"
          />
        </AdminSectionCard>

        <IntegratedMediaSection
          contentItemId={item.id}
          contentType={item.type}
          initial={initialMedia}
        />

        <AdminSectionCard
          eyebrow="Acceso por perfil"
          title="Perfiles con acceso"
          description="Sin perfiles marcados, el contenido publicado no aparece en el catálogo de ningún perfil."
        >
          <ProfileAccessEditor
            contentItemId={item.id}
            initialProfileIds={initialProfileIds}
            profiles={profileOptions}
          />
        </AdminSectionCard>
      </div>
    </div>
  );
}

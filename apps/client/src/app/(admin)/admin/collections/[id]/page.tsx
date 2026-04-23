import { notFound } from "next/navigation";
import { AdminPageHeader } from "../../../../../components/admin/admin-page-header";
import { AdminSectionCard } from "../../../../../components/admin/admin-section-card";
import { CollectionContentSection } from "../../../../../components/admin/collection-content-section";
import { CollectionForm } from "../../../../../components/admin/collection-form";
import { getFamilyPrisma } from "../../../../../lib/server/db";

export default async function AdminCollectionEditPage({
  params
}: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  const prisma = getFamilyPrisma();

  const row = await prisma.collection.findUnique({ where: { id } });
  if (row === null) {
    notFound();
  }

  const links = await prisma.contentItemCollectionLink.findMany({
    where: { collectionId: id },
    orderBy: { position: "asc" },
    include: {
      contentItem: {
        select: { id: true, title: true, slug: true, type: true, editorialStatus: true }
      }
    }
  });

  const linkedItems = links.map((l) => ({
    id: l.contentItem.id,
    title: l.contentItem.title,
    slug: l.contentItem.slug,
    type: l.contentItem.type,
    editorialStatus: l.contentItem.editorialStatus,
    position: l.position
  }));

  return (
    <div>
      <AdminPageHeader description={`Serie · slug ${row.slug}`} title={row.name} />

      <div className="hf-admin-col-stack">
        <AdminSectionCard eyebrow="Serie" title="Datos de la serie">
          <CollectionForm
            collectionId={row.id}
            initial={{
              description: row.description ?? "",
              name: row.name,
              slug: row.slug
            }}
            mode="edit"
          />
        </AdminSectionCard>

        <CollectionContentSection collectionId={row.id} items={linkedItems} />
      </div>
    </div>
  );
}

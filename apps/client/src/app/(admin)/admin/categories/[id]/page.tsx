import { notFound } from "next/navigation";
import { AdminPageHeader } from "../../../../../components/admin/admin-page-header";
import { AdminSectionCard } from "../../../../../components/admin/admin-section-card";
import { CategoryForm } from "../../../../../components/admin/category-form";
import { getFamilyPrisma } from "../../../../../lib/server/db";

export default async function AdminCategoryEditPage({
  params
}: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  const prisma = getFamilyPrisma();
  const row = await prisma.category.findUnique({ where: { id } });

  if (row === null) {
    notFound();
  }

  return (
    <div>
      <AdminPageHeader description={`Editando carrusel · slug ${row.slug}`} title={row.name} />
      <AdminSectionCard eyebrow="Carrusel" title="Datos del carrusel">
        <CategoryForm
          categoryId={row.id}
          initial={{ name: row.name, slug: row.slug }}
          mode="edit"
        />
      </AdminSectionCard>
    </div>
  );
}

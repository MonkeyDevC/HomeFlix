import { notFound } from "next/navigation";
import { AdminPageHeader } from "../../../../../components/admin/admin-page-header";
import { AdminSectionCard } from "../../../../../components/admin/admin-section-card";
import { AdminUserForm } from "../../../../../components/admin/admin-user-form";
import { getFamilyPrisma } from "../../../../../lib/server/db";

export default async function AdminUserEditPage({
  params
}: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  const prisma = getFamilyPrisma();
  const row = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, role: true }
  });

  if (row === null) {
    notFound();
  }

  return (
    <div>
      <AdminPageHeader description={`ID ${row.id}`} title={row.email} />
      <AdminSectionCard eyebrow="Usuario" title="Correo, contraseña y rol">
        <AdminUserForm initial={{ email: row.email, role: row.role }} mode="edit" userId={row.id} />
      </AdminSectionCard>
    </div>
  );
}

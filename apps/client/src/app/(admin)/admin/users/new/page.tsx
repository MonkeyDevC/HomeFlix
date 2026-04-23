import { AdminPageHeader } from "../../../../../components/admin/admin-page-header";
import { AdminSectionCard } from "../../../../../components/admin/admin-section-card";
import { AdminUserForm } from "../../../../../components/admin/admin-user-form";

export default function AdminUserNewPage() {
  return (
    <div>
      <AdminPageHeader
        description="El correo debe ser único. La contraseña se almacena de forma segura (hash)."
        title="Nuevo usuario"
      />
      <AdminSectionCard eyebrow="Credenciales" title="Alta de cuenta">
        <AdminUserForm mode="create" />
      </AdminSectionCard>
    </div>
  );
}

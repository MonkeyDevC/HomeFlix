import { AdminPageHeader } from "../../../../../components/admin/admin-page-header";
import { AdminSectionCard } from "../../../../../components/admin/admin-section-card";
import { CategoryForm } from "../../../../../components/admin/category-form";

export default function AdminCategoryNewPage() {
  return (
    <div>
      <AdminPageHeader
        description="Los carruseles son las filas horizontales del home. Dale un nombre claro y listo."
        title="Nuevo carrusel"
      />
      <AdminSectionCard eyebrow="Carrusel del home" title="Datos del carrusel">
        <CategoryForm mode="create" />
      </AdminSectionCard>
    </div>
  );
}

import { AdminPageHeader } from "../../../../../components/admin/admin-page-header";
import { AdminSectionCard } from "../../../../../components/admin/admin-section-card";
import { CollectionForm } from "../../../../../components/admin/collection-form";

export default function AdminCollectionNewPage() {
  return (
    <div>
      <AdminPageHeader
        description="Una serie agrupa varios episodios relacionados. Crea la serie y luego añade episodios desde su ficha."
        title="Nueva serie"
      />
      <AdminSectionCard eyebrow="Serie" title="Datos de la serie">
        <CollectionForm mode="create" />
      </AdminSectionCard>
    </div>
  );
}

import Link from "next/link";
import { AdminDeleteButton } from "../../../../components/admin/admin-delete-button";
import { AdminEmptyState } from "../../../../components/admin/admin-empty-state";
import { AdminErrorState } from "../../../../components/admin/admin-error-state";
import { AdminInfoHint } from "../../../../components/admin/admin-info-hint";
import { IconPencil } from "../../../../components/admin/admin-nav-icons";
import { AdminPageHeader } from "../../../../components/admin/admin-page-header";
import { AdminTable, AdminTd, AdminTh } from "../../../../components/admin/admin-table";
import { getFamilyPrisma } from "../../../../lib/server/db";

export default async function AdminCategoriesPage() {
  let rows: { id: string; slug: string; name: string }[] = [];
  let dbError: string | null = null;

  try {
    const prisma = getFamilyPrisma();
    rows = await prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, slug: true, name: true }
    });
  } catch (e) {
    dbError = e instanceof Error ? e.message : "db_error";
  }

  return (
    <div>
      <AdminPageHeader
        actions={
          <Link className="hf-admin-primary-action" href="/admin/categories/new">
            Nuevo carrusel
          </Link>
        }
        description="Cada carrusel se muestra como una fila horizontal del home familiar."
        title="Categorías / Carruseles"
      />

      <AdminInfoHint>
        Usa nombres claros y familiares: así es como los perfiles verán estas filas en el home.
      </AdminInfoHint>

      {dbError !== null ? (
        <AdminErrorState message={dbError} title="No se pudo cargar" />
      ) : rows.length === 0 ? (
        <AdminEmptyState
          message="Crea el primer carrusel para empezar a organizar el catálogo familiar."
          title="Aún no hay carruseles"
        />
      ) : (
        <AdminTable>
          <thead>
            <tr>
              <AdminTh>Nombre</AdminTh>
              <AdminTh>Slug interno</AdminTh>
              <AdminTh style={{ width: "220px" }}>Acciones</AdminTh>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <AdminTd>
                  <strong>{r.name}</strong>
                </AdminTd>
                <AdminTd>
                  <code>{r.slug}</code>
                </AdminTd>
                <AdminTd>
                  <div className="hf-admin-table-actions">
                    <Link
                      className="hf-admin-row-action hf-admin-row-action--edit"
                      href={`/admin/categories/${r.id}`}
                      title="Editar esta categoría"
                    >
                      <IconPencil />
                      <span>Editar</span>
                    </Link>
                    <AdminDeleteButton apiPath={`/api/family/admin/categories/${r.id}`} />
                  </div>
                </AdminTd>
              </tr>
            ))}
          </tbody>
        </AdminTable>
      )}
    </div>
  );
}

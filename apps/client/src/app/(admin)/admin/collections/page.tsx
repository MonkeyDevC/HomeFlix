import Link from "next/link";
import { AdminDeleteButton } from "../../../../components/admin/admin-delete-button";
import { AdminEmptyState } from "../../../../components/admin/admin-empty-state";
import { AdminErrorState } from "../../../../components/admin/admin-error-state";
import { AdminInfoHint } from "../../../../components/admin/admin-info-hint";
import { IconPencil } from "../../../../components/admin/admin-nav-icons";
import { AdminPageHeader } from "../../../../components/admin/admin-page-header";
import { AdminTable, AdminTd, AdminTh } from "../../../../components/admin/admin-table";
import { getFamilyPrisma } from "../../../../lib/server/db";

export default async function AdminCollectionsPage() {
  let rows: { id: string; slug: string; name: string; episodes: number }[] = [];
  let dbError: string | null = null;

  try {
    const prisma = getFamilyPrisma();
    const raw = await prisma.collection.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        slug: true,
        name: true,
        _count: { select: { contentItemLinks: true } }
      }
    });
    rows = raw.map((r) => ({
      id: r.id,
      slug: r.slug,
      name: r.name,
      episodes: r._count.contentItemLinks
    }));
  } catch (e) {
    dbError = e instanceof Error ? e.message : "db_error";
  }

  return (
    <div>
      <AdminPageHeader
        actions={
          <Link className="hf-admin-primary-action" href="/admin/collections/new">
            Nueva serie
          </Link>
        }
        description="Agrupa episodios o piezas relacionadas. Las series luego pueden alimentar un carrusel."
        title="Series / Colecciones"
      />

      <AdminInfoHint>
        Una serie te sirve para agrupar episodios de una misma idea (por ejemplo, “Verano 2026”).
      </AdminInfoHint>

      {dbError !== null ? (
        <AdminErrorState message={dbError} title="No se pudo cargar" />
      ) : rows.length === 0 ? (
        <AdminEmptyState
          message="Crea la primera serie para agrupar episodios o piezas relacionadas."
          title="Aún no hay series"
        />
      ) : (
        <AdminTable>
          <thead>
            <tr>
              <AdminTh>Serie</AdminTh>
              <AdminTh>Slug interno</AdminTh>
              <AdminTh>Episodios</AdminTh>
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
                <AdminTd>{r.episodes}</AdminTd>
                <AdminTd>
                  <div className="hf-admin-table-actions">
                    <Link
                      className="hf-admin-row-action hf-admin-row-action--edit"
                      href={`/admin/collections/${r.id}`}
                      title="Editar esta colección"
                    >
                      <IconPencil />
                      <span>Editar</span>
                    </Link>
                    <AdminDeleteButton apiPath={`/api/family/admin/collections/${r.id}`} />
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

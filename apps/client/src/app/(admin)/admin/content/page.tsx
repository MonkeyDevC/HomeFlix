import Link from "next/link";
import { AdminDeleteButton } from "../../../../components/admin/admin-delete-button";
import { AdminEmptyState } from "../../../../components/admin/admin-empty-state";
import { AdminErrorState } from "../../../../components/admin/admin-error-state";
import { AdminInfoHint } from "../../../../components/admin/admin-info-hint";
import { IconPencil } from "../../../../components/admin/admin-nav-icons";
import { AdminPageHeader } from "../../../../components/admin/admin-page-header";
import { AdminTable, AdminTd, AdminTh } from "../../../../components/admin/admin-table";
import { StatusBadge, VisibilityBadge } from "../../../../components/admin/status-badges";
import { getFamilyPrisma } from "../../../../lib/server/db";

function kindLabel(type: string): string {
  if (type === "movie") return "Película";
  if (type === "episode") return "Episodio";
  if (type === "clip") return "Clip";
  return type;
}

export default async function AdminContentListPage() {
  type Row = {
    id: string;
    slug: string;
    title: string;
    editorialStatus: string;
    visibility: string;
    type: string;
    accessCount: number;
  };

  let rows: Row[] = [];
  let dbError: string | null = null;

  try {
    const prisma = getFamilyPrisma();
    const raw = await prisma.contentItem.findMany({
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        slug: true,
        title: true,
        editorialStatus: true,
        visibility: true,
        type: true,
        _count: { select: { accessGrants: true } }
      }
    });
    rows = raw.map((r) => ({
      accessCount: r._count.accessGrants,
      editorialStatus: r.editorialStatus,
      id: r.id,
      slug: r.slug,
      title: r.title,
      type: r.type,
      visibility: r.visibility
    }));
  } catch (e) {
    dbError = e instanceof Error ? e.message : "db_error";
  }

  return (
    <div>
      <AdminPageHeader
        actions={
          <div className="hf-admin-page-head-actions">
            <Link className="hf-admin-secondary-action" href="/admin/content/new?kind=episode">
              Nuevo episodio
            </Link>
            <Link className="hf-admin-primary-action" href="/admin/content/new?kind=movie">
              Nueva película
            </Link>
          </div>
        }
        description="Ficha editorial de películas y episodios. El catálogo visible para cada perfil depende de sus accesos."
        title="Contenido"
      />

      <AdminInfoHint>
        Crea películas sueltas o episodios dentro de una serie. Solo los publicados aparecen en el catálogo, y siempre limitados a los perfiles con acceso.
      </AdminInfoHint>

      {dbError !== null ? (
        <AdminErrorState message={dbError} title="No se pudo cargar" />
      ) : rows.length === 0 ? (
        <AdminEmptyState
          message="Crea la primera pieza: una película suelta o un episodio dentro de una serie."
          title="Aún no hay contenido"
        />
      ) : (
        <AdminTable>
          <thead>
            <tr>
              <AdminTh>Título</AdminTh>
              <AdminTh>Tipo</AdminTh>
              <AdminTh>Estado</AdminTh>
              <AdminTh>Alcance</AdminTh>
              <AdminTh>Perfiles</AdminTh>
              <AdminTh style={{ width: "220px" }}>Acciones</AdminTh>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <AdminTd>
                  <div className="hf-admin-table-title">{r.title}</div>
                  <div className="hf-admin-table-meta">
                    <code>{r.slug}</code>
                  </div>
                </AdminTd>
                <AdminTd>{kindLabel(r.type)}</AdminTd>
                <AdminTd>
                  <StatusBadge status={r.editorialStatus} />
                </AdminTd>
                <AdminTd>
                  <VisibilityBadge visibility={r.visibility} />
                </AdminTd>
                <AdminTd>{r.accessCount}</AdminTd>
                <AdminTd>
                  <div className="hf-admin-table-actions">
                    <Link
                      className="hf-admin-row-action hf-admin-row-action--edit"
                      href={`/admin/content/${r.id}`}
                      title="Editar este contenido"
                    >
                      <IconPencil />
                      <span>Editar</span>
                    </Link>
                    <AdminDeleteButton
                      apiPath={`/api/family/admin/content/${r.id}`}
                      confirmMessage="¿Eliminar este contenido y sus enlaces?"
                    />
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

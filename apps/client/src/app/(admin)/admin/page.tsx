import Link from "next/link";
import { AdminErrorState } from "../../../components/admin/admin-error-state";
import { AdminPageHeader } from "../../../components/admin/admin-page-header";
import {
  IconFilm,
  IconGrid,
  IconPencil,
  IconPlus,
  IconSeries,
  IconUsers
} from "../../../components/admin/admin-nav-icons";
import { StatusBadge } from "../../../components/admin/status-badges";
import { getFamilyPrisma } from "../../../lib/server/db";

type RecentContent = Readonly<{
  id: string;
  title: string;
  slug: string;
  type: string;
  editorialStatus: string;
  updatedAt: string;
}>;

function kindLabel(type: string): string {
  if (type === "movie") return "Película";
  if (type === "episode") return "Episodio";
  if (type === "clip") return "Clip";
  return type;
}

export default async function AdminHomePage() {
  let categoryCount = 0;
  let collectionCount = 0;
  let contentCount = 0;
  let profileCount = 0;
  let publishedCount = 0;
  let draftCount = 0;
  let recent: RecentContent[] = [];
  let dbError: string | null = null;

  try {
    const prisma = getFamilyPrisma();
    const [c, col, ci, p, pub, dra, rec] = await Promise.all([
      prisma.category.count(),
      prisma.collection.count(),
      prisma.contentItem.count(),
      prisma.profile.count(),
      prisma.contentItem.count({ where: { editorialStatus: "published" } }),
      prisma.contentItem.count({ where: { editorialStatus: "draft" } }),
      prisma.contentItem.findMany({
        orderBy: { updatedAt: "desc" },
        take: 6,
        select: {
          id: true,
          title: true,
          slug: true,
          type: true,
          editorialStatus: true,
          updatedAt: true
        }
      })
    ]);
    categoryCount = c;
    collectionCount = col;
    contentCount = ci;
    profileCount = p;
    publishedCount = pub;
    draftCount = dra;
    recent = rec.map((r) => ({
      id: r.id,
      title: r.title,
      slug: r.slug,
      type: r.type,
      editorialStatus: r.editorialStatus,
      updatedAt: r.updatedAt.toISOString()
    }));
  } catch (e) {
    dbError = e instanceof Error ? e.message : "db_error";
  }

  return (
    <div>
      <AdminPageHeader
        description="Resumen editorial del catálogo Family V1. Crea carruseles, series y contenido desde los atajos."
        title="Resumen"
      />

      {dbError !== null ? (
        <AdminErrorState
          message={`No se pudo leer la base: ${dbError}. Comprueba DATABASE_URL y migraciones (pnpm db:family:deploy).`}
          title="Error de base de datos"
        />
      ) : (
        <>
          <section className="hf-admin-stat-grid" aria-label="Indicadores del catálogo">
            <Link href="/admin/categories" className="hf-admin-stat-card" data-tone="blue">
              <div className="hf-admin-stat-label">
                <IconGrid width={14} height={14} /> Carruseles
              </div>
              <div className="hf-admin-stat-value">{categoryCount}</div>
              <div className="hf-admin-stat-foot">Categorías visibles en el home</div>
              <span className="hf-admin-stat-chip" aria-hidden="true">
                <IconGrid />
              </span>
            </Link>

            <Link href="/admin/collections" className="hf-admin-stat-card" data-tone="purple">
              <div className="hf-admin-stat-label">
                <IconSeries width={14} height={14} /> Series
              </div>
              <div className="hf-admin-stat-value">{collectionCount}</div>
              <div className="hf-admin-stat-foot">Agrupaciones y temporadas</div>
              <span className="hf-admin-stat-chip" aria-hidden="true">
                <IconSeries />
              </span>
            </Link>

            <Link href="/admin/content" className="hf-admin-stat-card" data-tone="red">
              <div className="hf-admin-stat-label">
                <IconFilm width={14} height={14} /> Contenido
              </div>
              <div className="hf-admin-stat-value">{contentCount}</div>
              <div className="hf-admin-stat-foot">
                {publishedCount} publicado{publishedCount === 1 ? "" : "s"} · {draftCount} en
                borrador
              </div>
              <span className="hf-admin-stat-chip" aria-hidden="true">
                <IconFilm />
              </span>
            </Link>

            <div className="hf-admin-stat-card" data-tone="amber">
              <div className="hf-admin-stat-label">
                <IconUsers width={14} height={14} /> Perfiles familiares
              </div>
              <div className="hf-admin-stat-value">{profileCount}</div>
              <div className="hf-admin-stat-foot">Solo lectura desde este panel</div>
              <span className="hf-admin-stat-chip" aria-hidden="true">
                <IconUsers />
              </span>
            </div>
          </section>

          <div className="hf-admin-grid-12">
            <div className="hf-admin-col-stack">
              <section className="hf-admin-panel">
                <header className="hf-admin-form-card-header">
                  <div>
                    <p className="hf-admin-panel-kicker">Atajos</p>
                    <h2 className="hf-admin-panel-title">Crear rápido</h2>
                    <p className="hf-admin-panel-copy">
                      Arranca un carrusel del home, una serie familiar o una película en dos clics.
                    </p>
                  </div>
                </header>
                <div className="hf-admin-quick-grid">
                  <Link
                    className="hf-admin-quick-card"
                    href="/admin/content/new?kind=movie"
                  >
                    <div className="hf-admin-quick-title">
                      <IconPlus width={16} height={16} /> Nueva película
                    </div>
                    <p className="hf-admin-quick-copy">
                      Pieza suelta del catálogo. Escoge el carrusel donde aparece y los perfiles
                      con acceso.
                    </p>
                  </Link>
                  <Link className="hf-admin-quick-card" href="/admin/collections/new">
                    <div className="hf-admin-quick-title">
                      <IconPlus width={16} height={16} /> Nueva serie
                    </div>
                    <p className="hf-admin-quick-copy">
                      Agrupa episodios dentro de una serie. Luego puedes añadir episodios desde
                      su ficha.
                    </p>
                  </Link>
                  <Link className="hf-admin-quick-card" href="/admin/categories/new">
                    <div className="hf-admin-quick-title">
                      <IconPlus width={16} height={16} /> Nuevo carrusel
                    </div>
                    <p className="hf-admin-quick-copy">
                      Las categorías se muestran como carruseles en el home del storefront.
                    </p>
                  </Link>
                </div>
              </section>

              <section className="hf-admin-panel">
                <header className="hf-admin-form-card-header">
                  <div>
                    <p className="hf-admin-panel-kicker">Actividad reciente</p>
                    <h2 className="hf-admin-panel-title">Últimos cambios de contenido</h2>
                    <p className="hf-admin-panel-copy">Ordenado por fecha de edición.</p>
                  </div>
                  <Link href="/admin/content" className="hf-admin-secondary-action">
                    Ver todo
                  </Link>
                </header>

                {recent.length === 0 ? (
                  <p className="hf-admin-empty-copy">
                    Todavía no hay contenido. Crea tu primera película o serie desde los atajos.
                  </p>
                ) : (
                  <ul className="hf-admin-activity-list">
                    {recent.map((r) => (
                      <li key={r.id}>
                        <div>
                          <div className="hf-admin-activity-title-row">
                            <Link
                              href={`/admin/content/${r.id}`}
                              className="hf-admin-activity-link"
                            >
                              {r.title}
                            </Link>
                            <StatusBadge status={r.editorialStatus} />
                          </div>
                          <p className="hf-admin-activity-meta">
                            <span>{kindLabel(r.type)}</span>
                            <code>{r.slug}</code>
                            <span>Actualizado {new Date(r.updatedAt).toLocaleString()}</span>
                          </p>
                        </div>
                        <Link
                          href={`/admin/content/${r.id}`}
                          className="hf-admin-row-action hf-admin-row-action--edit"
                          title="Editar este contenido"
                        >
                          <IconPencil />
                          <span>Editar</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>

            <aside className="hf-admin-col-stack">
              <section className="hf-admin-panel">
                <header className="hf-admin-form-card-header">
                  <div>
                    <p className="hf-admin-panel-kicker">Modelo editorial</p>
                    <h2 className="hf-admin-panel-title">Cómo se organiza HomeFlix</h2>
                  </div>
                </header>
                <ul className="hf-admin-bullet-list">
                  <li>
                    <strong>Categoría</strong> = carrusel visible del home.
                  </li>
                  <li>
                    <strong>Serie</strong> = agrupación editorial de episodios.
                  </li>
                  <li>
                    <strong>Contenido</strong> = pieza reproducible (película, episodio o clip).
                  </li>
                  <li>El slug se genera solo desde el título. Puedes sobreescribirlo si lo necesitas.</li>
                </ul>
              </section>

              <section className="hf-admin-panel">
                <header className="hf-admin-form-card-header">
                  <div>
                    <p className="hf-admin-panel-kicker">Diagnóstico</p>
                    <h2 className="hf-admin-panel-title">Estado del sistema</h2>
                  </div>
                </header>
                <p className="hf-admin-panel-copy" style={{ margin: 0 }}>
                  Sin perfiles marcados en <code>ProfileContentAccess</code>, un contenido
                  publicado no aparece en el catálogo. Verifica la visibilidad por perfil en
                  cada ficha.
                </p>
                <p style={{ marginTop: "0.9rem", marginBottom: 0 }}>
                  <Link href="/api/family/db-health" className="hf-admin-text-button">
                    GET /api/family/db-health →
                  </Link>
                </p>
              </section>
            </aside>
          </div>
        </>
      )}
    </div>
  );
}

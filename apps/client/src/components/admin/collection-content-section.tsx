import Link from "next/link";
import { StatusBadge } from "./status-badges";

type CollectionContentItem = Readonly<{
  id: string;
  title: string;
  slug: string;
  type: string;
  editorialStatus: string;
  position: number;
}>;

export function CollectionContentSection({
  collectionId,
  items
}: Readonly<{
  collectionId: string;
  items: readonly CollectionContentItem[];
}>) {
  return (
    <section className="hf-admin-panel hf-admin-form-card">
      <header className="hf-admin-form-card-header">
        <div>
          <p className="hf-admin-panel-kicker">Serie o agrupacion</p>
          <h2 className="hf-admin-panel-title">Contenido vinculado</h2>
          <p className="hf-admin-panel-copy">
            Usa esta seccion para revisar episodios existentes o arrancar uno nuevo dentro de la serie.
          </p>
        </div>
        <Link
          className="hf-admin-primary-action"
          href={`/admin/content/new?kind=episode&collectionId=${collectionId}`}
        >
          Agregar episodio
        </Link>
      </header>

      {items.length === 0 ? (
        <p className="hf-admin-empty-copy">
          Aun no hay contenido dentro de esta serie. Puedes crear el primer episodio desde aqui.
        </p>
      ) : (
        <ul className="hf-admin-linked-list">
          {items.map((item) => (
            <li className="hf-admin-linked-item" key={item.id}>
              <div>
                <div className="hf-admin-linked-item-title-row">
                  <Link className="hf-admin-activity-link" href={`/admin/content/${item.id}`}>
                    {item.title}
                  </Link>
                  <StatusBadge status={item.editorialStatus} />
                </div>
                <p className="hf-admin-linked-item-meta">
                  <span>{item.type}</span>
                  <code>{item.slug}</code>
                  <span>Posicion {item.position}</span>
                </p>
              </div>
              <Link className="hf-admin-secondary-action" href={`/admin/content/${item.id}`}>
                Editar
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

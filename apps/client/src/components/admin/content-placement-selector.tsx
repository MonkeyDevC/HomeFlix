"use client";

export function ContentPlacementSelector({
  type,
  categoryId,
  onCategoryChange,
  categories,
  selectedCollectionIds,
  onToggleCollection,
  collections
}: Readonly<{
  type: string;
  categoryId: string;
  onCategoryChange: (value: string) => void;
  categories: ReadonlyArray<{ id: string; name: string }>;
  selectedCollectionIds: readonly string[];
  onToggleCollection: (id: string) => void;
  collections: ReadonlyArray<{ id: string; name: string }>;
}>) {
  return (
    <div className="hf-admin-placement-grid">
      <div className="hf-admin-field">
        <label className="hf-admin-field-label" htmlFor="content-category">
          Carrusel del home
        </label>
        <select
          className="hf-admin-input"
          id="content-category"
          onChange={(event) => onCategoryChange(event.target.value)}
          value={categoryId}
        >
          <option value="">Sin carrusel principal</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <p className="hf-admin-field-hint">
          Las categorias se entienden como carruseles visibles del storefront.
        </p>
      </div>

      <div className="hf-admin-field">
        <div className="hf-admin-field-label">
          {type === "episode" ? "Serie o agrupacion (obligatoria para episodios)" : "Serie o agrupacion"}
        </div>
        {collections.length === 0 ? (
          <p className="hf-admin-field-hint">Aun no hay series creadas.</p>
        ) : (
          <div className="hf-admin-chip-grid">
            {collections.map((collection) => {
              const checked = selectedCollectionIds.includes(collection.id);

              return (
                <label className={`hf-admin-chip${checked ? " is-active" : ""}`} key={collection.id}>
                  <input
                    checked={checked}
                    onChange={() => onToggleCollection(collection.id)}
                    type="checkbox"
                  />
                  <span>{collection.name}</span>
                </label>
              );
            })}
          </div>
        )}
        <p className="hf-admin-field-hint">
          Una pelicula puede quedar suelta. Un episodio debe pertenecer al menos a una serie o agrupacion.
        </p>
      </div>
    </div>
  );
}

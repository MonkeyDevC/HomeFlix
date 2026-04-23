export function FamilyEmptySearchState({
  query
}: Readonly<{ query: string }>) {
  return (
    <div className="sf-empty" role="status">
      <h3 className="sf-empty-title">Sin resultados</h3>
      <p className="sf-empty-desc">
        No hay títulos visibles para esta búsqueda en el perfil activo: <strong>{query}</strong>.
      </p>
    </div>
  );
}


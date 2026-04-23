export function FamilyEmptyCatalogState({
  profileName
}: Readonly<{ profileName: string }>) {
  return (
    <div className="sf-empty" role="status">
      <h3 className="sf-empty-title">Sin contenido para este perfil</h3>
      <p className="sf-empty-desc">
        El perfil <strong>{profileName}</strong> no tiene títulos publicados con acceso asignado.
      </p>
    </div>
  );
}


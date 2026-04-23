export function ReleaseScopeHint({
  variant
}: Readonly<{ variant: "admin_only" | "public_catalog" }>) {
  if (variant === "admin_only") {
    return (
      <p className="hf-admin-field-hint">
        Solo cuentas administradoras con un perfil autorizado verán este título en el hogar, búsqueda y ficha. Ideal
        para revisar video y metadatos antes de exponerlo a la familia.
      </p>
    );
  }
  return (
    <p className="hf-admin-field-hint">
      Cuando el estado sea &quot;Publicado&quot; y existan perfiles con acceso, el contenido puede aparecer en el
      catálogo familiar (home, búsqueda, continuar viendo).
    </p>
  );
}

export function CategoryReleaseScopeHint({
  variant
}: Readonly<{ variant: "admin_only" | "public_catalog" }>) {
  if (variant === "admin_only") {
    return (
      <p className="hf-admin-field-hint">
        Usa solo administradores para preparar un carrusel interno antes de hacerlo público.
      </p>
    );
  }
  return (
    <p className="hf-admin-field-hint">
      Visible en catálogo familiar hace que esta categoría pueda aparecer para cuentas no administradoras (con
      contenido publicado y accesible para el perfil).
    </p>
  );
}

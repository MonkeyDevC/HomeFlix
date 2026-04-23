"use client";

export function CategoryReleaseScopeOptionCards({
  value,
  onChange
}: Readonly<{
  value: "admin_only" | "public_catalog";
  onChange: (next: "admin_only" | "public_catalog") => void;
}>) {
  return (
    <div className="hf-admin-release-scope-cards" role="radiogroup" aria-label="Alcance del carrusel">
      <button
        type="button"
        className={`hf-admin-release-scope-card${value === "admin_only" ? " is-active" : ""}`}
        onClick={() => onChange("admin_only")}
        aria-checked={value === "admin_only"}
        role="radio"
      >
        <span className="hf-admin-release-scope-card-title">Solo administradores</span>
        <span className="hf-admin-release-scope-card-desc">Carrusel interno; no aparece en el home familiar.</span>
      </button>
      <button
        type="button"
        className={`hf-admin-release-scope-card${value === "public_catalog" ? " is-active" : ""}`}
        onClick={() => onChange("public_catalog")}
        aria-checked={value === "public_catalog"}
        role="radio"
      >
        <span className="hf-admin-release-scope-card-title">Visible en catálogo familiar</span>
        <span className="hf-admin-release-scope-card-desc">
          El carrusel puede mostrarse en el home cuando tenga ítems visibles para el perfil.
        </span>
      </button>
    </div>
  );
}

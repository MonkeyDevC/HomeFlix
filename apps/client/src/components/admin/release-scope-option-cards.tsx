"use client";

export function ReleaseScopeOptionCards({
  value,
  onChange
}: Readonly<{
  value: "admin_only" | "public_catalog";
  onChange: (next: "admin_only" | "public_catalog") => void;
}>) {
  return (
    <div className="hf-admin-release-scope-cards" role="radiogroup" aria-label="Alcance en el catálogo">
      <button
        type="button"
        className={`hf-admin-release-scope-card${value === "admin_only" ? " is-active" : ""}`}
        onClick={() => onChange("admin_only")}
        aria-checked={value === "admin_only"}
        role="radio"
      >
        <span className="hf-admin-release-scope-card-title">Vista previa solo administradores</span>
        <span className="hf-admin-release-scope-card-desc">
          No aparece para perfiles espectador; úsalo para QA interno.
        </span>
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
          Podrá mostrarse a perfiles autorizados cuando esté publicado.
        </span>
      </button>
    </div>
  );
}

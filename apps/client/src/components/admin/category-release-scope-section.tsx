"use client";

import { CategoryReleaseScopeHint } from "./category-release-scope-hint";
import { CategoryReleaseScopeOptionCards } from "./category-release-scope-option-cards";

export function CategoryReleaseScopeSection({
  value,
  onChange
}: Readonly<{
  value: "admin_only" | "public_catalog";
  onChange: (next: "admin_only" | "public_catalog") => void;
}>) {
  return (
    <div className="hf-admin-field">
      <span className="hf-admin-field-label">Disponibilidad del carrusel</span>
      <CategoryReleaseScopeOptionCards onChange={onChange} value={value} />
      <CategoryReleaseScopeHint variant={value} />
    </div>
  );
}

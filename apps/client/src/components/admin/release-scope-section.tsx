"use client";

import { ReleaseScopeHint } from "./release-scope-hint";
import { ReleaseScopeOptionCards } from "./release-scope-option-cards";

export function ReleaseScopeSection({
  value,
  onChange
}: Readonly<{
  value: "admin_only" | "public_catalog";
  onChange: (next: "admin_only" | "public_catalog") => void;
}>) {
  return (
    <div className="hf-admin-field">
      <span className="hf-admin-field-label">Disponibilidad en el hogar</span>
      <ReleaseScopeOptionCards onChange={onChange} value={value} />
      <ReleaseScopeHint variant={value} />
    </div>
  );
}

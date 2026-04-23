export function FamilyLoadingState({ label = "Cargando…" }: Readonly<{ label?: string }>) {
  return (
    <output aria-live="polite" style={{ color: "var(--hf-muted, #94a3b8)", fontSize: "0.9rem" }}>
      {label}
    </output>
  );
}

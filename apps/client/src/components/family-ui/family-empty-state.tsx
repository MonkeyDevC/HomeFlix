export function FamilyEmptyState({ message, title }: Readonly<{ title: string; message: string }>) {
  return (
    <div
      role="status"
      style={{
        border: "1px dashed var(--hf-border, rgba(148,163,184,0.35))",
        borderRadius: "10px",
        padding: "1.25rem 1rem",
        textAlign: "center"
      }}
    >
      <p style={{ fontWeight: 600, margin: "0 0 0.35rem" }}>{title}</p>
      <p style={{ color: "var(--hf-muted, #94a3b8)", fontSize: "0.9rem", margin: 0 }}>{message}</p>
    </div>
  );
}

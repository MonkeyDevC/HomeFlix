export function FamilyErrorState({ message, title }: Readonly<{ title: string; message: string }>) {
  return (
    <div
      role="alert"
      style={{
        background: "rgba(239,68,68,0.08)",
        border: "1px solid rgba(248,113,113,0.35)",
        borderRadius: "10px",
        padding: "1.25rem 1rem"
      }}
    >
      <p style={{ fontWeight: 700, margin: "0 0 0.35rem" }}>{title}</p>
      <p style={{ fontSize: "0.9rem", margin: 0 }}>{message}</p>
    </div>
  );
}

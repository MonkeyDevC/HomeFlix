export function FamilyPageHeader({
  description,
  title
}: Readonly<{
  title: string;
  description?: string;
}>) {
  return (
    <header style={{ marginBottom: "1.25rem" }}>
      <h1 style={{ fontSize: "1.35rem", fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 0.35rem" }}>
        {title}
      </h1>
      {description !== undefined ? (
        <p style={{ color: "var(--hf-muted, #94a3b8)", fontSize: "0.9rem", lineHeight: 1.5, margin: 0 }}>
          {description}
        </p>
      ) : null}
    </header>
  );
}

"use client";

export function ActiveProfileBadge({
  displayName,
  loading
}: Readonly<{
  displayName: string | null;
  loading: boolean;
}>) {
  if (loading) {
    return (
      <span className="sf-nav-link sf-nav-link-quiet" style={{ opacity: 0.7 }}>
        Perfil…
      </span>
    );
  }

  if (displayName === null) {
    return null;
  }

  return (
    <span
      className="sf-nav-link sf-nav-link-quiet"
      style={{ fontWeight: 500 }}
      title="Perfil activo Family"
    >
      {displayName}
    </span>
  );
}

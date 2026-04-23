import type { CSSProperties } from "react";

const base: CSSProperties = {
  alignItems: "center",
  borderRadius: "999px",
  display: "inline-flex",
  fontFamily: "inherit",
  fontSize: "0.7rem",
  fontWeight: 700,
  gap: "6px",
  letterSpacing: "0.06em",
  lineHeight: 1,
  padding: "4px 10px",
  textTransform: "uppercase",
  whiteSpace: "nowrap"
};

const dot: CSSProperties = {
  width: 6,
  height: 6,
  borderRadius: "50%",
  flexShrink: 0
};

const editorialTheme: Record<string, { bg: string; fg: string; dot: string; label: string }> = {
  draft: {
    bg: "rgba(148,163,184,0.16)",
    fg: "#e2e8f0",
    dot: "#94a3b8",
    label: "Borrador"
  },
  published: {
    bg: "rgba(34,197,94,0.14)",
    fg: "#86efac",
    dot: "#22c55e",
    label: "Publicado"
  },
  archived: {
    bg: "rgba(239,68,68,0.14)",
    fg: "#fecaca",
    dot: "#ef4444",
    label: "Archivado"
  }
};

const visibilityTheme: Record<string, { bg: string; fg: string; dot: string; label: string }> = {
  private: {
    bg: "rgba(59,130,246,0.14)",
    fg: "#bfdbfe",
    dot: "#3b82f6",
    label: "Privado"
  },
  household: {
    bg: "rgba(168,85,247,0.14)",
    fg: "#e9d5ff",
    dot: "#a855f7",
    label: "Hogar"
  },
  public_internal: {
    bg: "rgba(234,179,8,0.14)",
    fg: "#fde68a",
    dot: "#eab308",
    label: "Interno"
  }
};

export function StatusBadge({ status }: Readonly<{ status: string }>) {
  const t = editorialTheme[status] ?? {
    bg: "rgba(148,163,184,0.16)",
    fg: "#e2e8f0",
    dot: "#94a3b8",
    label: status
  };
  return (
    <span
      style={{ ...base, background: t.bg, color: t.fg }}
      title={`Estado editorial: ${t.label}`}
    >
      <span style={{ ...dot, background: t.dot }} aria-hidden="true" />
      {t.label}
    </span>
  );
}

export function VisibilityBadge({ visibility }: Readonly<{ visibility: string }>) {
  const t = visibilityTheme[visibility] ?? {
    bg: "rgba(148,163,184,0.16)",
    fg: "#e2e8f0",
    dot: "#94a3b8",
    label: visibility
  };
  return (
    <span
      style={{ ...base, background: t.bg, color: t.fg }}
      title={`Visibilidad: ${t.label}`}
    >
      <span style={{ ...dot, background: t.dot }} aria-hidden="true" />
      {t.label}
    </span>
  );
}

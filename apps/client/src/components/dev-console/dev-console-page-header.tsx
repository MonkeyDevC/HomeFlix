import type { ReactNode } from "react";

export function DevConsolePageHeader({
  title,
  description,
  actions
}: Readonly<{
  title: string;
  description?: string;
  actions?: ReactNode;
}>) {
  return (
    <header className="hdc-page-header">
      <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1 className="hdc-page-title">{title}</h1>
          {description !== undefined ? <p className="hdc-page-desc">{description}</p> : null}
        </div>
        {actions !== undefined ? <div>{actions}</div> : null}
      </div>
    </header>
  );
}

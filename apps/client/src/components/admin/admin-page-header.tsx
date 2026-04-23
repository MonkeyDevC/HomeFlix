import type { ReactNode } from "react";

export function AdminPageHeader({
  title,
  description,
  actions
}: Readonly<{
  title: string;
  description?: string;
  actions?: ReactNode;
}>) {
  return (
    <header className="hf-admin-page-head">
      <div>
        <h1>{title}</h1>
        {description !== undefined ? <p>{description}</p> : null}
      </div>
      {actions !== undefined ? <div className="hf-admin-page-head-actions">{actions}</div> : null}
    </header>
  );
}

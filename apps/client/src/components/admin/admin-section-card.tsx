import type { ReactNode } from "react";

export function AdminSectionCard({
  title,
  description,
  children,
  eyebrow,
  actions
}: Readonly<{
  title: string;
  description?: string;
  children: ReactNode;
  eyebrow?: string;
  actions?: ReactNode;
}>) {
  return (
    <section className="hf-admin-panel hf-admin-form-card">
      <header className="hf-admin-form-card-header">
        <div>
          {eyebrow !== undefined ? <p className="hf-admin-panel-kicker">{eyebrow}</p> : null}
          <h2 className="hf-admin-panel-title">{title}</h2>
          {description !== undefined ? <p className="hf-admin-panel-copy">{description}</p> : null}
        </div>
        {actions !== undefined ? <div className="hf-admin-form-card-actions">{actions}</div> : null}
      </header>
      {children}
    </section>
  );
}

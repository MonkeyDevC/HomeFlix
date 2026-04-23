import type { ReactNode } from "react";

export function HomeSection({
  eyebrow,
  title,
  description,
  actions,
  children
}: Readonly<{
  eyebrow?: string | undefined;
  title: string;
  description?: string | undefined;
  actions?: ReactNode | undefined;
  children: ReactNode;
}>) {
  return (
    <section className="sf-home-section" aria-label={title}>
      <div className="sf-home-section-head">
        <div className="sf-home-section-copy">
          {eyebrow ? <p className="sf-home-section-eyebrow">{eyebrow}</p> : null}
          <h2 className="sf-home-section-title">{title}</h2>
          {description ? <p className="sf-home-section-description">{description}</p> : null}
        </div>
        {actions ? <div className="sf-home-section-actions">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}

import type { ReactNode } from "react";

export function FamilySectionLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <section
      style={{
        margin: "0 auto",
        maxWidth: "960px",
        padding: "1.5rem 1rem 2.5rem",
        width: "100%"
      }}
    >
      {children}
    </section>
  );
}

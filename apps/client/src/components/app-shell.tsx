type AppShellProps = Readonly<{
  children: React.ReactNode;
  /** Texto pequeño sobre el título (p. ej. fase o módulo). */
  eyebrow?: string;
  /** Título principal de la página de herramientas. */
  title?: string;
  /** Párrafo introductorio bajo el título. */
  intro?: string;
}>;

export function AppShell({
  children,
  eyebrow = "Herramientas de desarrollo",
  title = "Diagnóstico de API y catálogo",
  intro = "Superficies para validar salud de la API, lecturas de catálogo, historial de visionado y subida de medios. Todo queda acotado a este cliente; no sustituye monitoreo de producción."
}: AppShellProps) {
  return (
    <main className="app-shell">
      <header className="app-header">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="app-shell-title">{title}</h1>
        <p className="intro">{intro}</p>
      </header>
      {children}
    </main>
  );
}

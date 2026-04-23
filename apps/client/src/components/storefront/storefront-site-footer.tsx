"use client";

type FooterCol = Readonly<{
  title: string;
  items: readonly Readonly<{ label: string; href?: string }>[];
}>;

const FOOTER_COLUMNS: readonly FooterCol[] = [
  {
    title: "Audio y subtítulos",
    items: [
      { label: "Centro de medios" },
      { label: "Preferencias de audio" },
      { label: "Subtítulos" }
    ]
  },
  {
    title: "Centro de ayuda",
    items: [{ label: "Preguntas frecuentes" }, { label: "Privacidad" }, { label: "Avisos legales" }]
  },
  {
    title: "Cuenta",
    items: [{ label: "Perfiles", href: "/profiles" }, { label: "Buscar", href: "/search" }]
  },
  {
    title: "HomeFlix",
    items: [{ label: "Family V1" }, { label: "Catálogo local" }]
  }
] as const;

export function StorefrontSiteFooter() {
  return (
    <footer className="sf-site-footer">
      <div className="sf-site-footer-grid">
        {FOOTER_COLUMNS.map((col) => (
          <div className="sf-site-footer-col" key={col.title}>
            <p className="sf-site-footer-col-title">{col.title}</p>
            <ul className="sf-site-footer-list">
              {col.items.map((item) => (
                <li key={item.label}>
                  {item.href !== undefined ? (
                    <a className="sf-site-footer-link" href={item.href}>
                      {item.label}
                    </a>
                  ) : (
                    <span className="sf-site-footer-faux">{item.label}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="sf-site-footer-bottom">
        <button className="sf-site-footer-service" disabled type="button">
          Código de servicio
        </button>
        <p className="sf-site-footer-copy">© {new Date().getFullYear()} HomeFlix · Family V1</p>
      </div>
    </footer>
  );
}

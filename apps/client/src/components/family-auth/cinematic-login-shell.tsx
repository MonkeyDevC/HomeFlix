import Link from "next/link";
import type { ReactNode } from "react";

export function CinematicLoginShell({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <div className="hf-login-page">
      <header className="hf-login-header">
        <Link className="hf-login-logo" href="/">
          HOMEFLIX
        </Link>
      </header>

      <main className="hf-login-main">
        <div aria-hidden="true" className="hf-login-mosaic" />
        <div aria-hidden="true" className="hf-login-scrim" />
        <div className="hf-login-card-wrap">{children}</div>
      </main>

      <footer className="hf-login-footer">
        <div className="hf-login-footer-inner">
          <p className="hf-login-footer-lead" id="ayuda">
            ¿Preguntas? Consulta la documentación del proyecto o contacta al administrador de tu instancia.
          </p>
          <div className="hf-login-footer-grid">
            <span className="hf-login-footer-faux">Preguntas frecuentes</span>
            <span className="hf-login-footer-faux">Centro de ayuda</span>
            <span className="hf-login-footer-faux">Términos de uso</span>
            <span className="hf-login-footer-faux">Privacidad</span>
            <span className="hf-login-footer-faux">Preferencias de cookies</span>
            <span className="hf-login-footer-faux">Información corporativa</span>
          </div>
          <div className="hf-login-footer-bottom">
            <label className="hf-login-lang">
              <span aria-hidden="true" className="hf-login-lang-icon">
                <svg fill="none" height="16" viewBox="0 0 24 24" width="16">
                  <path
                    d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M2 12h20M12 2a15.3 15.3 0 0 0 4 10 15.3 15.3 0 0 0-4 10 15.3 15.3 0 0 0-4-10 15.3 15.3 0 0 0 4-10Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
              </span>
              <select aria-label="Idioma (solo visual)" className="hf-login-lang-select" defaultValue="es">
                <option value="es">Español</option>
                <option value="en">English</option>
              </select>
            </label>
            <p className="hf-login-footer-copy">© {new Date().getFullYear()} HomeFlix · Family V1</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

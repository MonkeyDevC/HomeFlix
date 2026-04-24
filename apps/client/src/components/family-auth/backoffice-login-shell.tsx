import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Shell visual del login de backoffice (tarjeta partida, hero neón).
 * El login familiar mantiene {@link CinematicLoginShell}.
 */
export function BackofficeLoginShell({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <div className="hf-bo-page">
      <div className="hf-bo-card">
        <header className="hf-bo-top">
          <Link className="hf-bo-brand" href="/">
            <span aria-hidden className="hf-bo-brand-mark">
              <svg fill="none" height="28" viewBox="0 0 32 32" width="28">
                <path
                  d="M8 16c0-4 3-8 8-8s8 4 8 8-3 8-8 8"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="1.6"
                />
                <path
                  d="M24 16c0 4-3 8-8 8s-8-4-8-8 3-8 8-8"
                  opacity="0.85"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="1.6"
                />
              </svg>
            </span>
            <span className="hf-bo-brand-text">HOMEFLIX</span>
          </Link>

          <nav aria-label="Enlaces rápidos" className="hf-bo-nav">
            <Link href="/">HOME</Link>
            <Link href="/auth/login?next=%2F">DOWNLOAD</Link>
            <a href="#acerca-backoffice">ABOUT</a>
          </nav>

          <Link className="hf-bo-nav-register" href="/auth/login?next=%2F">
            REGISTER
          </Link>
        </header>

        <div className="hf-bo-split">
          <div className="hf-bo-left">{children}</div>

          <div className="hf-bo-right" id="acerca-backoffice">
            <div aria-hidden className="hf-bo-right-bg">
              <span className="hf-bo-blob hf-bo-blob--1" />
              <span className="hf-bo-blob hf-bo-blob--2" />
              <span className="hf-bo-blob hf-bo-blob--3" />
              <span className="hf-bo-blob hf-bo-blob--4" />
            </div>
            <div aria-hidden className="hf-bo-right-veil" />
            <div className="hf-bo-hero-copy">
              <span className="hf-bo-hero-line">Welcome</span>
              <span className="hf-bo-hero-line hf-bo-hero-line--accent">Back.</span>
              <p className="hf-bo-hero-hint">
                Panel interno · gestión de contenido y cuentas. El acceso familiar sigue en la ruta
                pública de login.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

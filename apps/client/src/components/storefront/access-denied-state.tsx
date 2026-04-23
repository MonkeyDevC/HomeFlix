import Link from "next/link";

export function AccessDeniedState({
  message
}: Readonly<{ message: string }>) {
  return (
    <section className="sf-page sf-page--splash" aria-live="polite">
      <div className="sf-player-fallback" role="alert">
        <h1 className="sf-player-fallback-title">Acceso no disponible</h1>
        <p>{message}</p>
        <p style={{ marginTop: "0.75rem" }}>
          <Link href="/">Volver al catálogo</Link>
        </p>
      </div>
    </section>
  );
}


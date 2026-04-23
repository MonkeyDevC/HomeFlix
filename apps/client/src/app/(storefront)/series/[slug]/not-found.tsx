import Link from "next/link";

export default function SeriesNotFound() {
  return (
    <div className="sf-notfound">
      <h1 className="sf-page-title">Serie no disponible</h1>
      <p className="sf-muted">
        Esta serie no existe o no tiene episodios publicados y accesibles para
        el perfil activo.
      </p>
      <p>
        <Link href="/">Volver al inicio</Link>
      </p>
    </div>
  );
}

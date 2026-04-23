import Link from "next/link";

export default function ContentNotFound() {
  return (
    <div className="sf-notfound">
      <h1 className="sf-page-title">Contenido no encontrado</h1>
      <p className="sf-muted">
        Ese contenido no existe, no está publicado o no está habilitado para el
        perfil activo.
      </p>
      <p>
        <Link href="/">Volver al inicio</Link>
      </p>
    </div>
  );
}

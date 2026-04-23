"use client";

/**
 * Legado V2 (Mux direct upload) retirado del cliente Family V1.
 * La subida de archivos locales se implementará en FASE 2.
 */
export function MediaUploadSurface() {
  return (
    <section className="upload-panel" aria-label="Subida de medios (no disponible)">
      <p className="eyebrow">Family V1</p>
      <h2>Subida desactivada</h2>
      <p>
        El flujo de subida directa a Mux ya no forma parte del cliente. En FASE 2 se
        añadirá la subida a disco gestionada por el monolito.
      </p>
    </section>
  );
}

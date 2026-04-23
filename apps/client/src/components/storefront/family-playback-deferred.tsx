"use client";

/**
 * Sustituye al reproductor Mux retirado en Family V1.
 * FASE 3+: reproductor de archivos locales (`MediaAsset.filePath` en Prisma).
 */
export function FamilyPlaybackDeferred({
  detail,
  title
}: Readonly<{
  title?: string;
  detail?: string;
}>) {
  return (
    <div className="sf-player-fallback" role="status">
      <h2 className="sf-player-fallback-title">
        {title ?? "Reproducción local (Family V1)"}
      </h2>
      <p>
        {detail ??
          "Mux fue retirado del cliente. La reproducción desde disco y la integración con el catálogo Prisma llegan en FASE 2."}
      </p>
    </div>
  );
}

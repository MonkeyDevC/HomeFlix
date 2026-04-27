"use client";

import { useState } from "react";
import type { AdminContentMediaSummaryDto } from "../../lib/family/admin-contracts";
import { AdminInfoHint } from "./admin-info-hint";
import { AdminSectionCard } from "./admin-section-card";
import { MediaAssetSummaryCard } from "./media-asset-summary-card";
import { PhotoGalleryManager } from "./photo-gallery-manager";
import { PosterUploadField } from "./poster-upload-field";
import { ThumbnailUploadField } from "./thumbnail-upload-field";
import { VideoUploadField } from "./video-upload-field";

export function IntegratedMediaSection({
  contentItemId,
  contentType,
  initial
}: Readonly<{
  contentItemId: string;
  contentType: string;
  initial: AdminContentMediaSummaryDto;
}>) {
  const [media, setMedia] = useState(initial);

  if (contentType === "photo_gallery") {
    return (
      <AdminSectionCard
        description="Subí varias imágenes; se guardan en disco local bajo storage/photos y se sirven con acceso controlado."
        eyebrow="Galería de fotos"
        title="Fotos del contenido"
      >
        <AdminInfoHint>
          Podés dejar la galería en borrador sin fotos. Para publicarla, al menos una imagen. Podés fijar portada
          explícita o usar poster/thumbnail opcionales para las tarjetas del catálogo.
        </AdminInfoHint>
        <PhotoGalleryManager
          contentItemId={contentItemId}
          initial={media}
          onSummaryChange={setMedia}
        />
        <p className="hf-admin-field-label" style={{ marginTop: "1.25rem" }}>
          Poster y thumbnail opcionales (catálogo)
        </p>
        <div className="hf-admin-upload-grid">
          <PosterUploadField contentItemId={contentItemId} onSuccess={setMedia} />
          <ThumbnailUploadField contentItemId={contentItemId} onSuccess={setMedia} />
        </div>
      </AdminSectionCard>
    );
  }

  return (
    <AdminSectionCard
      description="Poster, thumbnail y video viven dentro del mismo flujo de contenido. Todo sigue guardandose en disco local."
      eyebrow="Media local"
      title="Archivos del contenido"
    >
      <AdminInfoHint>
        Si estas creando una pelicula o un episodio, aqui mismo puedes completar poster, thumbnail y video sin salir de la ficha.
      </AdminInfoHint>
      <MediaAssetSummaryCard media={media} />
      <div className="hf-admin-upload-grid">
        <VideoUploadField contentItemId={contentItemId} onSuccess={setMedia} />
        <PosterUploadField contentItemId={contentItemId} onSuccess={setMedia} />
        <ThumbnailUploadField contentItemId={contentItemId} onSuccess={setMedia} />
      </div>
    </AdminSectionCard>
  );
}

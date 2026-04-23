"use client";

import { useState } from "react";
import type { AdminContentMediaSummaryDto } from "../../lib/family/admin-contracts";
import { AdminInfoHint } from "./admin-info-hint";
import { AdminSectionCard } from "./admin-section-card";
import { MediaAssetSummaryCard } from "./media-asset-summary-card";
import { PosterUploadField } from "./poster-upload-field";
import { ThumbnailUploadField } from "./thumbnail-upload-field";
import { VideoUploadField } from "./video-upload-field";

export function IntegratedMediaSection({
  contentItemId,
  initial
}: Readonly<{
  contentItemId: string;
  initial: AdminContentMediaSummaryDto;
}>) {
  const [media, setMedia] = useState(initial);

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

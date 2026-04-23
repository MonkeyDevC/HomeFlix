"use client";

import type { AdminContentMediaSummaryDto } from "../../lib/family/admin-contracts";
import { UploadFieldBase } from "./upload-field-base";

export function VideoUploadField({
  contentItemId,
  onSuccess
}: Readonly<{
  contentItemId: string;
  onSuccess: (next: AdminContentMediaSummaryDto) => void;
}>) {
  return (
    <UploadFieldBase
      accepted="video/mp4,.mp4"
      endpoint={`/api/family/admin/content/${contentItemId}/media/video`}
      hint="MP4 hasta 300 MiB. El servidor convierte a H.264 automáticamente si el códec no es compatible con navegadores."
      label="Video local"
      onSuccess={onSuccess}
    />
  );
}

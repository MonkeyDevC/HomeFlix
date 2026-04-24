"use client";

import type { AdminContentMediaSummaryDto } from "../../lib/family/admin-contracts";
import { FAMILY_VIDEO_FILE_ACCEPT, FAMILY_VIDEO_FORMAT_LABEL } from "../../lib/family/allowed-video-upload";
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
      accepted={FAMILY_VIDEO_FILE_ACCEPT}
      detailedUploadProgress
      endpoint={`/api/family/admin/content/${contentItemId}/media/video`}
      hint={`${FAMILY_VIDEO_FORMAT_LABEL} · máx. 5 GiB. El servidor puede convertir a H.264 si el códec no es compatible con navegadores.`}
      label="Video local"
      onSuccess={onSuccess}
    />
  );
}

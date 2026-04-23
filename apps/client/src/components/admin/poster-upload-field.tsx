"use client";

import type { AdminContentMediaSummaryDto } from "../../lib/family/admin-contracts";
import { UploadFieldBase } from "./upload-field-base";

export function PosterUploadField({
  contentItemId,
  onSuccess
}: Readonly<{
  contentItemId: string;
  onSuccess: (next: AdminContentMediaSummaryDto) => void;
}>) {
  return (
    <UploadFieldBase
      accepted="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
      endpoint={`/api/family/admin/content/${contentItemId}/media/poster`}
      hint="JPG, PNG o WEBP hasta 10 MiB."
      label="Poster"
      onSuccess={onSuccess}
    />
  );
}


import type { AdminContentMediaSummaryDto } from "../../lib/family/admin-contracts";
import { FileUploadStatusCard } from "./file-upload-status-card";

export function MediaAssetSummaryCard({
  media
}: Readonly<{ media: AdminContentMediaSummaryDto }>) {
  return (
    <section className="hf-admin-media-summary-grid">
      <FileUploadStatusCard
        title="Video local"
        pathValue={media.videoAsset?.filePath ?? null}
        mimeType={media.videoAsset?.mimeType ?? null}
        sizeBytes={media.videoAsset?.sizeBytes ?? null}
        status={media.videoAsset?.status ?? null}
        width={media.videoAsset?.width ?? null}
        height={media.videoAsset?.height ?? null}
        frameRate={media.videoAsset?.frameRate ?? null}
        durationSeconds={media.videoAsset?.durationSeconds ?? null}
      />
      <FileUploadStatusCard title="Poster" pathValue={media.posterPath} />
      <FileUploadStatusCard title="Thumbnail" pathValue={media.thumbnailPath} />
    </section>
  );
}


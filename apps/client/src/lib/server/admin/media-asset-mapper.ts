import type { AdminMediaAssetDto } from "../../family/admin-contracts";

type MediaAssetRow = Readonly<{
  id: string;
  contentItemId: string | null;
  filePath: string;
  mimeType: string | null;
  sizeBytes: bigint | null;
  width: number | null;
  height: number | null;
  frameRate: number | null;
  durationSeconds: number | null;
  codec: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}>;

export function mapMediaAssetToDto(row: MediaAssetRow): AdminMediaAssetDto {
  return {
    id: row.id,
    contentItemId: row.contentItemId,
    filePath: row.filePath,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes?.toString() ?? null,
    width: row.width,
    height: row.height,
    frameRate: row.frameRate,
    durationSeconds: row.durationSeconds,
    codec: row.codec,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

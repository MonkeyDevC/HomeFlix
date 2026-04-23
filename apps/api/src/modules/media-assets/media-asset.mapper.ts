import type { MediaAssetStatus, PlaybackPolicy } from "@homeflix/domain";
import type { MediaAssetSummary } from "@homeflix/contracts";

export interface MediaAssetRecord {
  readonly id: string;
  readonly provider: string;
  readonly providerAssetId: string | null;
  readonly providerUploadId: string | null;
  readonly providerPlaybackId: string | null;
  readonly playbackId: string | null;
  readonly legacyPipelineContentItemId: string | null;
  readonly status: string;
  readonly playbackPolicy: string;
  readonly sourceFilename: string | null;
  readonly mimeType: string | null;
  readonly durationSeconds: number | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly readyAt: Date | null;
  readonly failedAt: Date | null;
  readonly failureReason: string | null;
  readonly lastWebhookEventId: string | null;
  readonly rawWebhookLastEventAt: Date | null;
  readonly rawWebhookLastEventType: string | null;
}

export function toMediaAssetSummary(record: MediaAssetRecord): MediaAssetSummary {
  return {
    legacyPipelineContentItemId: record.legacyPipelineContentItemId,
    createdAt: record.createdAt.toISOString(),
    durationSeconds: record.durationSeconds,
    failedAt: record.failedAt?.toISOString() ?? null,
    failureReason: record.failureReason,
    id: record.id,
    mimeType: record.mimeType,
    playbackPolicy: record.playbackPolicy as PlaybackPolicy,
    playbackId: record.playbackId,
    provider: "mux",
    providerAssetId: record.providerAssetId,
    providerPlaybackId: record.providerPlaybackId,
    providerUploadId: record.providerUploadId,
    rawWebhookLastEventAt: record.rawWebhookLastEventAt?.toISOString() ?? null,
    rawWebhookLastEventType: record.rawWebhookLastEventType,
    lastWebhookEventId: record.lastWebhookEventId,
    readyAt: record.readyAt?.toISOString() ?? null,
    sourceFilename: record.sourceFilename,
    status: record.status as MediaAssetStatus,
    updatedAt: record.updatedAt.toISOString()
  };
}

import type { MediaAssetStatus, PlaybackPolicy } from "@homeflix/domain";
import type { ApiResponse } from "./api-response.js";

export type MediaAssetProvider = "mux";

export type MediaWebhookEventType = "asset.ready" | "asset.failed";

export type MuxWebhookEventType =
  | "video.upload.asset_created"
  | "video.upload.errored"
  | "video.asset.ready"
  | "video.asset.errored";

export type MediaPipelineErrorCode =
  | "asset_not_found"
  | "invalid_config"
  | "invalid_webhook_signature"
  | "unsupported_event"
  | "upload_creation_failed"
  | "validation_error";

/**
 * Wire contracts use string ids. Domain services should validate and narrow
 * them to ContentItemId and MediaAssetId at the application boundary.
 *
 * `contentItemId` is an optional **pipeline hint** stored on the technical asset
 * as `legacyPipelineContentItemId`. It does **not** create or replace the
 * authoritative catalog association; use `POST .../media-assets/:id/link` for that.
 */
export interface CreateUploadRequest {
  readonly contentItemId: string;
  readonly mimeType?: string;
  readonly sourceFilename?: string;
}

export interface CreateUploadResponse {
  readonly uploadUrl: string;
  readonly mediaAssetId: string;
  readonly provider: MediaAssetProvider;
  readonly providerUploadId: string;
  readonly status: MediaAssetStatus;
}

export interface MediaWebhookEvent {
  readonly type: MediaWebhookEventType;
  readonly mediaAssetId: string;
}

export interface MediaWebhookAckPayload {
  readonly accepted: true;
  readonly applied: boolean;
  readonly eventType: string;
  readonly idempotentReplay?: boolean;
  readonly webhookEventId?: string;
  readonly mediaAssetId?: string;
  readonly transition?: MediaAssetStatus;
  readonly reason?: string;
}

export type MediaWebhookAckResponse = ApiResponse<MediaWebhookAckPayload>;

export interface MediaAssetSummary {
  readonly id: string;
  readonly provider: MediaAssetProvider;
  readonly providerAssetId: string | null;
  readonly providerPlaybackId: string | null;
  readonly playbackId: string | null;
  readonly providerUploadId: string | null;
  /**
   * Optional upload-time hint from the Phase 2 pipeline (`media_assets.content_item_id`).
   * Not authoritative for catalog membership; see `ContentItemMediaAssetLink`.
   */
  readonly legacyPipelineContentItemId: string | null;
  readonly status: MediaAssetStatus;
  readonly playbackPolicy: PlaybackPolicy;
  readonly sourceFilename: string | null;
  readonly mimeType: string | null;
  readonly durationSeconds: number | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly readyAt: string | null;
  readonly failedAt: string | null;
  readonly failureReason: string | null;
  readonly lastWebhookEventId: string | null;
  readonly rawWebhookLastEventType: string | null;
  readonly rawWebhookLastEventAt: string | null;
}

export type CreateUploadApiResponse = ApiResponse<CreateUploadResponse>;

export type MediaAssetSummaryResponse = ApiResponse<MediaAssetSummary>;

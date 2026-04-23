import type { MediaAssetStatus } from "@homeflix/domain";
import { ApiError } from "../../errors/api-error.js";
import {
  getFailureReason,
  getFirstPlaybackId,
  getNumber,
  getString,
  getWebhookDate,
  type MuxWebhookPayload
} from "./mux-webhook-event.js";

export type DomainMediaWebhookEvent =
  | {
      readonly kind: "asset-created";
      readonly eventAt: Date;
      readonly eventType: string;
      readonly providerAssetId: string;
      readonly providerUploadId: string;
      readonly transition: Extract<MediaAssetStatus, "processing">;
      readonly webhookEventId: string;
    }
  | {
      readonly kind: "asset-ready";
      readonly durationSeconds?: number;
      readonly eventAt: Date;
      readonly eventType: string;
      readonly mediaAssetId?: string;
      readonly playbackId?: string;
      readonly providerAssetId: string;
      readonly providerUploadId?: string;
      readonly transition: Extract<MediaAssetStatus, "ready">;
      readonly webhookEventId: string;
    }
  | {
      readonly kind: "asset-failed";
      readonly eventAt: Date;
      readonly eventType: string;
      readonly failureReason: string;
      readonly mediaAssetId?: string;
      readonly providerAssetId?: string;
      readonly providerUploadId?: string;
      readonly transition: Extract<MediaAssetStatus, "failed">;
      readonly webhookEventId: string;
    }
  | {
      readonly kind: "unsupported";
      readonly eventAt: Date;
      readonly eventType: string;
      readonly reason: string;
      readonly webhookEventId: string;
    };

export function mapMuxEventToDomain(
  event: MuxWebhookPayload
): DomainMediaWebhookEvent {
  if (event.type === undefined) {
    throw new ApiError(400, "validation_error", "Mux webhook payload is missing type.");
  }

  if (event.id === undefined) {
    throw new ApiError(400, "validation_error", "Mux webhook payload is missing id.");
  }

  const data = event.data ?? {};
  const eventAt = getWebhookDate(event);

  if (event.type === "video.upload.asset_created") {
    const providerUploadId = getString(data.id);
    const providerAssetId = getString(data.asset_id);

    if (providerUploadId === undefined || providerAssetId === undefined) {
      throw new ApiError(
        400,
        "validation_error",
        "Mux upload asset_created event is missing upload id or asset id."
      );
    }

    return {
      eventAt,
      eventType: event.type,
      kind: "asset-created",
      providerAssetId,
      providerUploadId,
      transition: "processing",
      webhookEventId: event.id
    };
  }

  if (event.type === "video.asset.ready") {
    const providerAssetId = getString(data.id);

    if (providerAssetId === undefined) {
      throw new ApiError(
        400,
        "validation_error",
        "Mux asset ready event is missing asset id."
      );
    }

    const durationSeconds = getNumber(data.duration);
    const mediaAssetId = getString(data.passthrough);
    const playbackId = getFirstPlaybackId(data);
    const providerUploadId = getString(data.upload_id);

    return {
      eventAt,
      eventType: event.type,
      kind: "asset-ready",
      providerAssetId,
      transition: "ready",
      webhookEventId: event.id,
      ...(durationSeconds === undefined ? {} : { durationSeconds }),
      ...(mediaAssetId === undefined ? {} : { mediaAssetId }),
      ...(playbackId === undefined ? {} : { playbackId }),
      ...(providerUploadId === undefined ? {} : { providerUploadId })
    };
  }

  if (event.type === "video.asset.errored" || event.type === "video.upload.errored") {
    const mediaAssetId = getString(data.passthrough);
    const providerAssetId = getString(data.id);
    const providerUploadId =
      event.type === "video.upload.errored"
        ? getString(data.id)
        : getString(data.upload_id);

    return {
      eventAt,
      eventType: event.type,
      failureReason: getFailureReason(data),
      kind: "asset-failed",
      transition: "failed",
      webhookEventId: event.id,
      ...(mediaAssetId === undefined ? {} : { mediaAssetId }),
      ...(providerAssetId === undefined ? {} : { providerAssetId }),
      ...(providerUploadId === undefined ? {} : { providerUploadId })
    };
  }

  return {
    eventAt,
    eventType: event.type,
    kind: "unsupported",
    reason: "Unsupported Mux event for FASE 2 media pipeline.",
    webhookEventId: event.id
  };
}

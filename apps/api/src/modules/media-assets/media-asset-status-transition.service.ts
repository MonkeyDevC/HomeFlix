import type { MediaWebhookAckPayload } from "@homeflix/contracts";
import type { MediaAssetStatus } from "@homeflix/domain";
import { ApiError } from "../../errors/api-error.js";
import {
  MediaAssetRepository,
  type WebhookEventRecord
} from "./media-asset.repository.js";
import {
  mapMuxEventToDomain,
  type DomainMediaWebhookEvent
} from "./mux-event.mapper.js";
import type { MuxWebhookPayload } from "./mux-webhook-event.js";

export class MediaAssetStatusTransitionService {
  constructor(private readonly repository: MediaAssetRepository) {}

  async applyMuxWebhook(event: MuxWebhookPayload): Promise<MediaWebhookAckPayload> {
    return this.applyDomainWebhook(mapMuxEventToDomain(event));
  }

  async applyDomainWebhook(
    event: DomainMediaWebhookEvent
  ): Promise<MediaWebhookAckPayload> {
    const claim = await this.repository.claimWebhookEvent({
      eventType: event.eventType,
      receivedAt: event.eventAt,
      webhookEventId: event.webhookEventId
    });

    if (claim.status === "already_claimed") {
      return replayAck(event, claim.event);
    }

    try {
      if (event.kind === "unsupported") {
        await this.repository.markWebhookEventProcessed({
          applied: false,
          reason: event.reason,
          webhookEventId: event.webhookEventId
        });

        return {
          accepted: true,
          applied: false,
          eventType: event.eventType,
          reason: event.reason,
          webhookEventId: event.webhookEventId
        };
      }

      if (event.kind === "asset-created") {
        const updated = await this.repository.applyAssetCreated({
          eventType: event.eventType,
          providerAssetId: event.providerAssetId,
          providerUploadId: event.providerUploadId,
          rawWebhookLastEventAt: event.eventAt,
          webhookEventId: event.webhookEventId
        });

        if (updated === null) {
          throw new ApiError(
            404,
            "asset_not_found",
            "No MediaAsset matched the Mux upload id.",
            { providerUploadId: event.providerUploadId }
          );
        }

        await this.repository.markWebhookEventProcessed({
          applied: true,
          mediaAssetId: updated.id,
          transition: event.transition,
          webhookEventId: event.webhookEventId
        });

        return {
          accepted: true,
          applied: true,
          eventType: event.eventType,
          mediaAssetId: updated.id,
          transition: event.transition,
          webhookEventId: event.webhookEventId
        };
      }

      if (event.kind === "asset-ready") {
        const updated = await this.repository.applyReady({
          eventType: event.eventType,
          providerAssetId: event.providerAssetId,
          rawWebhookLastEventAt: event.eventAt,
          webhookEventId: event.webhookEventId,
          ...(event.durationSeconds === undefined
            ? {}
            : { durationSeconds: event.durationSeconds }),
          ...(event.mediaAssetId === undefined
            ? {}
            : { mediaAssetId: event.mediaAssetId }),
          ...(event.playbackId === undefined
            ? {}
            : { playbackId: event.playbackId }),
          ...(event.providerUploadId === undefined
            ? {}
            : { providerUploadId: event.providerUploadId })
        });

        if (updated === null) {
          throw new ApiError(
            404,
            "asset_not_found",
            "No MediaAsset matched the Mux asset ready event.",
            { providerAssetId: event.providerAssetId }
          );
        }

        await this.repository.markWebhookEventProcessed({
          applied: true,
          mediaAssetId: updated.id,
          transition: event.transition,
          webhookEventId: event.webhookEventId
        });

        return {
          accepted: true,
          applied: true,
          eventType: event.eventType,
          mediaAssetId: updated.id,
          transition: event.transition,
          webhookEventId: event.webhookEventId
        };
      }

      const updated = await this.repository.applyFailed({
        eventType: event.eventType,
        failureReason: event.failureReason,
        rawWebhookLastEventAt: event.eventAt,
        webhookEventId: event.webhookEventId,
        ...(event.mediaAssetId === undefined
          ? {}
          : { mediaAssetId: event.mediaAssetId }),
        ...(event.providerAssetId === undefined
          ? {}
          : { providerAssetId: event.providerAssetId }),
        ...(event.providerUploadId === undefined
          ? {}
          : { providerUploadId: event.providerUploadId })
      });

      if (updated === null) {
        throw new ApiError(
          404,
          "asset_not_found",
          "No MediaAsset matched the Mux failure event."
        );
      }

      await this.repository.markWebhookEventProcessed({
        applied: true,
        mediaAssetId: updated.id,
        transition: event.transition,
        webhookEventId: event.webhookEventId
      });

      return {
        accepted: true,
        applied: true,
        eventType: event.eventType,
        mediaAssetId: updated.id,
        transition: event.transition,
        webhookEventId: event.webhookEventId
      };
    } catch (error) {
      await this.repository.releaseWebhookEvent(event.webhookEventId);
      throw error;
    }
  }
}

function replayAck(
  event: DomainMediaWebhookEvent,
  record: WebhookEventRecord
): MediaWebhookAckPayload {
  const transition = parseTransition(record.transition);

  return {
    accepted: true,
    applied: false,
    eventType: event.eventType,
    idempotentReplay: true,
    reason:
      record.processedAt === null
        ? "Webhook event is already being processed."
        : "Webhook event was already processed.",
    webhookEventId: event.webhookEventId,
    ...(record.mediaAssetId === null ? {} : { mediaAssetId: record.mediaAssetId }),
    ...(transition === undefined ? {} : { transition })
  };
}

function parseTransition(value: string | null): MediaAssetStatus | undefined {
  if (
    value === "draft" ||
    value === "uploading" ||
    value === "processing" ||
    value === "ready" ||
    value === "failed"
  ) {
    return value;
  }

  return undefined;
}

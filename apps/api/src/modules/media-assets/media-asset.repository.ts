import type { PrismaClient } from "../../generated/prisma/client.js";
import { toMediaAssetSummary, type MediaAssetRecord } from "./media-asset.mapper.js";

export interface CreateMediaAssetInput {
  readonly contentItemId: string;
  readonly mimeType?: string;
  readonly sourceFilename?: string;
}

export interface ApplyAssetCreatedInput {
  readonly eventType: string;
  readonly webhookEventId: string;
  readonly providerAssetId: string;
  readonly providerUploadId?: string;
  readonly rawWebhookLastEventAt: Date;
}

export interface ApplyAssetReadyInput {
  readonly durationSeconds?: number;
  readonly eventType: string;
  readonly webhookEventId: string;
  readonly mediaAssetId?: string;
  readonly providerAssetId: string;
  readonly playbackId?: string;
  readonly providerUploadId?: string;
  readonly rawWebhookLastEventAt: Date;
}

export interface ApplyAssetFailedInput {
  readonly eventType: string;
  readonly failureReason: string;
  readonly webhookEventId: string;
  readonly mediaAssetId?: string;
  readonly providerAssetId?: string;
  readonly providerUploadId?: string;
  readonly rawWebhookLastEventAt: Date;
}

export interface ClaimWebhookEventInput {
  readonly eventType: string;
  readonly receivedAt: Date;
  readonly webhookEventId: string;
}

export interface MarkWebhookEventProcessedInput {
  readonly applied: boolean;
  readonly mediaAssetId?: string;
  readonly reason?: string;
  readonly transition?: string;
  readonly webhookEventId: string;
}

export interface WebhookEventRecord {
  readonly providerEventId: string;
  readonly eventType: string;
  readonly mediaAssetId: string | null;
  readonly applied: boolean;
  readonly transition: string | null;
  readonly reason: string | null;
  readonly processedAt: Date | null;
}

export type ClaimWebhookEventResult =
  | {
      readonly status: "claimed";
    }
  | {
      readonly status: "already_claimed";
      readonly event: WebhookEventRecord;
    };

export class MediaAssetRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async createDraft(input: CreateMediaAssetInput): Promise<MediaAssetRecord> {
    return this.prisma.mediaAsset.create({
      data: {
        legacyPipelineContentItemId: input.contentItemId,
        playbackPolicy: "public",
        provider: "mux",
        status: "draft",
        ...(input.mimeType === undefined ? {} : { mimeType: input.mimeType }),
        ...(input.sourceFilename === undefined
          ? {}
          : { sourceFilename: input.sourceFilename })
      }
    });
  }

  async findById(id: string): Promise<MediaAssetRecord | null> {
    return this.prisma.mediaAsset.findUnique({
      where: {
        id
      }
    });
  }

  async markUploadCreated(
    id: string,
    providerUploadId: string
  ): Promise<MediaAssetRecord> {
    return this.prisma.mediaAsset.update({
      data: {
        providerUploadId,
        status: "uploading"
      },
      where: {
        id
      }
    });
  }

  async markFailed(
    id: string,
    failureReason: string
  ): Promise<MediaAssetRecord> {
    return this.prisma.mediaAsset.update({
      data: {
        failedAt: new Date(),
        failureReason,
        status: "failed"
      },
      where: {
        id
      }
    });
  }

  async applyAssetCreated(input: ApplyAssetCreatedInput): Promise<MediaAssetRecord | null> {
    if (input.providerUploadId === undefined) {
      return null;
    }

    const existing = await this.prisma.mediaAsset.findUnique({
      where: {
        providerUploadId: input.providerUploadId
      }
    });

    if (existing === null) {
      return null;
    }

    return this.prisma.mediaAsset.update({
      data: {
        providerAssetId: input.providerAssetId,
        lastWebhookEventId: input.webhookEventId,
        rawWebhookLastEventAt: input.rawWebhookLastEventAt,
        rawWebhookLastEventType: input.eventType,
        status: "processing"
      },
      where: {
        id: existing.id
      }
    });
  }

  async applyReady(input: ApplyAssetReadyInput): Promise<MediaAssetRecord | null> {
    const existing = await this.findTransitionTarget(
      buildTransitionTarget({
        mediaAssetId: input.mediaAssetId,
        providerAssetId: input.providerAssetId,
        providerUploadId: input.providerUploadId
      })
    );

    if (existing === null) {
      return null;
    }

    return this.prisma.mediaAsset.update({
      data: {
        providerAssetId: input.providerAssetId,
        lastWebhookEventId: input.webhookEventId,
        playbackId: input.playbackId ?? existing.playbackId,
        providerUploadId: input.providerUploadId ?? existing.providerUploadId,
        rawWebhookLastEventAt: input.rawWebhookLastEventAt,
        rawWebhookLastEventType: input.eventType,
        readyAt: new Date(),
        status: "ready",
        ...(input.durationSeconds === undefined
          ? {}
          : { durationSeconds: input.durationSeconds }),
        ...(input.playbackId === undefined
          ? {}
          : { providerPlaybackId: input.playbackId })
      },
      where: {
        id: existing.id
      }
    });
  }

  async applyFailed(input: ApplyAssetFailedInput): Promise<MediaAssetRecord | null> {
    const existing = await this.findTransitionTarget(
      buildTransitionTarget({
        mediaAssetId: input.mediaAssetId,
        providerAssetId: input.providerAssetId,
        providerUploadId: input.providerUploadId
      })
    );

    if (existing === null) {
      return null;
    }

    return this.prisma.mediaAsset.update({
      data: {
        failedAt: new Date(),
        failureReason: input.failureReason,
        lastWebhookEventId: input.webhookEventId,
        providerAssetId: input.providerAssetId ?? existing.providerAssetId,
        providerUploadId: input.providerUploadId ?? existing.providerUploadId,
        rawWebhookLastEventAt: input.rawWebhookLastEventAt,
        rawWebhookLastEventType: input.eventType,
        status: "failed"
      },
      where: {
        id: existing.id
      }
    });
  }

  async claimWebhookEvent(
    input: ClaimWebhookEventInput
  ): Promise<ClaimWebhookEventResult> {
    const existing = await this.prisma.mediaAssetWebhookEvent.findUnique({
      where: {
        providerEventId: input.webhookEventId
      }
    });

    if (existing !== null) {
      return {
        event: existing,
        status: "already_claimed"
      };
    }

    try {
      await this.prisma.mediaAssetWebhookEvent.create({
        data: {
          eventType: input.eventType,
          provider: "mux",
          providerEventId: input.webhookEventId,
          receivedAt: input.receivedAt
        }
      });

      return {
        status: "claimed"
      };
    } catch {
      const claimedByConcurrentRequest =
        await this.prisma.mediaAssetWebhookEvent.findUnique({
          where: {
            providerEventId: input.webhookEventId
          }
        });

      if (claimedByConcurrentRequest !== null) {
        return {
          event: claimedByConcurrentRequest,
          status: "already_claimed"
        };
      }

      throw new Error("Unable to claim webhook event for idempotent handling.");
    }
  }

  async markWebhookEventProcessed(
    input: MarkWebhookEventProcessedInput
  ): Promise<void> {
    await this.prisma.mediaAssetWebhookEvent.update({
      data: {
        applied: input.applied,
        processedAt: new Date(),
        ...(input.mediaAssetId === undefined
          ? {}
          : { mediaAssetId: input.mediaAssetId }),
        ...(input.reason === undefined ? {} : { reason: input.reason }),
        ...(input.transition === undefined
          ? {}
          : { transition: input.transition })
      },
      where: {
        providerEventId: input.webhookEventId
      }
    });
  }

  async releaseWebhookEvent(webhookEventId: string): Promise<void> {
    await this.prisma.mediaAssetWebhookEvent.delete({
      where: {
        providerEventId: webhookEventId
      }
    });
  }

  private async findTransitionTarget(input: {
    readonly mediaAssetId?: string;
    readonly providerAssetId?: string;
    readonly providerUploadId?: string;
  }): Promise<MediaAssetRecord | null> {
    if (input.mediaAssetId !== undefined) {
      const byId = await this.prisma.mediaAsset.findUnique({
        where: {
          id: input.mediaAssetId
        }
      });

      if (byId !== null) {
        return byId;
      }
    }

    if (input.providerAssetId !== undefined) {
      const byAsset = await this.prisma.mediaAsset.findFirst({
        where: {
          providerAssetId: input.providerAssetId
        }
      });

      if (byAsset !== null) {
        return byAsset;
      }
    }

    if (input.providerUploadId !== undefined) {
      return this.prisma.mediaAsset.findUnique({
        where: {
          providerUploadId: input.providerUploadId
        }
      });
    }

    return null;
  }
}

export function mapMediaAsset(record: MediaAssetRecord) {
  return toMediaAssetSummary(record);
}

function buildTransitionTarget(input: {
  readonly mediaAssetId: string | undefined;
  readonly providerAssetId: string | undefined;
  readonly providerUploadId: string | undefined;
}): {
  readonly mediaAssetId?: string;
  readonly providerAssetId?: string;
  readonly providerUploadId?: string;
} {
  return {
    ...(input.mediaAssetId === undefined ? {} : { mediaAssetId: input.mediaAssetId }),
    ...(input.providerAssetId === undefined
      ? {}
      : { providerAssetId: input.providerAssetId }),
    ...(input.providerUploadId === undefined
      ? {}
      : { providerUploadId: input.providerUploadId })
  };
}

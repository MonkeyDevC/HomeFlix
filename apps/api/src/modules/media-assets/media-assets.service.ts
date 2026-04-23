import type {
  CreateUploadRequest,
  CreateUploadResponse,
  MediaAssetSummary,
  MediaWebhookAckPayload
} from "@homeflix/contracts";
import type { ApiRuntimeConfig } from "../../env.js";
import { ApiError } from "../../errors/api-error.js";
import {
  mapMediaAsset,
  MediaAssetRepository
} from "./media-asset.repository.js";
import { MediaAssetStatusTransitionService } from "./media-asset-status-transition.service.js";
import { MuxUploadsService } from "./mux-uploads.service.js";
import { parseMuxWebhookPayload } from "./mux-webhook-event.js";
import { verifyMuxWebhookSignature } from "./mux-webhook-verifier.js";

export class MediaAssetsService {
  private readonly muxUploads: MuxUploadsService;
  private readonly transitionService: MediaAssetStatusTransitionService | undefined;

  constructor(
    private readonly config: ApiRuntimeConfig,
    private readonly repository?: MediaAssetRepository
  ) {
    this.muxUploads = new MuxUploadsService(config);
    this.transitionService =
      repository === undefined
        ? undefined
        : new MediaAssetStatusTransitionService(repository);
  }

  async createUpload(
    input: CreateUploadRequest
  ): Promise<CreateUploadResponse> {
    this.muxUploads.assertConfigured();

    const repository = this.getRepository();
    const draft = await repository.createDraft({
      contentItemId: input.contentItemId,
      ...(input.mimeType === undefined ? {} : { mimeType: input.mimeType }),
      ...(input.sourceFilename === undefined
        ? {}
        : { sourceFilename: input.sourceFilename })
    });

    try {
      const upload = await this.muxUploads.createDirectUpload({
        mediaAssetId: draft.id
      });
      const processingAsset = await repository.markUploadCreated(
        draft.id,
        upload.providerUploadId
      );

      return {
        mediaAssetId: processingAsset.id,
        provider: "mux",
        providerUploadId: upload.providerUploadId,
        status: "uploading",
        uploadUrl: upload.uploadUrl
      };
    } catch (error) {
      const reason =
        error instanceof Error
          ? error.message
          : "Mux direct upload creation failed.";
      await repository.markFailed(draft.id, reason);
      throw error;
    }
  }

  async getMediaAsset(id: string): Promise<MediaAssetSummary> {
    const record = await this.getRepository().findById(id);

    if (record === null) {
      throw new ApiError(404, "asset_not_found", "MediaAsset was not found.", {
        mediaAssetId: id
      });
    }

    return mapMediaAsset(record);
  }

  async getMediaAssetStatus(id: string): Promise<MediaAssetSummary> {
    return this.getMediaAsset(id);
  }

  async handleMuxWebhook(
    rawBody: string,
    signatureHeader: string | undefined
  ): Promise<MediaWebhookAckPayload> {
    const verification = verifyMuxWebhookSignature(
      rawBody,
      signatureHeader,
      this.config.mux.webhookSecret
    );

    if (!verification.ok) {
      throw new ApiError(
        401,
        "invalid_webhook_signature",
        verification.reason ?? "Invalid Mux webhook signature."
      );
    }

    let payload;

    try {
      payload = parseMuxWebhookPayload(rawBody);
    } catch {
      throw new ApiError(
        400,
        "validation_error",
        "Mux webhook body must be valid JSON."
      );
    }

    return this.getTransitionService().applyMuxWebhook(payload);
  }

  private getRepository(): MediaAssetRepository {
    if (this.repository === undefined) {
      throw new ApiError(
        503,
        "invalid_config",
        "DATABASE_URL is required for FASE 2 MediaAsset persistence."
      );
    }

    return this.repository;
  }

  private getTransitionService(): MediaAssetStatusTransitionService {
    if (this.transitionService === undefined) {
      throw new ApiError(
        503,
        "invalid_config",
        "DATABASE_URL is required to apply MediaAsset webhook transitions."
      );
    }

    return this.transitionService;
  }
}

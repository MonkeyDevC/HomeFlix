import Mux from "@mux/mux-node";
import { ApiError } from "../../errors/api-error.js";
import type { ApiRuntimeConfig } from "../../env.js";

export interface CreateMuxUploadInput {
  readonly mediaAssetId: string;
}

export interface CreateMuxUploadResult {
  readonly providerUploadId: string;
  readonly uploadUrl: string;
}

export class MuxUploadsService {
  constructor(private readonly config: ApiRuntimeConfig) {}

  assertConfigured(): void {
    if (
      this.config.mux.tokenId === undefined ||
      this.config.mux.tokenSecret === undefined
    ) {
      throw new ApiError(
        503,
        "invalid_config",
        "MUX_TOKEN_ID and MUX_TOKEN_SECRET are required to create a direct upload."
      );
    }
  }

  async createDirectUpload(
    input: CreateMuxUploadInput
  ): Promise<CreateMuxUploadResult> {
    this.assertConfigured();

    const client = new Mux({
      tokenId: this.config.mux.tokenId,
      tokenSecret: this.config.mux.tokenSecret
    });

    try {
      const upload = await client.video.uploads.create({
        cors_origin: this.config.clientOrigin,
        new_asset_settings: {
          passthrough: input.mediaAssetId,
          playback_policies: ["public"],
          video_quality: "basic"
        },
        test: this.config.mux.testUploads
      });

      if (upload.id === undefined || upload.url === undefined) {
        throw new Error("Mux did not return an upload id and URL.");
      }

      return {
        providerUploadId: upload.id,
        uploadUrl: upload.url
      };
    } catch (error) {
      throw new ApiError(
        502,
        "upload_creation_failed",
        error instanceof Error
          ? error.message
          : "Mux direct upload creation failed."
      );
    }
  }
}

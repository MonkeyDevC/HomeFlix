import type { PlaybackPolicy } from "@homeflix/domain";

/**
 * Legacy minimal playback contract. FASE 6 storefront uses
 * `PlaybackDetailPayload` / `GET /api/v1/content-items/:id/playback` instead.
 */
export interface PlaybackRequest {
  readonly mediaAssetId: string;
  readonly userId: string;
}

export interface PlaybackResponse {
  readonly playbackUrl: string;
  readonly policy: PlaybackPolicy;
}

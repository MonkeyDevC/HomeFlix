import type { ISODateString, Nullable } from "@homeflix/types";
import type { MediaAssetId } from "./ids.js";
import type { MediaAssetStatus, PlaybackPolicy } from "./status.js";

export interface MediaAsset {
  readonly id: MediaAssetId;
  readonly status: MediaAssetStatus;
  readonly playbackPolicy: PlaybackPolicy;
  readonly providerAssetId: Nullable<string>;
  readonly providerPlaybackId: Nullable<string>;
  readonly playbackId: Nullable<string>;
  readonly durationSeconds: Nullable<number>;
  readonly createdAt: ISODateString;
  readonly updatedAt: ISODateString;
}

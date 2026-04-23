import type { ISODateString, Nullable } from "@homeflix/types";
import type {
  ContentItemId,
  MediaAssetId,
  ProfileId,
  WatchHistoryId
} from "./ids.js";

export interface WatchHistory {
  readonly id: WatchHistoryId;
  readonly profileId: ProfileId;
  readonly contentItemId: ContentItemId;
  readonly mediaAssetId: Nullable<MediaAssetId>;
  readonly progressSeconds: number;
  readonly completedAt: Nullable<ISODateString>;
  readonly lastWatchedAt: ISODateString;
  readonly createdAt: ISODateString;
  readonly updatedAt: ISODateString;
}

import type { ISODateString, Nullable } from "@homeflix/types";
import type { MediaAssetId, ContentItemId } from "./ids.js";
import type { ContentItemType } from "./catalog.js";
import type { ContentItemStatus, PublicationVisibility } from "./status.js";

export interface ContentItem {
  readonly id: ContentItemId;
  readonly slug: string;
  readonly title: string;
  readonly synopsis: Nullable<string>;
  readonly type: ContentItemType;
  readonly status: ContentItemStatus;
  readonly visibility: PublicationVisibility;
  readonly primaryMediaAssetId: Nullable<MediaAssetId>;
  readonly createdAt: ISODateString;
  readonly updatedAt: ISODateString;
  readonly publishedAt: Nullable<ISODateString>;
}

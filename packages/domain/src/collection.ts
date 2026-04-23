import type { ISODateString, Nullable } from "@homeflix/types";
import type { CollectionId } from "./ids.js";

export interface Collection {
  readonly id: CollectionId;
  readonly slug: string;
  readonly name: string;
  readonly description: Nullable<string>;
  readonly createdAt: ISODateString;
  readonly updatedAt: ISODateString;
}

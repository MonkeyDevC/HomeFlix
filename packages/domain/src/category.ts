import type { ISODateString, Nullable } from "@homeflix/types";
import type { CategoryId } from "./ids.js";

export interface Category {
  readonly id: CategoryId;
  readonly slug: string;
  readonly name: string;
  readonly description: Nullable<string>;
  readonly createdAt: ISODateString;
  readonly updatedAt: ISODateString;
}

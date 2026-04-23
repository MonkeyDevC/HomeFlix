import type { ISODateString, Nullable } from "@homeflix/types";
import type { ProfileId } from "./ids.js";

export interface Profile {
  readonly id: ProfileId;
  readonly displayName: string;
  readonly avatarKey: Nullable<string>;
  readonly familySafe: boolean;
  readonly createdAt: ISODateString;
  readonly updatedAt: ISODateString;
}

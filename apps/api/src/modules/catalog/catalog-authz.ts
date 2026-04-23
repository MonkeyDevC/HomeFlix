import type { Role } from "@homeflix/domain";
import { canAccessContentItemForConsumption } from "@homeflix/domain";
import type { ContentItemReadModel } from "@homeflix/contracts";
import { ApiError } from "../../errors/api-error.js";
import type { CatalogProfileRecord } from "./catalog.mapper.js";

export interface CatalogAuthContext {
  readonly userId: string;
  readonly role: Role;
}

export function assertAdmin(auth: CatalogAuthContext): void {
  if (auth.role !== "admin") {
    throw new ApiError(
      403,
      "forbidden",
      "This operation requires an administrator.",
      { requiredRole: "admin" }
    );
  }
}

export function assertContentReadable(
  auth: CatalogAuthContext,
  item: ContentItemReadModel
): void {
  if (
    !canAccessContentItemForConsumption({
      editorialStatus: item.editorialStatus,
      role: auth.role,
      visibility: item.visibility
    })
  ) {
    throw new ApiError(
      404,
      "content_not_visible",
      "This content is not available for the current account.",
      { contentItemId: item.id }
    );
  }
}

export function assertProfileAccessible(
  auth: CatalogAuthContext,
  profile: CatalogProfileRecord
): void {
  if (auth.role === "admin") {
    return;
  }

  if (profile.userId === null || profile.userId !== auth.userId) {
    throw new ApiError(
      403,
      "forbidden",
      "This profile is not accessible for the current user.",
      { profileId: profile.id }
    );
  }
}

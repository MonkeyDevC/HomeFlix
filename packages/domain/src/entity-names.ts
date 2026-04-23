export const DOMAIN_ENTITY_NAMES = [
  "ContentItem",
  "MediaAsset",
  "Collection",
  "Category",
  "Profile"
] as const;

export type DomainEntityName = (typeof DOMAIN_ENTITY_NAMES)[number];

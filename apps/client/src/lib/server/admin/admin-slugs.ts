import { slugifyLabel } from "../../family/slugify-label";

export function buildAdminSlugCandidate(label: string, explicitSlug?: string | null): string {
  const preferred = explicitSlug?.trim() ?? "";
  if (preferred !== "") {
    return preferred.toLowerCase();
  }

  return slugifyLabel(label);
}

export async function ensureUniqueAdminSlug(
  desiredSlug: string,
  isTaken: (slug: string) => Promise<boolean>
): Promise<string> {
  if (!(await isTaken(desiredSlug))) {
    return desiredSlug;
  }

  for (let index = 2; index < 1000; index += 1) {
    const suffix = `-${index}`;
    const truncatedBase = desiredSlug.slice(0, Math.max(1, 120 - suffix.length)).replace(/-+$/g, "");
    const candidate = `${truncatedBase}${suffix}`;
    if (!(await isTaken(candidate))) {
      return candidate;
    }
  }

  return `${desiredSlug.slice(0, 112).replace(/-+$/g, "")}-${Date.now().toString().slice(-6)}`;
}

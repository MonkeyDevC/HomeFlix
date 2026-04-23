import { FamilySearchView } from "../../../components/storefront/family-search-view";
import { FamilyStorefrontErrorState } from "../../../components/storefront/family-storefront-error-state";
import { requireStorefrontAccess } from "../../../lib/server/auth/require-storefront-context";
import { searchFamilyCatalogForProfile } from "../../../lib/server/catalog/storefront-home-search";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams
}: Readonly<{
  searchParams: Promise<{ q?: string | string[] | undefined }>;
}>) {
  const resolved = await searchParams;
  const raw = resolved.q;
  const query = typeof raw === "string" ? raw : "";
  const active = await requireStorefrontAccess(`/search?q=${encodeURIComponent(query)}`);

  try {
    const result = await searchFamilyCatalogForProfile(active, query);
    return <FamilySearchView profileName={active.displayName} result={result} />;
  } catch (error) {
    return (
      <FamilyStorefrontErrorState
        title="Búsqueda no disponible"
        message={error instanceof Error ? error.message : "Error inesperado."}
      />
    );
  }
}

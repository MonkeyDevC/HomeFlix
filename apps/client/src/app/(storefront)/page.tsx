import { FamilyHomeView } from "../../components/storefront/family-home-view";
import { FamilyStorefrontErrorState } from "../../components/storefront/family-storefront-error-state";
import { requireStorefrontAccess } from "../../lib/server/auth/require-storefront-context";
import { getFamilyHomeForProfile } from "../../lib/server/catalog/storefront-home-search";
import { listContinueWatchingForProfile } from "../../lib/server/catalog/watch-history-for-profile";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const active = await requireStorefrontAccess("/");

  try {
    const home = await getFamilyHomeForProfile(active);
    const continueWatching = await listContinueWatchingForProfile(active.profileId, active.viewerRole).catch(
      () => []
    );
    return <FamilyHomeView continueWatching={continueWatching} home={home} />;
  } catch (error) {
    return (
      <FamilyStorefrontErrorState
        title="No se pudo cargar el home"
        message={error instanceof Error ? error.message : "Error inesperado."}
      />
    );
  }
}

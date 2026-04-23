import { notFound } from "next/navigation";
import { FamilyContentDetail } from "../../../../components/storefront/family-content-detail";
import { requireStorefrontAccess } from "../../../../lib/server/auth/require-storefront-context";
import { getContentDetailForActiveProfile } from "../../../../lib/server/catalog/content-detail-for-profile";
import { getRelatedForContentDetail } from "../../../../lib/server/catalog/content-detail-related";
import { getWatchProgressForProfileContent } from "../../../../lib/server/catalog/watch-history-for-profile";

export const dynamic = "force-dynamic";

export default async function ContentDetailPage({
  params
}: Readonly<{
  params: Promise<{ slug: string }>;
}>) {
  const { slug } = await params;
  const active = await requireStorefrontAccess(`/c/${slug}`);
  const detail = await getContentDetailForActiveProfile(slug, active.profileId);

  if (detail === null) {
    notFound();
  }

  const [watch, related] = await Promise.all([
    getWatchProgressForProfileContent(active.profileId, detail.item.id),
    getRelatedForContentDetail(detail.item, active.profileId)
  ]);

  return (
    <FamilyContentDetail
      activeProfileName={active.displayName}
      detail={detail}
      related={related}
      resumeProgressSeconds={watch?.progressSeconds ?? null}
    />
  );
}

import { notFound } from "next/navigation";
import { FamilySeriesDetail } from "../../../../components/storefront/family-series-detail";
import { requireStorefrontAccess } from "../../../../lib/server/auth/require-storefront-context";
import { getSeriesDetailForActiveProfile } from "../../../../lib/server/catalog/series-detail-for-profile";

export const dynamic = "force-dynamic";

export default async function SeriesDetailPage({
  params
}: Readonly<{
  params: Promise<{ slug: string }>;
}>) {
  const { slug } = await params;
  const active = await requireStorefrontAccess(`/series/${slug}`);
  const detail = await getSeriesDetailForActiveProfile(slug, active.profileId);

  if (detail === null) {
    notFound();
  }

  return <FamilySeriesDetail detail={detail} />;
}

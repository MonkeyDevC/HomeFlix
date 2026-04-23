import { ContentCreateWizard } from "../../../../../components/admin/content-create-wizard";
import { getFamilyPrisma } from "../../../../../lib/server/db";

type SearchParams = Promise<{ kind?: string | string[]; collectionId?: string | string[] }>;

function pickString(v: string | string[] | undefined): string | undefined {
  if (v === undefined) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

export default async function AdminContentNewPage({
  searchParams
}: Readonly<{ searchParams: SearchParams }>) {
  const sp = await searchParams;
  const kind = pickString(sp.kind);
  const collectionId = pickString(sp.collectionId);

  const preset: { kind?: string; collectionId?: string } = {};
  if (kind !== undefined) preset.kind = kind;
  if (collectionId !== undefined) preset.collectionId = collectionId;

  const prisma = getFamilyPrisma();
  const [categories, collections, profiles] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.collection.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.profile.findMany({
      orderBy: { displayName: "asc" },
      select: { id: true, displayName: true, userId: true }
    })
  ]);

  return (
    <ContentCreateWizard
      categories={categories}
      collections={collections}
      profiles={profiles}
      preset={preset}
    />
  );
}

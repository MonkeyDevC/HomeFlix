import { redirect } from "next/navigation";
import { ProfileSelectForm } from "../../../../components/family-auth/profile-select-form";
import { getActiveProfileSummary } from "../../../../lib/server/auth/active-profile";
import { getFamilySession } from "../../../../lib/server/auth/get-family-session";
import { getFamilyPrisma } from "../../../../lib/server/db";

export const dynamic = "force-dynamic";

type Search = { next?: string | string[] };

export default async function SelectProfilePage({
  searchParams
}: Readonly<{
  searchParams: Promise<Search>;
}>) {
  const user = await getFamilySession();

  if (user === null) {
    redirect("/auth/login");
  }

  const sp = await searchParams;
  const nextRaw = sp.next;
  const nextSingle = Array.isArray(nextRaw) ? nextRaw[0] : nextRaw;
  const nextPath =
    typeof nextSingle === "string" && nextSingle.startsWith("/") && !nextSingle.startsWith("//")
      ? nextSingle
      : "/";

  const prisma = getFamilyPrisma();
  const profiles = await prisma.profile.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    select: { id: true, displayName: true, avatarKey: true }
  });

  if (profiles.length === 0) {
    redirect("/auth/no-profiles");
  }

  const active = await getActiveProfileSummary();

  if (active !== null) {
    redirect(nextPath);
  }

  return <ProfileSelectForm nextPath={nextPath} profiles={profiles} />;
}

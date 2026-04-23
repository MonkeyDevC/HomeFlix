import { redirect } from "next/navigation";
import { requireFamilyUser } from "./require-family-user";

export async function requireAdminUser(nextPath: string) {
  const user = await requireFamilyUser(nextPath);

  if (user.role !== "admin") {
    redirect("/auth/forbidden?reason=admin_only");
  }

  return user;
}

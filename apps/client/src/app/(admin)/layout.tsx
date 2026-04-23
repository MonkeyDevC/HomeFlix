import type { Metadata } from "next";
import { headers } from "next/headers";
import { AdminShell } from "../../components/admin/admin-shell";
import { requireAdminUser } from "../../lib/server/auth/require-admin-user";
import "./admin.css";

export const metadata: Metadata = {
  description: "Panel interno HomeFlix Family V1 (sin Directus).",
  title: "HomeFlix · Admin"
};

export const dynamic = "force-dynamic";

function computeInitials(email: string): string {
  const clean = email.trim();
  if (clean === "") return "A";
  const [localPart] = clean.split("@");
  const source = localPart ?? clean;
  const parts = source.split(/[^a-zA-Z0-9]+/).filter((p) => p.length > 0);
  if (parts.length === 0) return clean.slice(0, 1).toUpperCase();
  const first = parts[0] ?? "";
  if (parts.length === 1) return first.slice(0, 2).toUpperCase();
  const second = parts[1] ?? "";
  return `${first.slice(0, 1)}${second.slice(0, 1)}`.toUpperCase();
}

export default async function AdminShellLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  const h = await headers();
  const pathname = h.get("x-pathname") ?? "/admin";
  const user = await requireAdminUser(pathname);

  return (
    <AdminShell userEmail={user.email} userInitials={computeInitials(user.email)}>
      {children}
    </AdminShell>
  );
}

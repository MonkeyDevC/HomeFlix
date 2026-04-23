import type { ReactNode } from "react";
import { AdminBreadcrumb } from "./admin-breadcrumb";
import { AdminNav } from "./admin-nav";

export function AdminShell({
  children,
  userInitials,
  userEmail
}: Readonly<{
  children: ReactNode;
  userInitials: string;
  userEmail: string;
}>) {
  return (
    <div className="hf-admin-app">
      <div className="hf-admin-layout">
        <AdminNav />
        <div>
          <header className="hf-admin-topbar">
            <div className="hf-admin-topbar-lead">
              <p className="hf-admin-topbar-eyebrow">Backoffice · Family V1</p>
              <AdminBreadcrumb />
            </div>
            <div className="hf-admin-topbar-trail">
              <span className="hf-admin-user-chip" title={userEmail}>
                <span className="hf-admin-user-avatar">{userInitials}</span>
                <span>{userEmail}</span>
              </span>
            </div>
          </header>
          <main className="hf-admin-main">{children}</main>
        </div>
      </div>
    </div>
  );
}

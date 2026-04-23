"use client";

import { Inter } from "next/font/google";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { FamilyStorefrontNav } from "./family-storefront-nav";
import { StorefrontSiteFooter } from "./storefront-site-footer";

const inter = Inter({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-storefront"
});

export function StorefrontShell({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  const pathname = usePathname();
  const isCinematicHome = pathname === "/" || pathname === "";
  const isDetailPage = pathname.startsWith("/c/");
  const isCinematic = isCinematicHome || isDetailPage;
  const isProfilePicker = pathname === "/profiles" || pathname.startsWith("/profiles/");

  return (
    <div
      className={`${inter.className} sf-root${isCinematic ? " sf-root--cinematic" : ""}${isDetailPage ? " sf-root--detail" : ""}${isProfilePicker ? " sf-root--profile-pick" : ""}`}
    >
      {!isProfilePicker ? (
        <header
          className={`sf-topnav sf-topnav-premium${isCinematic ? " sf-topnav--over-hero" : ""}`}
        >
          <div className="sf-topnav-inner">
            <Link aria-label="HomeFlix - Inicio" className="sf-brand sf-brand-premium" href="/">
              <span className="sf-logo sf-logo-premium sf-logo-netflix">HOMEFLIX</span>
              <span className="sf-tagline sf-tagline-premium">Family V1</span>
            </Link>
            <FamilyStorefrontNav />
          </div>
        </header>
      ) : null}
      <main className={`sf-main sf-main-premium${isProfilePicker ? " sf-main--profile-pick" : ""}`}>
        {children}
      </main>
      {!isProfilePicker ? <StorefrontSiteFooter /> : null}
    </div>
  );
}

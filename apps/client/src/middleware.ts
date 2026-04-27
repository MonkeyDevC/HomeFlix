import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/storage/videos/")) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (request.nextUrl.pathname.startsWith("/storage/photos/")) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};

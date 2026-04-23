import { NextResponse } from "next/server";

export function unauthorizedResponse() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

export function forbiddenResponse() {
  return NextResponse.json({ error: "forbidden" }, { status: 403 });
}

export function notFoundResponse() {
  return NextResponse.json({ error: "not_found" }, { status: 404 });
}

export function badRequestResponse(error: string, message?: string) {
  return NextResponse.json(
    message === undefined ? { error } : { error, message },
    { status: 400 }
  );
}

export function serviceUnavailableResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "server_error";
  return NextResponse.json({ error: "server_error", message }, { status: 503 });
}


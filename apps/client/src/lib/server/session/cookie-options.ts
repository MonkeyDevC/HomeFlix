/**
 * Cookies de sesión Family: `Secure` solo cuando la petición entrante es HTTPS
 * (p. ej. `X-Forwarded-Proto: https` detrás de Nginx). En producción por **HTTP**
 * (IP sin TLS), `Secure: true` haría que el navegador **rechace** la cookie y el
 * login pareciera “no hacer nada” tras `ok: true`.
 */
function isIncomingHttps(request: Request): boolean {
  const forwarded = request.headers.get("x-forwarded-proto");
  if (forwarded !== null && forwarded !== "") {
    const first = forwarded.split(",")[0]?.trim().toLowerCase() ?? "";
    if (first === "https") return true;
    if (first === "http") return false;
  }
  try {
    return new URL(request.url).protocol === "https:";
  } catch {
    return false;
  }
}

function cookieSecureForRequest(request: Request): boolean {
  if (process.env.NODE_ENV !== "production") {
    return false;
  }
  return isIncomingHttps(request);
}

export function familyAuthCookieOptions(request: Request): {
  httpOnly: boolean;
  sameSite: "lax";
  secure: boolean;
  path: string;
  maxAge: number;
} {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: cookieSecureForRequest(request),
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  };
}

export function clearedFamilyCookieOptions(request: Request): {
  httpOnly: boolean;
  sameSite: "lax";
  secure: boolean;
  path: string;
  maxAge: number;
} {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: cookieSecureForRequest(request),
    path: "/",
    maxAge: 0
  };
}

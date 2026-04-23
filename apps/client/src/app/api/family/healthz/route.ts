import { NextResponse } from "next/server";

/**
 * Endpoint de liveness anónimo para HEALTHCHECK de Docker y upstream checks de Nginx.
 *
 * Intencionalmente liviano: NO toca la base de datos ni el disco, para que pueda
 * responder incluso si PostgreSQL está temporalmente indisponible (un liveness que
 * falla con la DB se comporta como readiness y provoca reinicios innecesarios).
 *
 * Cuando se necesite un readiness más estricto (por ejemplo para un load balancer con
 * drain), agregar un `/api/family/readyz` separado que sí pruebe la conexión.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(): NextResponse {
  return NextResponse.json(
    { ok: true, service: "homeflix-family-v1" },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0, must-revalidate"
      }
    }
  );
}

export function HEAD(): NextResponse {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Cache-Control": "no-store, max-age=0, must-revalidate"
    }
  });
}

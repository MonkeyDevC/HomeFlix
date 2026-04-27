import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { NextResponse } from "next/server";
import { requireStorefrontApi } from "../../../../../lib/server/auth/require-storefront-api";
import { getFamilySession } from "../../../../../lib/server/auth/get-family-session";
import { prismaWhereStorefrontVisibleContent } from "../../../../../lib/server/catalog/content-storefront-visibility";
import { getFamilyPrisma } from "../../../../../lib/server/db";
import { notFoundResponse, serviceUnavailableResponse } from "../../../../../lib/server/http/family-api-errors";
import { resolveStorageDiskPath } from "../../../../../lib/server/storage/family-storage";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;

  try {
    const prisma = getFamilyPrisma();
    const session = await getFamilySession();

    let row: { id: string; filePath: string; mimeType: string } | null = null;

    if (session?.role === "admin") {
      row = await prisma.photoAsset.findFirst({
        where: { id, contentItem: { type: "photo_gallery" } },
        select: { id: true, filePath: true, mimeType: true }
      });
    } else {
      const gate = await requireStorefrontApi();
      if (gate instanceof NextResponse) {
        return gate;
      }
      const active = gate;
      row = await prisma.photoAsset.findFirst({
        where: {
          id,
          contentItem: {
            type: "photo_gallery",
            AND: [prismaWhereStorefrontVisibleContent(active.profileId, active.viewerRole)]
          }
        },
        select: { id: true, filePath: true, mimeType: true }
      });
    }

    if (row === null) {
      return notFoundResponse();
    }

    const diskPath = resolveStorageDiskPath(row.filePath);
    if (diskPath === null) {
      return notFoundResponse();
    }

    const info = await stat(diskPath).catch(() => null);
    if (info === null || !info.isFile()) {
      return notFoundResponse();
    }

    const contentType = row.mimeType || "image/jpeg";
    const ifNone = request.headers.get("if-none-match");
    const etag = `"p-${row.id}"`;
    if (ifNone === etag) {
      return new NextResponse(null, { status: 304 });
    }

    const stream = createReadStream(diskPath);
    return new NextResponse(Readable.toWeb(stream) as ReadableStream, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(info.size),
        ETag: etag,
        "Cache-Control": "private, max-age=0, must-revalidate"
      }
    });
  } catch (error) {
    return serviceUnavailableResponse(error);
  }
}

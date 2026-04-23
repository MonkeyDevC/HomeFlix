import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { NextResponse } from "next/server";
import { requireStorefrontApi } from "../../../../../lib/server/auth/require-storefront-api";
import { getFamilyPrisma } from "../../../../../lib/server/db";
import { notFoundResponse, serviceUnavailableResponse } from "../../../../../lib/server/http/family-api-errors";
import { resolveStorageDiskPath } from "../../../../../lib/server/storage/family-storage";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const gate = await requireStorefrontApi();
  if (gate instanceof NextResponse) {
    return gate;
  }
  const active = gate;
  const { id } = await ctx.params;

  try {
    const prisma = getFamilyPrisma();
    const asset = await prisma.mediaAsset.findFirst({
      where: {
        id,
        status: "ready",
        contentItem: {
          editorialStatus: "published",
          accessGrants: { some: { profileId: active.profileId } }
        }
      },
      select: {
        id: true,
        filePath: true,
        mimeType: true
      }
    });

    if (asset === null) {
      return notFoundResponse();
    }

    const diskPath = resolveStorageDiskPath(asset.filePath);
    if (diskPath === null) {
      return notFoundResponse();
    }

    const info = await stat(diskPath).catch(() => null);
    if (info === null || !info.isFile()) {
      return notFoundResponse();
    }

    const contentType = asset.mimeType ?? "video/mp4";
    const range = request.headers.get("range");
    if (range !== null) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
      if (match === null) {
        return new NextResponse(null, { status: 416 });
      }

      const startRaw = match[1] ?? "";
      const endRaw = match[2] ?? "";
      const start = startRaw === "" ? 0 : Number.parseInt(startRaw, 10);
      const end = endRaw === "" ? info.size - 1 : Number.parseInt(endRaw, 10);
      if (
        !Number.isFinite(start) ||
        !Number.isFinite(end) ||
        start < 0 ||
        end < start ||
        end >= info.size
      ) {
        return new NextResponse(null, { status: 416 });
      }

      const chunkSize = end - start + 1;
      const stream = createReadStream(diskPath, { start, end });
      return new NextResponse(Readable.toWeb(stream) as ReadableStream, {
        status: 206,
        headers: {
          "Accept-Ranges": "bytes",
          "Content-Length": String(chunkSize),
          "Content-Range": `bytes ${start}-${end}/${info.size}`,
          "Content-Type": contentType,
          "Cache-Control": "private, max-age=0, must-revalidate"
        }
      });
    }

    const stream = createReadStream(diskPath);
    return new NextResponse(Readable.toWeb(stream) as ReadableStream, {
      status: 200,
      headers: {
        "Accept-Ranges": "bytes",
        "Content-Length": String(info.size),
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=0, must-revalidate"
      }
    });
  } catch (error) {
    return serviceUnavailableResponse(error);
  }
}


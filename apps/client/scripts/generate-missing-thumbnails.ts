/**
 * Script one-shot: para cada `ContentItem` **sin** thumbnail/poster pero
 * **con** un `MediaAsset` listo, extrae un frame del video con ffmpeg y lo
 * asigna como thumbnail y/o poster.
 *
 * Ejecutar:
 *   corepack pnpm --filter @homeflix/client exec tsx scripts/generate-missing-thumbnails.ts
 */
import { randomUUID } from "node:crypto";
import { mkdir, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import "dotenv/config";
import { extractPosterFrame } from "../src/lib/server/admin/video-transcode";
import { getFamilyPrisma } from "../src/lib/server/db";
import { getFamilyStorageRoot } from "../src/lib/server/env";

async function main(): Promise<void> {
  const prisma = getFamilyPrisma();
  const root = process.cwd();

  const contents = await prisma.contentItem.findMany({
    where: {
      OR: [{ thumbnailPath: null }, { posterPath: null }],
      mediaAssets: { some: { status: "ready" } }
    },
    select: {
      id: true,
      slug: true,
      title: true,
      thumbnailPath: true,
      posterPath: true,
      mediaAssets: {
        where: { status: "ready" },
        orderBy: { updatedAt: "desc" },
        take: 1,
        select: { filePath: true, durationSeconds: true }
      }
    }
  });

  if (contents.length === 0) {
    console.log("Nada que reparar: todos los ContentItems con media ya tienen thumbnail/poster.");
    return;
  }

  const storageRoot = path.resolve(root, getFamilyStorageRoot());
  const thumbDir = path.join(storageRoot, "thumbnails");
  await mkdir(thumbDir, { recursive: true });

  let fixed = 0;
  let skipped = 0;

  for (const content of contents) {
    const asset = content.mediaAssets[0];
    if (asset === undefined || !asset.filePath.startsWith("/storage/")) {
      skipped++;
      continue;
    }
    const videoRel = asset.filePath.replace(/^\/+/, "");
    const videoDiskPath = path.resolve(root, "public", videoRel);
    try {
      await stat(videoDiskPath);
    } catch {
      console.warn(`[skip] video ausente para ${content.slug}: ${videoDiskPath}`);
      skipped++;
      continue;
    }

    const fileName = `auto-${Date.now()}-${randomUUID()}.jpg`;
    const destPath = path.join(thumbDir, fileName);

    try {
      await extractPosterFrame(videoDiskPath, destPath, {
        durationSeconds: asset.durationSeconds
      });
    } catch (err) {
      console.warn(
        `[skip] ffmpeg falló para ${content.slug}:`,
        err instanceof Error ? err.message : err
      );
      skipped++;
      continue;
    }

    const publicPath = `/storage/thumbnails/${fileName}`;
    const updates: { thumbnailPath?: string; posterPath?: string } = {};
    if (content.thumbnailPath === null) updates.thumbnailPath = publicPath;
    if (content.posterPath === null) updates.posterPath = publicPath;

    await prisma.contentItem.update({
      where: { id: content.id },
      data: updates
    });

    console.log(`[ok] ${content.slug} → ${publicPath}`);
    fixed++;
  }

  console.log(`\nResumen: ${fixed} reparados, ${skipped} saltados.`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("[fatal]", err);
  process.exitCode = 1;
});

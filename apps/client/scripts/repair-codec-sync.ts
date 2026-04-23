/**
 * Script one-shot: resincroniza `media_assets.codec` (+ width/height/frameRate/
 * durationSeconds/sizeBytes) leyendo el archivo real en disco con ffprobe.
 *
 * Úsalo cuando hayas re-encodeado videos "a mano" (fuera del pipeline del
 * admin) y la BD haya quedado apuntando a un codec obsoleto (p.ej. AV1).
 *
 * Ejecutar:
 *   corepack pnpm --filter @homeflix/client exec tsx scripts/repair-codec-sync.ts
 */
import { stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import "dotenv/config";
import { probeVideo } from "../src/lib/server/admin/video-probe";
import { getFamilyPrisma } from "../src/lib/server/db";

async function main(): Promise<void> {
  const prisma = getFamilyPrisma();
  const assets = await prisma.mediaAsset.findMany({
    orderBy: { updatedAt: "desc" }
  });

  const root = process.cwd();
  let updated = 0;
  let skipped = 0;

  for (const asset of assets) {
    if (!asset.filePath.startsWith("/storage/")) {
      skipped++;
      continue;
    }
    const rel = asset.filePath.replace(/^\/+/, "");
    const diskPath = path.resolve(root, "public", rel);
    try {
      await stat(diskPath);
    } catch {
      console.warn(`[skip] archivo ausente: ${diskPath}`);
      skipped++;
      continue;
    }

    const probe = await probeVideo(diskPath);
    if (!probe.ok) {
      console.warn(`[skip] probe falló para ${asset.id}: ${probe.message}`);
      skipped++;
      continue;
    }

    const st = await stat(diskPath);

    await prisma.mediaAsset.update({
      where: { id: asset.id },
      data: {
        codec: probe.metadata.codec,
        width: probe.metadata.width,
        height: probe.metadata.height,
        frameRate: probe.metadata.frameRate,
        durationSeconds: probe.metadata.durationSeconds,
        sizeBytes: BigInt(st.size)
      }
    });

    console.log(
      `[ok] ${asset.id} → codec=${probe.metadata.codec}, ${probe.metadata.width}x${probe.metadata.height} @ ${probe.metadata.frameRate}fps`
    );
    updated++;
  }

  console.log(`\nResumen: ${updated} actualizados, ${skipped} saltados.`);
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("[fatal]", err);
  process.exitCode = 1;
});

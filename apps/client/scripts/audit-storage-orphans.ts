/**
 * Lista archivos en `FAMILY_STORAGE_ROOT`/{videos,posters,thumbnails} que no
 * aparecen en ninguna fila de `content_items` ni `media_assets`.
 *
 * Uso (desde el paquete client, con `.env` cargado):
 *   corepack pnpm --filter @homeflix/client exec tsx scripts/audit-storage-orphans.ts
 *   corepack pnpm --filter @homeflix/client exec tsx scripts/audit-storage-orphans.ts --delete
 *
 * Por defecto solo imprime (equivalente a `--dry-run`). Con `--delete` borra
 * cada huérfano usando la misma resolución segura que el runtime (`/storage/...`).
 */
import { readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import "dotenv/config";
import { removeStoredFileMaybe } from "../src/lib/server/admin/admin-media-storage";
import { getFamilyPrisma } from "../src/lib/server/db";
import { resolveStorageRoot } from "../src/lib/server/storage/family-storage";

const BUCKETS = ["videos", "posters", "thumbnails"] as const;

async function listPublicPathsOnDisk(): Promise<string[]> {
  const root = resolveStorageRoot();
  const out: string[] = [];
  for (const bucket of BUCKETS) {
    const dir = path.join(root, bucket);
    let names: string[];
    try {
      names = await readdir(dir);
    } catch {
      continue;
    }
    for (const name of names) {
      if (name === ".gitkeep" || name.startsWith(".")) continue;
      out.push(`/storage/${bucket}/${name}`);
    }
  }
  return out;
}

async function collectReferencedPublicPaths(): Promise<Set<string>> {
  const prisma = getFamilyPrisma();
  const ref = new Set<string>();

  const items = await prisma.contentItem.findMany({
    select: { posterPath: true, thumbnailPath: true }
  });
  for (const it of items) {
    if (it.posterPath !== null && it.posterPath.trim() !== "") {
      ref.add(it.posterPath.trim());
    }
    if (it.thumbnailPath !== null && it.thumbnailPath.trim() !== "") {
      ref.add(it.thumbnailPath.trim());
    }
  }

  const assets = await prisma.mediaAsset.findMany({
    select: { filePath: true }
  });
  for (const a of assets) {
    if (a.filePath.trim() !== "") {
      ref.add(a.filePath.trim());
    }
  }

  return ref;
}

async function main(): Promise<void> {
  const doDelete = process.argv.includes("--delete");
  const prisma = getFamilyPrisma();

  const referenced = await collectReferencedPublicPaths();
  const onDisk = await listPublicPathsOnDisk();
  const orphans = onDisk.filter((p) => !referenced.has(p));

  console.log(`[audit-storage] root=${resolveStorageRoot()}`);
  console.log(`[audit-storage] archivos en disco: ${onDisk.length}`);
  console.log(`[audit-storage] rutas referenciadas en BD: ${referenced.size}`);
  console.log(`[audit-storage] huérfanos: ${orphans.length}`);

  if (orphans.length === 0) {
    await prisma.$disconnect();
    return;
  }

  for (const p of orphans) {
    console.log(`  ${doDelete ? "DELETE" : "would-delete"} ${p}`);
  }

  if (doDelete) {
    for (const p of orphans) {
      await removeStoredFileMaybe(p, "orphan-audit-script");
    }
    console.log("[audit-storage] borrado completado.");
  } else {
    console.log("[audit-storage] modo dry-run. Pasa --delete para borrar.");
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("[audit-storage] fatal", err);
  process.exitCode = 1;
});

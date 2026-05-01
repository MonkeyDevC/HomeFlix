import { existsSync } from "node:fs";
import path from "node:path";
import { getFamilyStorageRoot } from "../env";

/**
 * Buckets físicos bajo la raíz de storage. Cualquier bucket nuevo debe añadirse aquí
 * para mantener la enumeración cerrada y evitar paths inventados en tiempo de ejecución.
 */
export type FamilyStorageBucket = "videos" | "posters" | "thumbnails" | "photos";

/**
 * Prefijo de URL pública con el que el monolito sirve posters/thumbnails (estáticos de Next.js)
 * y a través del cual el middleware filtra el acceso directo a videos.
 */
export const FAMILY_STORAGE_URL_PREFIX = "/storage/";

/** Directorio del monolito Next (`apps/client`), útil cuando `process.cwd()` es la raíz del repo. */
function resolveNextAppRootForRelativePaths(): string {
  const cwd = process.cwd();
  if (nextConfigExistsInDir(cwd)) {
    return cwd;
  }
  const nested = path.join(cwd, "apps", "client");
  if (nextConfigExistsInDir(nested)) {
    return nested;
  }
  return cwd;
}

function nextConfigExistsInDir(dir: string): boolean {
  return (
    existsSync(path.join(dir, "next.config.ts")) ||
    existsSync(path.join(dir, "next.config.mjs")) ||
    existsSync(path.join(dir, "next.config.js"))
  );
}

/**
 * Resuelve la raíz absoluta del almacenamiento de media. Lee `FAMILY_STORAGE_ROOT`:
 * si la ruta es relativa, se interpreta contra el directorio de la app Next (donde está
 * `next.config.*`), no solo `process.cwd()`: en monorepos es habitual arrancar con cwd
 * en la raíz del repo y los archivos reales viven en `apps/client/public/storage`.
 */
export function resolveStorageRoot(): string {
  const configured = getFamilyStorageRoot();
  if (path.isAbsolute(configured)) {
    return path.normalize(configured);
  }
  const base = resolveNextAppRootForRelativePaths();
  return path.normalize(path.resolve(base, configured));
}

export function resolveBucketDir(bucket: FamilyStorageBucket): string {
  return path.join(resolveStorageRoot(), bucket);
}

/**
 * Convierte una ruta pública `/storage/<bucket>/<archivo>` en su path absoluto en disco
 * dentro de `FAMILY_STORAGE_ROOT`. Devuelve `null` si:
 *   - el input no tiene el prefijo público esperado
 *   - el resultado escaparía de la raíz (defensa contra path traversal)
 */
export function resolveStorageDiskPath(publicPath: string | null | undefined): string | null {
  if (publicPath === undefined || publicPath === null) {
    return null;
  }
  let trimmed = publicPath.trim();
  if (trimmed === "") {
    return null;
  }
  // Aceptar valores legacy sin barra inicial (`storage/videos/...`) para borrado y comprobaciones.
  const noLeading = trimmed.replace(/^\/+/, "");
  if (noLeading.startsWith("storage/")) {
    trimmed = `/${noLeading}`;
  }
  if (!trimmed.startsWith(FAMILY_STORAGE_URL_PREFIX)) {
    return null;
  }
  const rel = trimmed.slice(FAMILY_STORAGE_URL_PREFIX.length).replace(/^\/+/, "");
  if (rel === "" || rel.includes("\0")) {
    return null;
  }
  const root = resolveStorageRoot();
  const absolute = path.normalize(path.join(root, rel));
  const rootWithSep = root.endsWith(path.sep) ? root : root + path.sep;
  if (absolute !== root && !absolute.startsWith(rootWithSep)) {
    return null;
  }
  return absolute;
}

export function toPublicStoragePath(bucket: FamilyStorageBucket, fileName: string): string {
  return `${FAMILY_STORAGE_URL_PREFIX}${bucket}/${fileName}`;
}

export function isManagedStoragePath(publicPath: string | null | undefined): boolean {
  return resolveStorageDiskPath(publicPath) !== null;
}

/**
 * Comprobación sincrónica best-effort (util para render-side fallbacks que ya tenían este patrón).
 * No hace I/O bloqueante pesado: `existsSync` solo consulta el inode.
 */
export function storageFileExistsSync(publicPath: string | null | undefined): boolean {
  const disk = resolveStorageDiskPath(publicPath);
  if (disk === null) {
    return false;
  }
  return existsSync(disk);
}

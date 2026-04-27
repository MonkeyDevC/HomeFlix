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

/**
 * Resuelve la raíz absoluta del almacenamiento de media. Lee `FAMILY_STORAGE_ROOT`:
 * si la ruta es relativa, se interpreta contra `process.cwd()` (default `public/storage`,
 * que mantiene compatibilidad con el servicio estático de Next.js bajo `public/`).
 */
export function resolveStorageRoot(): string {
  const configured = getFamilyStorageRoot();
  return path.isAbsolute(configured)
    ? path.normalize(configured)
    : path.normalize(path.resolve(/*turbopackIgnore: true*/ process.cwd(), configured));
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
  const trimmed = publicPath.trim();
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

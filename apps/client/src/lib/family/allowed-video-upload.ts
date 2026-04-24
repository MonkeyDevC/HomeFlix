/**
 * Formatos de video permitidos en upload admin y reproducción local (Family V1).
 * Única lista de referencia para MIME/extensiones y textos de ayuda.
 */

export const FAMILY_ALLOWED_VIDEO_MIME_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/x-quicktime",
  "video/x-mov"
] as const;

export const FAMILY_ALLOWED_VIDEO_EXTENSIONS = [".mp4", ".mov"] as const;

/** Valor del atributo `accept` en inputs de archivo de video. */
export const FAMILY_VIDEO_FILE_ACCEPT =
  "video/mp4,video/quicktime,video/x-quicktime,.mp4,.mov" as const;

/** Texto corto para hints de UI (admin). */
export const FAMILY_VIDEO_FORMAT_LABEL = "MP4 / MOV" as const;

/** Aviso storefront: contenedor QuickTime puede fallar según navegador/códec. */
export const FAMILY_MOV_PLAYBACK_COMPAT_HINT =
  "Este video está en formato MOV. Si no se reproduce en este navegador, conviértelo a MP4 H.264/AAC para máxima compatibilidad." as const;

const VIDEO_MIME_TO_EXT: Readonly<Record<string, readonly string[]>> = {
  "video/mp4": [".mp4"],
  "video/quicktime": [".mov"],
  /** Algunos user-agents envían esto en lugar de `video/quicktime`. */
  "video/x-quicktime": [".mov"],
  "video/x-mov": [".mov"]
};

export function familyVideoMimeToExtMap(): Readonly<Record<string, readonly string[]>> {
  return VIDEO_MIME_TO_EXT;
}

/**
 * Normaliza MIME para validación/guardado: algunos navegadores envían vacío u
 * `octet-stream` aunque la extensión sea .mov / .mp4.
 */
export function isFamilyQuickTimeMime(mime: string | null | undefined): boolean {
  const m = mime?.toLowerCase().trim() ?? "";
  return m === "video/quicktime" || m === "video/x-quicktime" || m === "video/x-mov";
}

export function inferFamilyVideoMimeType(fileType: string, normalizedExt: string): string {
  const m = fileType.toLowerCase().trim();
  if (m === "video/mp4" || m === "video/quicktime" || m === "video/x-quicktime" || m === "video/x-mov") {
    return m === "video/mp4" ? "video/mp4" : "video/quicktime";
  }
  if (m === "" || m === "application/octet-stream" || m === "binary/octet-stream") {
    if (normalizedExt === ".mov") return "video/quicktime";
    if (normalizedExt === ".mp4") return "video/mp4";
  }
  return m;
}

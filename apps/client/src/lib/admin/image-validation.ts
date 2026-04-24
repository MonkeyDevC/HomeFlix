import {
  getImageDimensionsFromFile,
  getImageDimensionsFromUrl
} from "./get-image-dimensions";

/** Alineado con `admin-media-storage` (imagen admin). */
export const FAMILY_IMAGE_UPLOAD_MAX_BYTES = 10 * 1024 * 1024;

export type ImageReviewIntent = "poster" | "thumbnail";

export type ImageValidationResult = Readonly<{
  isValid: boolean;
  warnings: string[];
  width: number;
  height: number;
  /** Ancho / alto (p. ej. 16/9 ≈ 1.78). */
  aspectRatio: number;
  recommendedUse: "poster" | "thumbnail" | "unknown";
}>;

const POSTER_MIN_W = 600;
const POSTER_MIN_H = 900;
const POSTER_IDEAL_W = 1000;
const POSTER_IDEAL_H = 1500;

const THUMB_MIN_W = 1280;
const THUMB_MIN_H = 720;
const THUMB_IDEAL_W = 1920;
const THUMB_IDEAL_H = 1080;

const POSTER_AR_TARGET = 2 / 3;
const THUMB_AR_TARGET = 16 / 9;

function gcd(a: number, b: number): number {
  let x = Math.round(Math.abs(a));
  let y = Math.round(Math.abs(b));
  while (y !== 0) {
    const t = y;
    y = x % y;
    x = t;
  }
  return Math.max(1, x);
}

/** Etiqueta legible tipo "2 : 3" o "16 : 9" si encaja; si no, decimales cortos. */
export function formatAspectRatioLabel(width: number, height: number): string {
  if (width <= 0 || height <= 0) return "—";
  const g = gcd(width, height);
  const rw = Math.round(width / g);
  const rh = Math.round(height / g);
  if (rw <= 120 && rh <= 120) {
    return `${rw} : ${rh}`;
  }
  const r = width / height;
  return `${Math.round(r * 1000) / 1000}`;
}

export function inferRecommendedUse(width: number, height: number): "poster" | "thumbnail" | "unknown" {
  const ar = width / height;
  const dPoster = Math.abs(ar - POSTER_AR_TARGET);
  const dThumb = Math.abs(ar - THUMB_AR_TARGET);
  if (dPoster <= 0.14 && dThumb > 0.18) return "poster";
  if (dThumb <= 0.12 && dPoster > 0.16) return "thumbnail";
  return "unknown";
}

export function validateImageForIntent(
  intent: ImageReviewIntent,
  width: number,
  height: number
): ImageValidationResult {
  const ar = width / height;
  const recommendedUse = inferRecommendedUse(width, height);
  const warnings: string[] = [];

  if (intent === "poster") {
    const clearlyTooSmall =
      Math.min(width, height) < 420 || (width < 560 && height < 560);
    if (clearlyTooSmall) {
      return {
        isValid: false,
        warnings: ["Imagen demasiado pequeña para usarla como poster."],
        width,
        height,
        aspectRatio: ar,
        recommendedUse
      };
    }
    if (width < POSTER_MIN_W || height < POSTER_MIN_H) {
      warnings.push(
        "Por debajo del mínimo sugerido para poster (600×900); en tarjetas 2:3 puede recortarse o verse más suave."
      );
    }

    if (ar > 1.15) {
      warnings.push("La imagen es muy horizontal para poster; puede verse recortada en móviles.");
    } else if (ar < 0.52) {
      warnings.push("La imagen es muy vertical; revisá que el sujeto quede centrado en tarjetas 2:3.");
    }

    if (recommendedUse === "thumbnail") {
      warnings.push("La proporción se parece más a un thumbnail 16:9 que a un poster vertical.");
    }

    if (width < POSTER_IDEAL_W || height < POSTER_IDEAL_H) {
      warnings.push("Resolución por debajo del ideal para poster (recomendado: 1000×1500 o superior).");
    }
  } else {
    if (width < THUMB_MIN_W || height < THUMB_MIN_H) {
      return {
        isValid: false,
        warnings: ["Imagen demasiado pequeña para thumbnail / hero (mínimo sugerido 1280×720)."],
        width,
        height,
        aspectRatio: ar,
        recommendedUse
      };
    }

    if (ar < 1.2) {
      warnings.push("La imagen es muy vertical para thumbnail; puede verse mal en TV y carruseles 16:9.");
    } else if (ar > 2.35) {
      warnings.push("La imagen es muy ancha; el recorte 16:9 puede perder bordes laterales.");
    }

    if (recommendedUse === "poster") {
      warnings.push("La proporción se parece más a un poster vertical que a un thumbnail 16:9.");
    }

    if (width < THUMB_IDEAL_W || height < THUMB_IDEAL_H) {
      warnings.push("Resolución baja para pantallas grandes (recomendado: 1920×1080).");
    }
  }

  return {
    isValid: true,
    warnings,
    width,
    height,
    aspectRatio: ar,
    recommendedUse
  };
}

export async function validateImageUrlForIntent(
  intent: ImageReviewIntent,
  src: string
): Promise<ImageValidationResult | { error: string }> {
  try {
    const { width, height } = await getImageDimensionsFromUrl(src);
    return validateImageForIntent(intent, width, height);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "No se pudo validar la imagen.";
    return { error: msg };
  }
}

export async function validateImageFileForIntent(
  intent: ImageReviewIntent,
  file: File
): Promise<ImageValidationResult | { error: string }> {
  try {
    const { width, height } = await getImageDimensionsFromFile(file);
    return validateImageForIntent(intent, width, height);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "No se pudo validar la imagen.";
    return { error: msg };
  }
}

const ALLOWED_IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp"]);

const ALLOWED_IMAGE_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

function extFromName(name: string): string {
  const i = name.lastIndexOf(".");
  if (i < 0) return "";
  const raw = name.slice(i).toLowerCase();
  return raw === ".jpeg" ? ".jpg" : raw;
}

/** Validación rápida antes de subir (MIME, extensión, tamaño). */
export function validateClientImageUploadRules(
  file: File
): { ok: true } | { ok: false; message: string } {
  if (file.size <= 0) {
    return { ok: false, message: "El archivo está vacío." };
  }
  if (file.size > FAMILY_IMAGE_UPLOAD_MAX_BYTES) {
    return { ok: false, message: "Imagen demasiado grande (máx. 10 MiB)." };
  }
  const ext = extFromName(file.name);
  if (!ALLOWED_IMAGE_EXT.has(ext)) {
    return { ok: false, message: "Formato no permitido. Usa JPG, PNG o WebP." };
  }
  const mime = file.type.toLowerCase().trim();
  if (mime !== "" && !ALLOWED_IMAGE_MIME.has(mime)) {
    return { ok: false, message: `Formato no permitido (${mime}). Usa JPG, PNG o WebP.` };
  }
  return { ok: true };
}

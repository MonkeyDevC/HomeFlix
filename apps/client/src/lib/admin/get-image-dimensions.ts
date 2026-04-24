/**
 * Lee dimensiones naturales de una imagen en el navegador (sin librerías).
 * Para rutas públicas relativas (p. ej. `/storage/...`) debe ser same-origin.
 */

export type ImageDimensions = Readonly<{
  width: number;
  height: number;
}>;

export async function getImageDimensionsFromUrl(src: string): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      if (w <= 0 || h <= 0) {
        reject(new Error("No se pudieron leer las dimensiones de la imagen."));
        return;
      }
      resolve({ width: w, height: h });
    };
    img.onerror = () => {
      reject(new Error("No se pudo cargar la imagen para medirla."));
    };
    img.src = src;
  });
}

export async function getImageDimensionsFromFile(file: File): Promise<ImageDimensions> {
  const url = URL.createObjectURL(file);
  try {
    return await getImageDimensionsFromUrl(url);
  } finally {
    URL.revokeObjectURL(url);
  }
}

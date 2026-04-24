import type { NextConfig } from "next";

/** Debe coincidir con `FAMILY_VIDEO_UPLOAD_MAX_BYTES` en `admin-media-storage.ts`. */
const FAMILY_VIDEO_UPLOAD_MAX_BYTES = 5 * 1024 * 1024 * 1024;
/** Mismo margen relativo que antes (310/300) sobre el tope en MiB. */
const MAX_UPLOAD_MB = Math.ceil((FAMILY_VIDEO_UPLOAD_MAX_BYTES / (1024 * 1024)) * (310 / 300));
const MAX_UPLOAD_BODY_SIZE = `${MAX_UPLOAD_MB}mb`;

const nextConfig: NextConfig = {
  experimental: {
    // Next tipa union de literales; el valor se deriva de FAMILY_VIDEO_UPLOAD_MAX_BYTES.
    proxyClientMaxBodySize: MAX_UPLOAD_BODY_SIZE as NextConfig["experimental"] extends {
      proxyClientMaxBodySize?: infer P;
    }
      ? P
      : never
  },
  transpilePackages: ["@homeflix/contracts", "@homeflix/domain"],
  /**
   * `ffprobe-static` expone un binario `.exe` cuya ruta se calcula con
   * `__dirname`. Cuando Next.js bundea el módulo, reescribe `__dirname` a
   * `\ROOT` y el `spawn(ffprobeStatic.path, ...)` falla con ENOENT. Forzamos
   * que Next lo deje fuera del bundle y lo cargue en runtime con `require()`.
   */
  serverExternalPackages: ["ffprobe-static", "ffmpeg-static"]
};

export default nextConfig;

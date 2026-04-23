import type { NextConfig } from "next";

const MAX_UPLOAD_BODY_SIZE = "300mb";

const nextConfig: NextConfig = {
  experimental: {
    proxyClientMaxBodySize: MAX_UPLOAD_BODY_SIZE
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

import {
  DEFAULT_API_HOST,
  DEFAULT_API_PUBLIC_URL,
  DEFAULT_API_PORT,
  DEFAULT_CLIENT_ORIGIN,
  DEFAULT_CMS_PUBLIC_URL,
  parseBooleanEnv,
  parsePort,
  readOptionalEnv,
  readUrlEnv
} from "@homeflix/config";

export interface MuxRuntimeConfig {
  readonly testUploads: boolean;
  readonly tokenId?: string;
  readonly tokenSecret?: string;
  readonly webhookSecret?: string;
  /** Mux JWT signing (FASE 7 signed playback). */
  readonly jwtSigningKey?: string;
  readonly jwtPrivateKey?: string;
}

export interface ApiRuntimeConfig {
  readonly apiPublicUrl: string;
  readonly env: string;
  readonly host: string;
  readonly port: number;
  readonly clientOrigin: string;
  readonly cmsPublicUrl: string;
  readonly databaseUrl?: string;
  /** HS256 secret for API-issued viewer/admin JWT (FASE 7). */
  readonly jwtSecret: string;
  /** Pino log level (e.g. info, warn, error). */
  readonly logLevel: string;
  readonly mux: MuxRuntimeConfig;
}

export function loadApiConfig(
  source: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env
): ApiRuntimeConfig {
  const databaseUrl = readOptionalEnv("DATABASE_URL", source);
  const muxTokenId = readOptionalEnv("MUX_TOKEN_ID", source);
  const muxTokenSecret = readOptionalEnv("MUX_TOKEN_SECRET", source);
  const muxWebhookSecret = readOptionalEnv("MUX_WEBHOOK_SECRET", source);
  const muxSigningKey = readOptionalEnv("MUX_SIGNING_KEY", source);
  const muxPrivateKey = readOptionalEnv("MUX_PRIVATE_KEY", source);
  const jwtSecret =
    readOptionalEnv("HOMEFLIX_JWT_SECRET", source) ??
    "local-dev-homflix-jwt-secret-minimum-32-characters";
  const logLevel = readOptionalEnv("LOG_LEVEL", source) ?? "info";

  if (databaseUrl !== undefined) {
    readUrlEnv("DATABASE_URL", databaseUrl, source);
  }

  return {
    apiPublicUrl: readUrlEnv("API_PUBLIC_URL", DEFAULT_API_PUBLIC_URL, source),
    env: readOptionalEnv("HOMEFLIX_ENV", source) ?? "development",
    host: readOptionalEnv("API_HOST", source) ?? DEFAULT_API_HOST,
    jwtSecret,
    logLevel,
    port: parsePort(readOptionalEnv("API_PORT", source), DEFAULT_API_PORT),
    clientOrigin: readUrlEnv("CLIENT_ORIGIN", DEFAULT_CLIENT_ORIGIN, source),
    cmsPublicUrl: readUrlEnv("CMS_PUBLIC_URL", DEFAULT_CMS_PUBLIC_URL, source),
    ...(databaseUrl === undefined ? {} : { databaseUrl }),
    mux: {
      testUploads: parseBooleanEnv(readOptionalEnv("MUX_TEST_UPLOADS", source), true),
      ...(muxTokenId === undefined ? {} : { tokenId: muxTokenId }),
      ...(muxTokenSecret === undefined ? {} : { tokenSecret: muxTokenSecret }),
      ...(muxWebhookSecret === undefined ? {} : { webhookSecret: muxWebhookSecret }),
      ...(muxSigningKey === undefined ? {} : { jwtSigningKey: muxSigningKey }),
      ...(muxPrivateKey === undefined ? {} : { jwtPrivateKey: muxPrivateKey })
    }
  };
}

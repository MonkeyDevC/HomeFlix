import type { FastifyServerOptions } from "fastify";
import type { ApiRuntimeConfig } from "../env.js";

const REDACT_PATHS = [
  "req.headers.authorization",
  "req.headers.cookie",
  "req.headers.x-api-key"
];

export function buildApiLoggerOptions(
  config: ApiRuntimeConfig
): Exclude<FastifyServerOptions["logger"], false | undefined> {
  return {
    level: config.logLevel,
    redact: {
      paths: REDACT_PATHS,
      remove: true
    }
  };
}

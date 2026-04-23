type EnvSource = NodeJS.ProcessEnv | Record<string, string | undefined>;

export function readOptionalEnv(
  name: string,
  source: EnvSource = process.env
): string | undefined {
  const value = source[name];
  return value === "" ? undefined : value;
}

export function readRequiredEnv(name: string, source: EnvSource = process.env): string {
  const value = readOptionalEnv(name, source);

  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function parsePort(value: string | undefined, fallback: number): number {
  if (value === undefined) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    throw new Error(`Invalid port value: ${value}`);
  }

  return parsed;
}

export function readUrlEnv(
  name: string,
  fallback: string,
  source: EnvSource = process.env
): string {
  const value = readOptionalEnv(name, source) ?? fallback;

  try {
    return new URL(value).toString().replace(/\/$/, "");
  } catch {
    throw new Error(`Invalid URL value for environment variable ${name}: ${value}`);
  }
}

export function parseBooleanEnv(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) {
    return fallback;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  throw new Error(`Invalid boolean value: ${value}`);
}

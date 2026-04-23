export type ClientRuntimeConfig =
  | Readonly<{
      ok: true;
      config: Readonly<{
        apiBaseUrl: string;
      }>;
    }>
  | Readonly<{
      ok: false;
      message: string;
    }>;

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, "");
}

export function getClientRuntimeConfig(): ClientRuntimeConfig {
  const fromEnv =
    process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
    process.env.API_PUBLIC_URL?.trim() ||
    "http://127.0.0.1:4100";

  if (fromEnv === "") {
    return {
      ok: false,
      message: "No hay API base URL configurada para las superficies tecnicas legacy."
    };
  }

  return {
    ok: true,
    config: {
      apiBaseUrl: normalizeBaseUrl(fromEnv)
    }
  };
}

import pg from "pg";

const DEFAULT_PROBE_TIMEOUT_MS = 2500;

export async function probePostgres(
  databaseUrl: string,
  timeoutMs: number = DEFAULT_PROBE_TIMEOUT_MS
): Promise<{ readonly ok: boolean; readonly note: string }> {
  const client = new pg.Client({
    connectionString: databaseUrl,
    connectionTimeoutMillis: timeoutMs
  });

  try {
    await client.connect();
    await client.query("SELECT 1 as readiness_probe");

    return {
      note: "PostgreSQL accepted SELECT 1.",
      ok: true
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown probe error";

    return {
      note: `PostgreSQL probe failed: ${message}`,
      ok: false
    };
  } finally {
    try {
      await client.end();
    } catch {
      /* ignore */
    }
  }
}

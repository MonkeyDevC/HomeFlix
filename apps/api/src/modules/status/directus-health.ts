export async function probeDirectusHealth(
  cmsPublicUrl: string
): Promise<{ readonly ok: boolean; readonly detail: string }> {
  const url = new URL("/server/health", cmsPublicUrl).toString();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, 1200);

    const response = await fetch(url, {
      headers: { accept: "application/json" },
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return {
        detail: `Directus health returned HTTP ${response.status}. See docs/phase-4-backoffice.md.`,
        ok: false
      };
    }

    return {
      detail: "Directus health endpoint responded OK.",
      ok: true
    };
  } catch {
    return {
      detail:
        "Directus health probe failed (service not reachable from API process). Runbook: docs/phase-4-backoffice.md",
      ok: false
    };
  }
}

export function buildDirectusDependencyNote(probe: {
  readonly ok: boolean;
  readonly detail: string;
}): string {
  const base =
    "Directus is the editorial backoffice (FASE 4). Import model: apps/cms/bootstrap/IMPORT-RUNBOOK.md. Verify: pnpm cms:verify.";

  return `${base} ${probe.detail}`;
}

export function directusDependencyStatus(
  probe: { readonly ok: boolean }
): "configured" | "deferred" {
  return probe.ok ? "configured" : "deferred";
}

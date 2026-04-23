/** Helpers para respuestas JSON del backoffice admin (fetch con cookies). */

export async function adminReadErrorMessage(res: Response): Promise<string> {
  try {
    const j = (await res.json()) as { message?: string; error?: string };
    if (typeof j.message === "string" && j.message.length > 0) {
      return j.message;
    }
    if (typeof j.error === "string" && j.error.length > 0) {
      return j.error;
    }
  } catch {
    /* ignore */
  }
  return res.statusText || "Error desconocido";
}

export async function adminParseJson<T>(res: Response): Promise<
  | { ok: true; data: T }
  | { ok: false; status: number; message: string }
> {
  if (!res.ok) {
    return { ok: false, status: res.status, message: await adminReadErrorMessage(res) };
  }
  const data = (await res.json()) as T;
  return { ok: true, data };
}

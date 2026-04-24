import type { MutableRefObject } from "react";

export type UploadProgressPayload = Readonly<{
  progress: number;
  loadedBytes: number;
  totalBytes: number;
}>;

function readErrorFromJsonText(text: string): string | null {
  try {
    const j = JSON.parse(text) as { message?: string; error?: string };
    if (typeof j.message === "string" && j.message.length > 0) return j.message;
    if (typeof j.error === "string" && j.error.length > 0) return j.error;
  } catch {
    /* ignore */
  }
  return null;
}

function parseJsonResult<T>(status: number, text: string): { ok: true; data: T } | { ok: false; message: string } {
  if (status < 200 || status >= 300) {
    return { ok: false, message: readErrorFromJsonText(text) ?? `Error ${status}` };
  }
  try {
    return { ok: true, data: JSON.parse(text) as T };
  } catch {
    return { ok: false, message: "Respuesta inválida del servidor." };
  }
}

/**
 * POST multipart con cookies; progreso del body vía xhr.upload (no fetch).
 */
export function postFormDataWithUploadProgress<T>(
  url: string,
  formData: FormData,
  fileSizeBytes: number,
  onProgress: (p: UploadProgressPayload) => void,
  xhrRef?: MutableRefObject<XMLHttpRequest | null>
): Promise<{ ok: true; data: T } | { ok: false; message: string }> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    if (xhrRef !== undefined) {
      xhrRef.current = xhr;
    }
    xhr.open("POST", url);
    xhr.withCredentials = true;
    xhr.responseType = "text";

    xhr.upload.onprogress = (event: ProgressEvent) => {
      const total =
        event.lengthComputable && event.total > 0 ? event.total : Math.max(1, fileSizeBytes);
      const loaded = event.loaded;
      const progress =
        total > 0 ? Math.min(100, Math.round((100 * loaded) / total)) : loaded > 0 ? 1 : 0;
      onProgress({ progress, loadedBytes: loaded, totalBytes: total });
    };

    xhr.onload = () => {
      if (xhrRef !== undefined) {
        xhrRef.current = null;
      }
      onProgress({
        progress: 100,
        loadedBytes: fileSizeBytes,
        totalBytes: Math.max(fileSizeBytes, 1)
      });
      resolve(parseJsonResult<T>(xhr.status, xhr.responseText));
    };

    xhr.onerror = () => {
      if (xhrRef !== undefined) {
        xhrRef.current = null;
      }
      resolve({ ok: false, message: "Error de red al subir el archivo." });
    };

    xhr.onabort = () => {
      if (xhrRef !== undefined) {
        xhrRef.current = null;
      }
      resolve({ ok: false, message: "Subida cancelada." });
    };

    xhr.send(formData);
  });
}

import busboy from "busboy";
import type { IncomingHttpHeaders } from "node:http";
import { Readable } from "node:stream";
import { finished } from "node:stream/promises";

function headersForBusboy(request: Request): IncomingHttpHeaders {
  const h: IncomingHttpHeaders = {};
  request.headers.forEach((value, key) => {
    h[key.toLowerCase()] = value;
  });
  return h;
}

export type SingleFileParseFailure = Readonly<{
  ok: false;
  status: number;
  error: string;
  message: string;
}>;

export type SingleFileParseSuccess = Readonly<{
  ok: true;
  buffer: Buffer;
  filename: string;
  mimeType: string;
}>;

export type SingleFileParseResult = SingleFileParseSuccess | SingleFileParseFailure;

type CollectedFile = Readonly<{
  buffer: Buffer;
  filename: string;
  mimeType: string;
}>;

/**
 * Multipart con un único campo archivo (`file`), acumulado en buffer (tamaños pequeños: poster/thumbnail).
 * No reutiliza el parser de video; evita `request.formData()` y lecturas dobles del body.
 */
export function parseSingleFileMultipart(
  request: Request,
  options: Readonly<{ fieldName: string; maxFileBytes: number }>
): Promise<SingleFileParseResult> {
  const ct = request.headers.get("content-type");
  if (ct === null || !ct.toLowerCase().includes("multipart/form-data")) {
    return Promise.resolve({
      ok: false,
      status: 400,
      error: "invalid_content_type",
      message: "Se esperaba multipart/form-data."
    });
  }

  const webBody = request.body;
  if (webBody === null) {
    return Promise.resolve({
      ok: false,
      status: 400,
      error: "no_body",
      message: "Cuerpo de petición vacío."
    });
  }

  return new Promise((resolve) => {
    let settled = false;
    const finish = (r: SingleFileParseResult) => {
      if (settled) return;
      settled = true;
      resolve(r);
    };

    const bb = busboy({
      headers: headersForBusboy(request),
      limits: {
        fileSize: options.maxFileBytes,
        files: 4,
        fields: 16,
        parts: 24
      }
    });

    let sawTargetField = false;
    let consumePromise: Promise<CollectedFile> | null = null;

    bb.on(
      "file",
      (
        fieldname: string,
        fileStream: Readable & { truncated?: boolean },
        info: { filename: string; mimeType: string; encoding: string }
      ) => {
        if (fieldname !== options.fieldName) {
          fileStream.resume();
          return;
        }
        if (sawTargetField) {
          fileStream.resume();
          return;
        }
        sawTargetField = true;

        const mimeType =
          info.mimeType === "" || info.mimeType === undefined ? "application/octet-stream" : info.mimeType;
        const filename =
          info.filename === "" || info.filename === undefined ? "upload.bin" : info.filename;

        fileStream.on("limit", () => {
          console.warn("[homeflix:single-file-multipart]", "multipart_file_stream_limit", { filename });
        });

        consumePromise = (async (): Promise<CollectedFile> => {
          const chunks: Buffer[] = [];
          let total = 0;
          fileStream.on("data", (chunk: Buffer | string | Uint8Array) => {
            const b = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
            total += b.length;
            if (total > options.maxFileBytes) {
              fileStream.destroy(
                Object.assign(new Error("Archivo demasiado grande."), { code: "max_size_exceeded" })
              );
            } else {
              chunks.push(b);
            }
          });
          await finished(fileStream);
          if (fileStream.truncated === true) {
            const err = new Error("Archivo truncado por límite de tamaño.") as NodeJS.ErrnoException;
            err.code = "max_size_exceeded";
            throw err;
          }
          const buffer = Buffer.concat(chunks);
          if (buffer.length === 0) {
            const err = new Error("Archivo vacío.") as NodeJS.ErrnoException;
            err.code = "empty_file";
            throw err;
          }
          return { buffer, filename, mimeType };
        })();
      }
    );

    bb.on("error", (err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[homeflix:single-file-multipart]", "busboy_error", {
        message,
        stack: err instanceof Error ? err.stack : null,
        err
      });
      finish({ ok: false, status: 400, error: "multipart_parse_error", message });
    });

    bb.on("partsLimit", () => {
      finish({ ok: false, status: 400, error: "parts_limit", message: "Demasiadas partes multipart." });
    });

    bb.on("filesLimit", () => {
      finish({
        ok: false,
        status: 400,
        error: "files_limit",
        message: "Demasiados archivos en el formulario."
      });
    });

    bb.on("finish", () => {
      if (settled) return;
      if (!sawTargetField || consumePromise === null) {
        finish({
          ok: false,
          status: 400,
          error: "file_required",
          message: `Debes adjuntar el campo ${options.fieldName}.`
        });
        return;
      }

      void consumePromise
        .then(({ buffer, filename, mimeType }) => {
          finish({ ok: true, buffer, filename, mimeType });
        })
        .catch((err: unknown) => {
          const message = err instanceof Error ? err.message : String(err);
          const code =
            err instanceof Error && "code" in err && typeof (err as NodeJS.ErrnoException).code === "string"
              ? (err as NodeJS.ErrnoException).code!
              : "upload_failed";
          console.error("[homeflix:single-file-multipart]", "consume_failed", {
            message,
            code,
            stack: err instanceof Error ? err.stack : null,
            err
          });
          const status =
            code === "max_size_exceeded" || message.includes("demasiado grande")
              ? 413
              : code === "empty_file"
                ? 400
                : 400;
          finish({ ok: false, status, error: code, message });
        });
    });

    try {
      const nodeReadable = Readable.fromWeb(webBody as Parameters<typeof Readable.fromWeb>[0]);
      nodeReadable.on("error", (err: Error) => {
        console.error("[homeflix:single-file-multipart]", "body_stream_error", {
          message: err.message,
          stack: err.stack
        });
        finish({ ok: false, status: 400, error: "body_read_error", message: err.message });
      });
      nodeReadable.pipe(bb);
    } catch (err) {
      console.error("[homeflix:single-file-multipart]", "fromWeb_failed", {
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : null
      });
      finish({
        ok: false,
        status: 500,
        error: "stream_setup_error",
        message: "No se pudo preparar el stream del cuerpo."
      });
    }
  });
}

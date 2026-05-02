import busboy from "busboy";
import type { IncomingHttpHeaders } from "node:http";
import { Readable } from "node:stream";
import { FAMILY_VIDEO_UPLOAD_MAX_BYTES } from "../../family/allowed-video-upload";
import { removeStoredFileMaybe, saveVideoUploadFromStream, type MediaUploadSuccess } from "./admin-media-storage";

function headersForBusboy(request: Request): IncomingHttpHeaders {
  const h: IncomingHttpHeaders = {};
  request.headers.forEach((value, key) => {
    h[key.toLowerCase()] = value;
  });
  return h;
}

export type VideoMultipartParseFailure = Readonly<{
  ok: false;
  status: number;
  error: string;
  message: string;
}>;

export type VideoMultipartParseSuccess = Readonly<{
  ok: true;
  saved: MediaUploadSuccess;
}>;

export type VideoMultipartParseResult = VideoMultipartParseSuccess | VideoMultipartParseFailure;

/**
 * Parsea `multipart/form-data` del campo `file` y escribe el video a disco vía stream
 * (sin `request.formData()`).
 */
export function parseVideoMultipartToDisk(request: Request): Promise<VideoMultipartParseResult> {
  const ct = request.headers.get("content-type");
  if (ct === null || !ct.toLowerCase().includes("multipart/form-data")) {
    return Promise.resolve({
      ok: false,
      status: 400,
      error: "invalid_content_type",
      message: "Se esperaba multipart/form-data con el campo file."
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
    const finish = (r: VideoMultipartParseResult) => {
      if (settled) return;
      settled = true;
      resolve(r);
    };

    const bb = busboy({
      headers: headersForBusboy(request),
      limits: {
        fileSize: FAMILY_VIDEO_UPLOAD_MAX_BYTES,
        files: 8,
        fields: 32,
        parts: 64
      }
    });

    let sawFileField = false;
    let uploadPromise: Promise<MediaUploadSuccess> | null = null;

    bb.on("file", (fieldname: string, fileStream: Readable & { truncated?: boolean }, info: { filename: string; mimeType: string; encoding: string }) => {
      if (fieldname !== "file") {
        fileStream.resume();
        return;
      }
      if (sawFileField) {
        fileStream.resume();
        return;
      }
      sawFileField = true;

      const mimeType =
        info.mimeType === "" || info.mimeType === undefined ? "application/octet-stream" : info.mimeType;
      const filename =
        info.filename === "" || info.filename === undefined ? "video.bin" : info.filename;

      fileStream.on("limit", () => {
        console.warn("[homeflix:video-upload]", "multipart_file_stream_limit", { filename });
      });

      uploadPromise = (async () => {
        const saved = await saveVideoUploadFromStream(fileStream, { filename, mimeType });
        if (fileStream.truncated === true) {
          await removeStoredFileMaybe(saved.publicPath);
          const err = new Error("Archivo truncado por límite de tamaño.") as NodeJS.ErrnoException;
          err.code = "max_size_exceeded";
          throw err;
        }
        return saved;
      })();
    });

    bb.on("error", (err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      const stack = err instanceof Error ? err.stack : null;
      console.error("[homeflix:video-upload]", "busboy_error", { message, stack, err });
      finish({
        ok: false,
        status: 400,
        error: "multipart_parse_error",
        message
      });
    });

    bb.on("partsLimit", () => {
      console.warn("[homeflix:video-upload]", "multipart_parts_limit");
      finish({
        ok: false,
        status: 400,
        error: "parts_limit",
        message: "Demasiadas partes en el multipart."
      });
    });

    bb.on("filesLimit", () => {
      console.warn("[homeflix:video-upload]", "multipart_files_limit");
      finish({
        ok: false,
        status: 400,
        error: "files_limit",
        message: "Demasiados archivos en el formulario."
      });
    });

    // Busboy 1.x es un Writable: `finish` tras consumir el cuerpo (ver implementación en node_modules/busboy).
    bb.on("finish", () => {
      if (settled) return;
      if (!sawFileField || uploadPromise === null) {
        finish({
          ok: false,
          status: 400,
          error: "file_required",
          message: "Debes adjuntar el campo file."
        });
        return;
      }

      void uploadPromise
        .then((saved) => {
          finish({ ok: true, saved });
        })
        .catch((err: unknown) => {
          const message = err instanceof Error ? err.message : String(err);
          const code =
            err instanceof Error && "code" in err && typeof (err as NodeJS.ErrnoException).code === "string"
              ? (err as NodeJS.ErrnoException).code!
              : "upload_failed";
          console.error("[homeflix:video-upload]", "stream_save_failed", {
            message,
            code,
            stack: err instanceof Error ? err.stack : null,
            err
          });
          const status =
            code === "max_size_exceeded" || message === "max_size_exceeded"
              ? 413
              : code === "invalid_mime" ||
                  code === "invalid_extension" ||
                  code === "empty_file" ||
                  code === "invalid_content_type"
                ? 400
                : 503;
          finish({ ok: false, status, error: code, message });
        });
    });

    try {
      const nodeReadable = Readable.fromWeb(webBody as Parameters<typeof Readable.fromWeb>[0]);
      nodeReadable.on("error", (err: Error) => {
        console.error("[homeflix:video-upload]", "body_stream_error", {
          message: err.message,
          stack: err.stack
        });
        finish({
          ok: false,
          status: 400,
          error: "body_read_error",
          message: err.message
        });
      });
      nodeReadable.pipe(bb);
    } catch (err) {
      console.error("[homeflix:video-upload]", "fromWeb_failed", {
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

import type {
  ApiError as ApiErrorContract,
  CatalogErrorCode,
  MediaPipelineErrorCode
} from "@homeflix/contracts";

export class ApiError extends Error {
  readonly code: string;
  readonly details?: ApiErrorContract["details"];
  readonly statusCode: number;

  constructor(
    statusCode: number,
    code:
      | CatalogErrorCode
      | MediaPipelineErrorCode
      | "request_error"
      | "internal_error",
    message: string,
    details?: ApiErrorContract["details"]
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

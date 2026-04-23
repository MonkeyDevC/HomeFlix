import type { JsonValue } from "@homeflix/types";

export interface ApiError {
  readonly code: string;
  readonly message: string;
  readonly requestId?: string;
  readonly details?: JsonValue;
}

export interface ApiSuccess<TData> {
  readonly ok: true;
  readonly data: TData;
}

export interface ApiFailure {
  readonly ok: false;
  readonly error: ApiError;
}

export type ApiResponse<TData> = ApiSuccess<TData> | ApiFailure;

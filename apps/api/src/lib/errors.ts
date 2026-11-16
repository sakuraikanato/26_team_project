import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

export type ErrorCode =
  | "INVALID_PARAMS"
  | "INVALID_INVITE_CODE"
  | "UNAUTHORIZED"
  | "INVALID_CREDENTIALS"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "EMAIL_TAKEN"
  | "USERNAME_TAKEN"
  | "FILE_TOO_LARGE"
  | "INTERNAL_ERROR"
  | "WEATHER_UNAVAILABLE";

export interface ErrorDetail {
  field: string;
  message: string;
}

export class ApiError extends Error {
  readonly status: ContentfulStatusCode;
  readonly code: ErrorCode;
  readonly details?: ErrorDetail[];

  constructor(
    status: ContentfulStatusCode,
    code: ErrorCode,
    message: string,
    details?: ErrorDetail[],
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function errorJson(
  c: Context,
  status: ContentfulStatusCode,
  code: ErrorCode,
  message: string,
  details?: ErrorDetail[],
) {
  return c.json(
    {
      code,
      message,
      ...(details && details.length > 0 ? { details } : {}),
    },
    status,
  );
}

export function handleError(err: unknown, c: Context) {
  if (err instanceof ApiError) {
    return errorJson(c, err.status, err.code, err.message, err.details);
  }
  console.error("[API Error]", err);
  return errorJson(c, 500, "INTERNAL_ERROR", "サーバーエラーが発生しました");
}


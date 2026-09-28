import type { Response } from "express";

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiError {
  success: false;
  error: {
    message: string;
    code: string;
    details?: unknown;
  };
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  status = 200,
  meta?: Record<string, unknown>,
): void {
  const body: ApiSuccess<T> = { success: true, data, ...(meta ? { meta } : {}) };
  res.status(status).json(body);
}

export function sendError(
  res: Response,
  status: number,
  message: string,
  code = "ERROR",
  details?: unknown,
): void {
  const body: ApiError = { success: false, error: { message, code, details } };
  res.status(status).json(body);
}

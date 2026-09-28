import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/app-error";
import { sendError } from "../utils/api-response";
import { logger } from "../utils/logger";

/**
 * Must be registered LAST, after all routes. Express recognizes an error
 * middleware by its 4-argument signature — do not remove any of them even
 * though `next` is unused, or Express will treat this as a normal handler.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction): void {
  if (err instanceof AppError) {
    if (err.status >= 500) {
      logger.error(err.message, { code: err.code, path: req.path, details: err.details });
    } else {
      logger.warn(err.message, { code: err.code, path: req.path });
    }
    sendError(res, err.status, err.message, err.code, err.details);
    return;
  }

  const message = err instanceof Error ? err.message : "Unknown error";
  logger.error("Unhandled error", { message, path: req.path });
  sendError(res, 500, "Something went wrong on the server", "INTERNAL_ERROR");
}

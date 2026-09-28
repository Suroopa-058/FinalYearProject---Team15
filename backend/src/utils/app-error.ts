/**
 * Base class for expected, "operational" errors that should be surfaced to
 * the client with a specific status code and machine-readable code — as
 * opposed to unexpected bugs, which the error middleware treats as 500s.
 */
export class AppError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(message: string, status = 500, code = "INTERNAL_ERROR", details?: unknown) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
    this.details = details;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(
      id ? `${resource} with id "${id}" was not found` : `${resource} was not found`,
      404,
      "NOT_FOUND",
    );
    this.name = "NotFoundError";
  }
}

export class ValidationError extends AppError {
  constructor(details: unknown) {
    super("Request validation failed", 400, "VALIDATION_ERROR", details);
    this.name = "ValidationError";
  }
}

/** Thrown by the ML layer when no trained model artifact has been loaded yet. */
export class ModelNotLoadedError extends AppError {
  constructor(message = "The ML model artifact has not been integrated yet") {
    super(message, 503, "MODEL_NOT_LOADED");
    this.name = "ModelNotLoadedError";
  }
}

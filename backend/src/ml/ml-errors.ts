import { AppError } from "../utils/app-error";

/**
 * Raised whenever the FastAPI ML service could not be reached at all
 * (connection refused, DNS failure, timeout) — as opposed to a valid
 * HTTP error response FROM the service (see MlServiceHttpError below).
 * Callers generally treat this as "the ML service is currently
 * unavailable" rather than a client input problem.
 */
export class MlServiceUnreachableError extends AppError {
  constructor(cause: string) {
    super(
      `Could not reach the ML service: ${cause}`,
      503,
      "ML_SERVICE_UNREACHABLE",
    );
    this.name = "MlServiceUnreachableError";
  }
}

/**
 * Raised when the FastAPI service responded, but with a non-2xx status.
 * Preserves the original status and FastAPI's own `detail` message
 * (from HTTPException) so the caller can decide how to surface it —
 * e.g. a 400 "unknown class code" should reach the API consumer as a
 * 400 with that exact detail, not a generic 500.
 */
export class MlServiceHttpError extends AppError {
  constructor(public readonly upstreamStatus: number, detail: string) {
    super(detail, upstreamStatus, "ML_SERVICE_ERROR");
    this.name = "MlServiceHttpError";
  }
}

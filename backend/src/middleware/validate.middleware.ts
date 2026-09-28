import type { NextFunction, Request, Response } from "express";
import type { ZodTypeAny } from "zod";
import { ValidationError } from "../utils/app-error";

type RequestPart = "body" | "params" | "query";

/**
 * validate(schema) — parses req[part] against a Zod schema, replaces it
 * with the parsed (and coerced/defaulted) value, and forwards a
 * ValidationError with the full Zod issue list on failure.
 */
export function validate(schema: ZodTypeAny, part: RequestPart = "body") {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[part]);
    if (!result.success) {
      next(new ValidationError(result.error.flatten()));
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (req as any)[part] = result.data;
    next();
  };
}
